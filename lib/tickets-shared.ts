/**
 * E-ticket values shared between server and client (no imports, no server-only
 * deps). The server-only logic lives in `lib/tickets.ts`.
 */

export const TICKET_SLIP_BUCKET = "ticket-slips";
export const MAX_SLIP_BYTES = 5 * 1024 * 1024;
export const MAX_TICKETS_PER_PURCHASE = 10;
export const ALLOWED_SLIP_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type TicketPurchaseStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "cancelled";

export const PURCHASE_STATUS_LABEL: Record<TicketPurchaseStatus, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export type TicketSettings = {
  priceLkr: number;
  capacity: number;
  salesOpen: boolean;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankInstructions: string;
};

export type TicketAvailability = {
  capacity: number;
  taken: number;
  left: number;
  salesOpen: boolean;
};

export function formatLkr(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}
