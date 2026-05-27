import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { isCSRFNeeded } from "../utils/security-routes";

const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.path === "/api/payments/webhook" || isCSRFNeeded(req)) {
    return next();
  }

  const token =
    req.cookies?.[CSRF_COOKIE] || crypto.randomBytes(32).toString("hex");
  const hadTokenCookie = Boolean(req.cookies?.[CSRF_COOKIE]);
  if (!hadTokenCookie) {
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const headerToken = req.header(CSRF_HEADER);

  if (!headerToken) {
    return next(new AppError("Missing CSRF token", 403));
  }

  const headerBuffer = Buffer.from(headerToken);
  const tokenBuffer = Buffer.from(token);

  if (headerBuffer.length !== tokenBuffer.length) {
    return next(new AppError("Invalid CSRF token", 403));
  }

  const isValid = crypto.timingSafeEqual(headerBuffer, tokenBuffer);

  if (!isValid) {
    return next(new AppError("Invalid CSRF token", 403));
  }

  return next();
};
