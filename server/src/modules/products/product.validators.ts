import { z } from "zod";

export const productSchema = z.object({
  storeId: z.string().min(3, "Store ID is required"),
  categoryId: z.string().optional(),
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  stock: z
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const lowStockQuerySchema = z.object({
  threshold: z.coerce.number().int().min(1).default(10),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  storeId: z.string().optional(), // optional filter
});