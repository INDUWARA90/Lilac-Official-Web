import { z } from "zod";
import { normalizeLkPhone } from "@/lib/validation/entry";
import { TSHIRT_SIZES } from "@/lib/tshirts-shared";

export const tshirtOrderSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  registrationNumber: z
    .string()
    .trim()
    .min(2, "Please enter your registration number.")
    .max(80),
  faculty: z.string().trim().min(2, "Please enter your faculty.").max(160),
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.email("Please enter a valid email address.").max(254),
  ),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .transform((v, ctx) => {
      const normalized = normalizeLkPhone(v);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid Sri Lankan phone number.",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  size: z.enum(TSHIRT_SIZES, { error: "Please select a T-shirt size." }),
  quantity: z.coerce.number().int().min(1).max(10),
  receiptPath: z.string().min(1).max(300),
});
