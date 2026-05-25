import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../security/jwt";
import { AppError } from "../utils/errors";

export type AuthRequest = Request & { user?: Record<string, any> };

export const requireAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization?.split(" ");
  const token = authorization?.[1] || req.cookies?.accessToken;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const user = verifyAccessToken(token);
    req.user = typeof user === "object" ? user : { id: user };
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired access token", 401));
  }
};
