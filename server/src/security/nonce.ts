import { Op } from "@sequelize/core";
import { RequestNonce } from "../models/requestNonce.model";

const NONCE_TTL_SECONDS = 300;
const NONCE_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

export const markNonce = async (nonce: string) => {
  if (!nonce) {
    return false;
  }

  try {
    await RequestNonce.create({
      nonce,
      expiresAt: new Date(Date.now() + NONCE_TTL_SECONDS * 1000),
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const hasSeenNonce = async (nonce: string) => {
  if (!nonce) {
    return false;
  }

  const stored = await RequestNonce.findByPk(nonce);
  if (!stored) {
    return false;
  }

  if (stored.expiresAt.getTime() <= Date.now()) {
    await stored.destroy();
    return false;
  }

  return true;
};

export const cleanupExpiredNonces = async () => {
  return RequestNonce.destroy({
    where: { expiresAt: { [Op.lte]: new Date() } },
  });
};

export const startNonceSweeper = (intervalMs = NONCE_SWEEP_INTERVAL_MS) => {
  const timer = setInterval(() => {
    cleanupExpiredNonces().catch(() => undefined);
  }, intervalMs);
  timer.unref();
  return timer;
};
