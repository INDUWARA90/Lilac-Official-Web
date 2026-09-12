import { z } from "zod";
import { normalizeLkPhone } from "@/lib/validation/entry";
import { MAX_TICKETS_PER_PURCHASE } from "@/lib/tickets-shared";

/**
 * Server-side schema for a ticket purchase. The client form validates with the
 * same schema; `/api/tickets` is the authority.
 */
export const ticketPurchaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "That name is too long."),

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
          message: "Enter a valid Sri Lankan phone number, e.g. 077 123 4567.",
        });
        return z.NEVER;
      }
      return normalized;
    }),

  quantity: z.coerce
    .number()
    .int("Choose a whole number of tickets.")
    .min(1, "Choose at least one ticket.")
    .max(MAX_TICKETS_PER_PURCHASE, `Up to ${MAX_TICKETS_PER_PURCHASE} tickets per purchase.`),

  // Storage path of the uploaded bank slip (from /api/tickets/upload-url).
  slipPath: z.string().min(1, "Please attach your bank transfer slip.").max(200),
});

export type TicketPurchaseInput = z.infer<typeof ticketPurchaseSchema>;

/**
 * Buyer self-service status lookup — just their phone or email, no reference
 * needed (matched against both in lib/tickets.ts, whichever the input looks
 * like). Deliberately loose here: the real matching/normalisation happens
 * server-side so this only rejects empty input, not "this doesn't look like
 * an email".
 */
export const ticketStatusLookupSchema = z.object({
  contact: z
    .string()
    .trim()
    .min(1, "Enter the phone or email you used to buy your ticket.")
    .max(254),
});

export type TicketStatusLookupInput = z.infer<typeof ticketStatusLookupSchema>;
