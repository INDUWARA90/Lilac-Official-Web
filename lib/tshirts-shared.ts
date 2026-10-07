export const TSHIRT_RECEIPT_BUCKET = "tshirt-receipts";
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const TSHIRT_SIZES = ["M", "L", "XL", "XXL"] as const;
export const TSHIRT_SIZE_CHART = [
  [TSHIRT_SIZES[0], "20", "26.5", "9.5"],
  [TSHIRT_SIZES[1], "22", "28", "10"],
  [TSHIRT_SIZES[2], "24", "29", "11"],
  [TSHIRT_SIZES[3], "26", "31", "12"],
] as const;
export const TSHIRT_COLORS = ["White", "Black"] as const;
export const MAX_TSHIRT_ORDER_QUANTITY = 3;
export const TSHIRT_ORDER_STATUS = ["pending_review", "payment_collected", "rejected", "cancelled"] as const;
export type TshirtOrderStatus = (typeof TSHIRT_ORDER_STATUS)[number];
export const TSHIRT_STATUS_LABEL: Record<TshirtOrderStatus, string> = {
  pending_review: "Awaiting review", payment_collected: "Payment collected", rejected: "Rejected", cancelled: "Cancelled",
};
