import CryptoJS from "crypto-js";

export const computeHmac = (message: string, secret:string) => {
  return CryptoJS.HmacSHA256(message, secret).toString();
};

export const verifyHmac = (message: string, signature: string, secret:string) => {
  return computeHmac(message, secret) === signature;
};
