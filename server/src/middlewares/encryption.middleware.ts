import { Request, Response, NextFunction } from "express";
import { decryptPayload } from "../security/aes";
import { isBootstrapAuthRoute } from "../utils/skip";

export const decryptRequestBody = (req: Request, _res: Response, next: NextFunction) => {
  if (isBootstrapAuthRoute(req)) {
    return next();
  }

  const encrypted = req.body?.data;
  if (typeof encrypted === "string") {
    try {
      const secret = (req as Request & { hmacSecret?: string }).hmacSecret || process.env.HMAC_SECRET!;
      req.body = decryptPayload(encrypted, secret);
    } catch {
      return next(new Error("Unable to decrypt request payload"));
    }
  }
  next();
};
