import { Request } from "express";

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

export const skipPaths = [
  "/api/payments/webhook",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
];


export const isBootstrapAuthRoute = (req:Request): boolean => {
   return skipPaths.includes(getRequestPath(req));
}