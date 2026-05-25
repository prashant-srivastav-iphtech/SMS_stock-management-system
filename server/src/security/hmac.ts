import CryptoJS from "crypto-js";

const HMAC_SECRET = process.env.HMAC_SECRET!

export const computeHmac = (message: string, secret = HMAC_SECRET) => {
  return CryptoJS.HmacSHA256(message, secret).toString();
};

export const verifyHmac = (message: string, signature: string, secret = HMAC_SECRET) => {
  return computeHmac(message, secret) === signature;
};
