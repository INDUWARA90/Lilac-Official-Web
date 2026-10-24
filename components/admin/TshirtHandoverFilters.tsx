"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function TshirtHandoverFilters({
  query,
  view,
  faculty,
  faculties,
  round = "new",
}: {
  query: string;
  view: "all" | "given" | "waiting";
  faculty: string;
  faculties: readonly string[];
  round?: "new" | "previous";
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [selectedFaculty, setSelectedFaculty] = useState(faculty);

  useEffect(() => {
    setSearch(query);
    setSelectedFaculty(faculty);
  }, [query, faculty]);

  const navigate = (nextSearch: string, nextFaculty: string) => {
    const params = new URLSearchParams();
    if (view !== "all") params.set("view", view);
    if (round === "previous") params.set("round", "previous");
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextFaculty) params.set("faculty", nextFaculty);
    const suffix = params.size ? `?${params}` : "";
    router.replace(`/admin/tshirts/handover${suffix}`);
  };

  const clear = () => {
    setSearch("");
    setSelectedFaculty("");
    const clearParams = new URLSearchParams();
    if (view !== "all") clearParams.set("view", view);
    if (round === "previous") clearParams.set("round", "previous");
    const suffix = clearParams.size ? `?${clearParams}` : "";
    router.replace(`/admin/tshirts/handover${suffix}`);
  };

  return <form onSubmit={(event) => { event.preventDefault(); navigate(search, selectedFaculty); }} className="mt-5 flex max-w-3xl flex-wrap gap-2">
    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, registration number, or reference" className="min-w-0 flex-1 rounded-field border border-hairline bg-transparent px-3 py-2 font-sans text-sm text-ink focus:border-accent focus:outline-none" />
    <select value={selectedFaculty} onChange={(event) => { const nextFaculty = event.target.value; setSelectedFaculty(nextFaculty); navigate(query, nextFaculty); }} className="rounded-field border border-hairline bg-transparent px-3 py-2 font-sans text-sm text-ink focus:border-accent focus:outline-none"><option value="">All faculties</option>{faculties.map((name) => <option key={name} value={name}>{name}</option>)}</select>
    <button type="submit" className="rounded-field bg-accent px-4 py-2 font-sans text-sm font-medium text-white hover:bg-accent-strong">Find</button>
    {(query || faculty || view !== "all") && <button type="button" onClick={clear} className="rounded-field border border-hairline px-4 py-2 font-sans text-sm text-ink-muted hover:border-accent hover:text-accent-strong">Clear</button>}
  </form>;
}
