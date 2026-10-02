export const TSHIRT_RECEIPT_BUCKET = "tshirt-receipts";
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const TSHIRT_ORDER_STATUS = ["pending_review", "payment_collected", "rejected", "cancelled"] as const;
export type TshirtOrderStatus = (typeof TSHIRT_ORDER_STATUS)[number];
export const TSHIRT_STATUS_LABEL: Record<TshirtOrderStatus, string> = {
  pending_review: "Awaiting review", payment_collected: "Payment collected", rejected: "Rejected", cancelled: "Cancelled",
};
