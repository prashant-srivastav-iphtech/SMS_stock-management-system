import { z } from "zod";

export const storeSchema = z.object({
  slug: z.string().min(1, "SKU is required"),
  name: z.string().min(2, "Store name is required"),
});
