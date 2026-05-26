import pino from "pino";
import { env } from "../utils/envValidator";

export const logger = pino({
  name: "--oms--",
  level: process.env.LOG_LEVEL || "info",
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  base: { service: "--oms--" },
});
