import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/api/payments/webhook") {
    return next();
  }

  const token = req.cookies?.[CSRF_COOKIE] || crypto.randomBytes(32).toString("hex");
  const hadTokenCookie = Boolean(req.cookies?.[CSRF_COOKIE]);
  if (!hadTokenCookie) {
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  if (!hadTokenCookie) {
    return next();
  }

  if (req.header(CSRF_HEADER) !== token) {
    return next(new AppError("Invalid CSRF token", 403));
  }

  return next();
};
