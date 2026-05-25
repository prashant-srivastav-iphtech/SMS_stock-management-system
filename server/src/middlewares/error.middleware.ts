import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { AppError } from "../utils/errors";

export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const startedAt = Date.now();
  logger.info({
    event: "request",
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body ? { ...req.body, password: undefined } : undefined,
    ip: req.ip,
  });

  _res.on("finish", () => {
    logger.info({
      event: "response",
      method: req.method,
      url: req.url,
      statusCode: _res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error =
    err instanceof AppError
      ? err
      : new AppError("Internal server error", 500, err);
  logger.error({
    event: "error",
    message: error.message,
    path: req.path,
    statusCode: error.statusCode,
    payload: error.payload,
  });

  res.status(error.statusCode).json({
    status: "error",
    message: error.message,
    ...(error.payload ? { details: error.payload } : {}),
  });
};
