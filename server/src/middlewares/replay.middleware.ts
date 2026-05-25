import { Request, Response, NextFunction } from "express";
import { hasSeenNonce, markNonce } from "../security/nonce";
import { AppError } from "../utils/errors";
import {
  isBootstrapAuthRoute,
  isPaymentsWebhookRoute,
} from "../utils/security-routes";

export const replayProtection = async (req: Request, res: Response, next: NextFunction) => {
  if (isPaymentsWebhookRoute(req) || isBootstrapAuthRoute(req)) {
    return next();
  }

  const nonce = req.header("x-nonce");
  const timestamp = Number(req.header("x-timestamp"));

  if (!nonce || Number.isNaN(timestamp)) {
    return next(new AppError("Missing replay protection headers", 400));
  }

  const ageSeconds = Math.abs(Date.now() - timestamp) / 1000;
  if (ageSeconds > 300) {
    return next(new AppError("Request timestamp outside allowable window", 408));
  }

  if (await hasSeenNonce(nonce)) {
    return next(new AppError("Replay request detected", 409));
  }

  const added = await markNonce(nonce);
  if (!added) {
    return next(new AppError("Unable to register nonce", 500));
  }

  next();
};
