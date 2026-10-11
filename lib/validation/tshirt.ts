import { z } from "zod";
import { normalizeLkPhone } from "@/lib/validation/entry";
import { MAX_TSHIRT_ORDER_QUANTITY, TSHIRT_COLORS, TSHIRT_SIZES } from "@/lib/tshirts-shared";

const tshirtOrderFields = {
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
  items: z.array(z.object({
    size: z.enum(TSHIRT_SIZES, { error: "Please select a T-shirt size." }),
    color: z.enum(TSHIRT_COLORS, { error: "Please select a T-shirt color." }),
  })).min(1).max(MAX_TSHIRT_ORDER_QUANTITY),
  paidAmountLkr: z.number().int().min(1000, "Payment must be at least LKR 1,000 per T-shirt."),
};

function validatePaymentMinimum(
  order: { items: Array<unknown>; paidAmountLkr: number },
  ctx: z.RefinementCtx,
) {
  const minimum = order.items.length * 1000;
  if (order.paidAmountLkr < minimum) {
    ctx.addIssue({
      code: "custom",
      path: ["paidAmountLkr"],
      message: `Pay at least LKR ${minimum.toLocaleString("en-LK")} for ${order.items.length} T-shirt${order.items.length > 1 ? "s" : ""}.`,
    });
  }
}

export const tshirtOrderDetailsSchema = z.object(tshirtOrderFields)
  .superRefine(validatePaymentMinimum);

export const tshirtOrderSchema = z.object({
  ...tshirtOrderFields,
  receiptPath: z.string().min(1).max(300),
}).superRefine(validatePaymentMinimum);
