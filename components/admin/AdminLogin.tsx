"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Sparkle } from "@/components/ui/decor/Sparkle";

/** Email + password sign-in for the single admin (see /api/admin/login). */
export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; redirectTo?: string };
      if (data.ok) {
        router.push(data.redirectTo ?? "/admin");
        router.refresh();
      } else {
        setError(data.error ?? "Sign in failed.");
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12">
      {/* Background Decorative Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 size-72 rounded-full bg-[#7b539f]/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 size-72 rounded-full bg-[#9467c8]/10 blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-[#b79ddb]/30 bg-surface/80 p-8 shadow-[0_20px_50px_-20px_rgba(110,80,160,0.2)] backdrop-blur-xl sm:p-10">
        <Sparkle size={18} gold className="absolute right-8 top-8" delay={0.2} />

        {/* Header Badge & Title */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b79ddb]/40 bg-[#7b539f]/10 px-3.5 py-1 font-sans text-xs font-semibold uppercase tracking-widest text-[#7b539f]">
            <span>🪻</span> Admin Portal
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-ink">Welcome Back</h1>
          <p className="mt-2 text-sm text-ink-muted">Sign in to manage Lilac Live in Concert operations</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
          <TextField
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-center">
              <p className="font-sans text-xs font-medium text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={busy}
          >
            Sign in to Dashboard →
          </Button>
        </form>
      </div>
    </div>
  );
}