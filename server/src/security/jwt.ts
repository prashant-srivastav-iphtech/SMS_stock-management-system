import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../utils/envValidator";

const ACCESS_EXPIRES_IN = (env.JWT_ACCESS_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRES_IN = (env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export const generateAccessToken = (payload: any) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET! as Secret, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload: any) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET! as Secret, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET!);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET!);
};
