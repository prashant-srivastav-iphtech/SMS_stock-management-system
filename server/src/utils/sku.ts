import crypto from "crypto";

export const generateSku = (name: string, category?: string) => {
  const prefix = (category || name)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();

  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${prefix}-${random}`;
};
