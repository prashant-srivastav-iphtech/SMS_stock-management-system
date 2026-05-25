import CryptoJS from "crypto-js";

const DEFAULT_AES_SECRET = process.env.AES_SECRET!

export const encryptPayload = (payload: any, secret = DEFAULT_AES_SECRET) => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(payload),
    secret,
  ).toString();
};
 
export const decryptPayload = (encrypted: string, secret = DEFAULT_AES_SECRET) => {
  const bytes = CryptoJS.AES.decrypt(encrypted, secret);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  if (decrypted) {
    return JSON.parse(decrypted);
  }

  if (process.env.NODE_ENV !== "production") {
    const legacyBytes = CryptoJS.AES.decrypt(encrypted, secret);
    const legacyDecrypted = legacyBytes.toString(CryptoJS.enc.Utf8);
    if (legacyDecrypted) {
      return JSON.parse(legacyDecrypted);
    }
  }

  throw new Error("Unable to decrypt request payload");
};
