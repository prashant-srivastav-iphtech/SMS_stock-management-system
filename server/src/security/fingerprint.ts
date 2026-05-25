import { Request } from "express";

export const buildDeviceFingerprint = (req: Request) => {
  const browser = req.headers["user-agent"] || "unknown";
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const accept = req.headers.accept || "unknown";
  const language = req.headers["accept-language"] || "unknown";

  return `${browser}:${ip}:${accept}:${language}`;
};

export const verifyDeviceFingerprint = (
  req: Request,
  expected: string | undefined,
) => {
  if (!expected) {
    return false;
  }

  return buildDeviceFingerprint(req) === expected;
};
