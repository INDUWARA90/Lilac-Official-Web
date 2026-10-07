"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FilterOption = { value: string; label: string };

export function TshirtOrderFilters({
  initialQuery,
  initialStatus,
  statuses,
}: {
  initialQuery: string;
  initialStatus: string;
  statuses: readonly FilterOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (status) params.set("status", status);
      const queryString = params.toString();
      router.replace(queryString ? `/admin/tshirts?${queryString}` : "/admin/tshirts", {
        scroll: false,
      });
    }, query === initialQuery ? 0 : 300);

    return () => window.clearTimeout(timeout);
  }, [query, status, initialQuery, router]);

  return (
    <div className="mt-5 grid gap-3 rounded-card border border-hairline p-4 sm:grid-cols-2">
      <label className="font-sans text-xs font-medium text-ink-muted">
        Search buyer / reference
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, email, registration, reference"
          autoComplete="off"
          className="mt-1 block min-h-10 w-full rounded-field border border-hairline bg-canvas px-3 text-sm text-ink"
        />
      </label>
      <FilterSelect
        label="Payment status"
        value={status}
        onChange={setStatus}
        options={statuses}
      />
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setStatus("");
          }}
          className="inline-flex min-h-10 items-center rounded-field border border-hairline px-4 font-sans text-sm text-ink-muted hover:border-accent"
        >
          Clear filters
        </button>
        <span aria-live="polite" className="pb-2 font-sans text-xs text-ink-muted">
          Search updates as you type.
        </span>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | readonly FilterOption[];
}) {
  return (
    <label className="font-sans text-xs font-medium text-ink-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block min-h-10 w-full rounded-field border border-hairline bg-canvas px-3 text-sm text-ink"
      >
        <option value="">All</option>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}
      </select>
    </label>
  );
}
