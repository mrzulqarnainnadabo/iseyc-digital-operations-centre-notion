"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorBanner } from "@/components/ErrorBanner";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Sign-in failed."); return; }
      router.push("/ops"); router.refresh();
    } catch { setError("Network error. Check your connection and try again."); }
    finally { setPending(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <form onSubmit={onSubmit} aria-describedby="login-help" className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">← Gate</Link>
        <h1 className="font-serif text-2xl text-slate-950">Officer sign-in</h1>
        <p id="login-help" className="text-sm leading-6 text-slate-600">Enter the institutional staff key. Verification happens server-side; the key is not stored in the browser.</p>
        <div>
          <label className="text-sm font-semibold text-slate-900" htmlFor="key">Staff key <span aria-hidden="true">*</span></label>
          <input id="key" name="key" type="password" autoComplete="current-password" value={key} onChange={(e) => setKey(e.target.value)} required aria-invalid={Boolean(error)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 text-slate-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200" />
        </div>
        {error ? <ErrorBanner message={error} /> : null}
        <button type="submit" disabled={pending} aria-busy={pending} className="min-h-[52px] w-full rounded-xl bg-slate-950 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Checking…" : "Enter operations"}
        </button>
      </form>
    </div>
  );
}
