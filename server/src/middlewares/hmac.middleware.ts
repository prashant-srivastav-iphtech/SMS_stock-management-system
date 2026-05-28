import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../security/jwt";
import { Session } from "../models/session.model";
import { isBootstrapAuthRoute } from "../utils/skip";

const computeSignature = (secret: string, message: string) =>
  crypto.createHmac("sha256", secret).update(message).digest("hex");

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
};

const extractAccessToken = (req: Request): string | undefined => {
  const header = req.headers.authorization?.split(" ");
  if (header && header[0] === "Bearer" && header[1]) return header[1];
  return req.cookies?.accessToken;
};

const resolveSecret = async (
  req: Request,
): Promise<{ secret: string; mode: "bootstrap" | "session" } | null> => {
  const token = extractAccessToken(req);
  if (!token) {
    return { secret: process.env.HMAC_SECRET || "", mode: "bootstrap" };
  }

  let payload: any;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return null;
  }

  const sessionId =
    typeof payload === "object" ? payload?.sessionId : undefined;
  if (!sessionId) return null;

  const session = await Session.findByPk(sessionId);
  if (!session) return null;

  return { secret: session.hmacSecret, mode: "session" };
};

export const verifyHmac = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (isBootstrapAuthRoute(req)) {
    return next();
  }

  const signature = req.headers["x-signature"] as string | undefined;
  const timestamp =
    (req.headers["x-timestamp"] as string | undefined) || req.body?.timestamp;
  const nonce =
    (req.headers["x-nonce"] as string | undefined) || req.body?.nonce;
  const encryptedPayload =
    typeof req.body?.data === "string" ? req.body.data : "";

  if (!signature || !timestamp || !nonce) {
    return res.status(401).json({
      success: false,
      message: "Missing request signature",
    });
  }

  const resolved = await resolveSecret(req);
  if (!resolved || !resolved.secret) {
    return res.status(401).json({
      success: false,
      message: "Invalid request signature",
    });
  }

  const message = `${timestamp}:${nonce}:${encryptedPayload}`;
  const expected = computeSignature(resolved.secret, message);

  if (!safeEqual(expected, signature)) {
    return res.status(401).json({
      success: false,
      message: "Invalid request signature",
    });
  }

  (req as Request & { hmacSecret?: string }).hmacSecret = resolved.secret;

  next();
};
