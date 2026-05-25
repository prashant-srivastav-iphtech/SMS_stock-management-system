import { Request, Response, NextFunction } from "express";
import { buildDeviceFingerprint } from "../security/fingerprint";

export const deviceFingerprint = (req: Request, _res: Response, next: NextFunction) => {
  const fingerprint = buildDeviceFingerprint(req);

  req.headers["x-device-fingerprint"] = fingerprint as any;
  next();
};
