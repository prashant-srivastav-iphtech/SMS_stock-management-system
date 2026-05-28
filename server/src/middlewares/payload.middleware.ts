import crypto, { randomUUID } from "crypto";
import CryptoJS from "crypto-js";
import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../security/jwt";
import { Session } from "../models";
import { skipPaths } from "../utils/skip";
const stripQuery = (value: string) => value.split("?")[0];

const getRequestPath = (req: Request) => {
  if (req.originalUrl) {
    return stripQuery(req.originalUrl);
  }

  if (req.baseUrl || req.path) {
    return `${req.baseUrl || ""}${req.path || ""}`;
  }

  return req.path;
};

export const isBootstrapAuthRoute = (req: Request): boolean => {
  return skipPaths.includes(getRequestPath(req));
};

export const encryptPayload = (payload: any, secret: string) => {
  return CryptoJS.AES.encrypt(JSON.stringify(payload), secret).toString();
};
export const computeHmac = (message: string, secret: string) => {
  return CryptoJS.HmacSHA256(message, secret).toString();
};
export const decryptPayload = (encrypted: string, secret: string) => {
  const bytes = CryptoJS.AES.decrypt(encrypted, secret);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  if (decrypted) {
    return JSON.parse(decrypted);
  }

  if (process.env.NODE_ENV !== "production") {
    const legacyBytes = CryptoJS.AES.decrypt(encrypted, secret);
    const legacyDecrypted = legacyBytes.toString(CryptoJS.enc.Utf8);
    if (legacyDecrypted) {
      return JSON.parse(legacyDecrypted);
    }
  }

  throw new Error("Unable to decrypt request payload");
};

type JsonResponse = Response["json"];

export const encryptResponseBody = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json.bind(res) as JsonResponse;

  res.json = ((body: unknown) => {
    if (isBootstrapAuthRoute(req)) {
      return originalJson(body);
    }

    const timestamp = Date.now().toString();
    const nonce = randomUUID();
    const secret =
      (req as Request & { hmacSecret?: string }).hmacSecret ||
      process.env.HMAC_SECRET!;
    const encryptedData = encryptPayload(body, secret);
    const signature = computeHmac(
      `${timestamp}:${nonce}:${encryptedData}`,
      secret,
    );

    res.setHeader("x-signature", signature);

    return originalJson({
      data: encryptedData,
      timestamp,
      nonce,
    });
  }) as JsonResponse;

  next();
};

export const decryptRequestBody = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (isBootstrapAuthRoute(req)) {
    return next();
  }

  const encrypted = req.body?.data;
  if (typeof encrypted === "string") {
    try {
      const secret =
        (req as Request & { hmacSecret?: string }).hmacSecret ||
        process.env.HMAC_SECRET!;
      req.body = decryptPayload(encrypted, secret);
    } catch {
      return next(new Error("Unable to decrypt request payload"));
    }
  }
  next();
};


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
