"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Applies the delivery filter immediately while preserving the other ticket filters. */
export function TicketEmailDeliveryFilter({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      name="email"
      value={value}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams.toString());
        if (event.target.value) params.set("email", event.target.value);
        else params.delete("email");
        params.delete("page");
        const query = params.toString();
        router.push(query ? `/admin/tickets?${query}` : "/admin/tickets");
      }}
      className="rounded-field border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
    >
      <option value="">All email statuses</option>
      <option value="not_queued">Not queued</option>
      <option value="pending">Queued</option>
      <option value="sending">Sending</option>
      <option value="sent">Sent</option>
      <option value="failed">Failed</option>
    </select>
  );
}
