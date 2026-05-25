import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

export const adminOnly = (req: Request, _res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }
  next();
};
