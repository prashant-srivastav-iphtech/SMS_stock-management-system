import { z } from "zod";

export const productSchema = z.object({
  storeId: z.string().min(3, "Store ID is required"),
  categoryId: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  stock: z.number().int("Stock must be an integer").min(0, "Stock cannot be negative"),
});
