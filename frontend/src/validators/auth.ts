import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Enter a valid email" }),
  password: z.string().min(8, { message: "Password must have at least 8 characters" }),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, { message: "Please enter your first name" }),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Enter a valid email" }),
  password: z.string().min(8, { message: "Password must have at least 8 characters" }),
});
