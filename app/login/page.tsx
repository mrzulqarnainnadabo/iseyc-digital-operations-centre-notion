"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-in failed");
        return;
      }
      router.push("/ops");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <Link href="/" className="text-sm text-emerald-800 hover:underline">
          ← Gate
        </Link>
        <h1 className="font-serif text-2xl text-slate-950">Officer sign-in</h1>
        <p className="text-sm text-slate-600">
          Enter the institutional staff key. Verified server-side; stored as a signed session cookie
          only.
        </p>
        <label className="block text-sm font-medium" htmlFor="key">
          Staff key
        </label>
        <input
          id="key"
          type="password"
          autoComplete="current-password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="min-h-[48px] w-full rounded-xl border border-slate-300 px-3"
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-[52px] w-full rounded-xl bg-slate-950 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Checking…" : "Enter operations"}
        </button>
      </form>
    </div>
  );
}
