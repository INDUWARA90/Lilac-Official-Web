import { z } from "zod";

/**
 * Server-side schema for a raffle entry. The client form validates too, but this
 * is the authority (brief security: "All form input validated server-side with a
 * schema library, regardless of client-side validation").
 */

// --- Reference lists (also used to build the form's <select>s) --------------

export const SRI_LANKAN_DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
] as const;

export const AGE_RANGES = [
  "Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+",
] as const;

export const GENDER_OPTIONS = [
  "Female", "Male", "Non-binary", "Prefer not to say",
] as const;

// --- Sri Lankan phone normalisation ----------------------------------------

/**
 * Normalise a Sri Lankan phone number to E.164 (`+94XXXXXXXXX`), or return null
 * if it can't be a valid SL number. Accepts the common ways people type it:
 * `0771234567`, `771234567`, `+94771234567`, `0094 77 123 4567`, with spaces,
 * dashes or parens. The 9-digit subscriber number must start 1–9 (covers both
 * mobiles, which start 7, and landlines).
 */
export function normalizeLkPhone(raw: string): string | null {
  const trimmed = raw.trim();
  const hadPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  let subscriber: string | null = null;
  if (hadPlus && digits.startsWith("94") && digits.length === 11) {
    subscriber = digits.slice(2);
  } else if (digits.startsWith("0094") && digits.length === 13) {
    subscriber = digits.slice(4);
  } else if (digits.startsWith("94") && digits.length === 11) {
    subscriber = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 10) {
    subscriber = digits.slice(1);
  } else if (digits.length === 9) {
    subscriber = digits;
  }

  if (!subscriber || !/^[1-9]\d{8}$/.test(subscriber)) return null;
  return `+94${subscriber}`;
}

// --- Schema ---------------------------------------------------------------

export const entryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "That name is too long."),

  // preprocess trims + lowercases before the format check, so "  A@B.COM " is
  // stored as "a@b.com".
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.email("Please enter a valid email address.").max(254),
  ),

  // Accept whatever the user typed; `.transform` normalises, then we re-check.
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

  address: z
    .string()
    .trim()
    .min(5, "Please enter your address.")
    .max(400, "That address is too long."),

  ageRange: z.enum(AGE_RANGES, { error: "Please select an age range." }),
  gender: z.enum(GENDER_OPTIONS, { error: "Please select an option." }),
  occupation: z.string().trim().max(120).optional().or(z.literal("")),
  district: z.enum(SRI_LANKAN_DISTRICTS, { error: "Please select your district." }),

  // Must be literally true — the disclosure checkbox about public name publication.
  consent: z.literal(true, {
    error: "You must agree before entering.",
  }),

  // Client-captured moment the ad finished / was skipped. Optional; clamped
  // server-side to "not in the future".
  adWatchedAt: z.iso.datetime().optional(),
});

export type EntryInput = z.infer<typeof entryInputSchema>;
