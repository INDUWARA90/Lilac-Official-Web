import { z } from "zod";

/** Contact form — validated server-side in /api/contact. */
export const contactInputSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.email("Please enter a valid email address.").max(254),
  ),
  message: z
    .string()
    .trim()
    .min(10, "Please enter a little more detail.")
    .max(4000, "That message is too long."),
  turnstileToken: z.string().optional().default(""),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
