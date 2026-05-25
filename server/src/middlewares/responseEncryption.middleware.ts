import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { encryptPayload } from "../security/aes";
import { computeHmac } from "../security/hmac";
import { isBootstrapAuthRoute } from "../utils/security-routes";

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
    const secret = (req as Request & { hmacSecret?: string }).hmacSecret || process.env.HMAC_SECRET || "change-me";
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
