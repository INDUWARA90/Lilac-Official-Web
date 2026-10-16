import type { TicketType } from "@/lib/tickets-shared";

export type TicketPurchaseValues = {
  name: string;
  registrationNumber: string;
  faculty: string;
  email: string;
  phone: string;
  ticketTypes: TicketType[];
  quantity: string;
};

export type TicketFieldErrors = Partial<Record<string, string>>;

export type TicketBank = {
  name: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  instructions: string;
};

export type TicketValueSetter = <K extends keyof TicketPurchaseValues>(
  key: K,
  value: TicketPurchaseValues[K],
) => void;
