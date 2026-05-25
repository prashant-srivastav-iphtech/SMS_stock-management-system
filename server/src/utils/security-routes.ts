import { Request } from "express";

const BOOTSTRAP_AUTH_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
]);

const stripQuery = (value: string) => value.split("?")[0];

export const getRequestPath = (req: Request) => {
  if (req.originalUrl) {
    return stripQuery(req.originalUrl);
  }

  if (req.baseUrl || req.path) {
    return `${req.baseUrl || ""}${req.path || ""}`;
  }

  return req.path;
};

export const isBootstrapAuthRoute = (req: Request) =>
  BOOTSTRAP_AUTH_ROUTES.has(getRequestPath(req));

export const isPaymentsWebhookRoute = (req: Request) =>
  getRequestPath(req) === "/api/payments/webhook";
