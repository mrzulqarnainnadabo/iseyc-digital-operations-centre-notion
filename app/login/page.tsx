"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [identityNotice, setIdentityNotice] = useState<string | null>(null);
  const [oidcConfigured, setOidcConfigured] = useState(false);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("oidc");
    if (result === "unavailable") {
      setIdentityNotice("Google sign-in is not configured yet. No production identity settings have been changed.");
    } else if (result === "failed") {
      setIdentityNotice("Google could not verify this sign-in. Try again or contact the system administrator.");
    }
    fetch("/ops/api/auth/oidc/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { providerConfigured?: boolean; identityVerified?: boolean; message?: string }) => {
        setOidcConfigured(data.providerConfigured === true);
        if (data.identityVerified && typeof data.message === "string") setIdentityNotice(data.message);
        else if (data.providerConfigured !== true && result !== "failed") setIdentityNotice("Google sign-in is not configured yet. Identity provider credentials and the canonical DOC host still need to be set up.");
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Access could not be confirmed.");
        return;
      }
      setKey("");
      router.push("/ops");
      router.refresh();
    } catch {
      setError("The sign-in service is unavailable. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream-50 px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-5 flex items-center gap-3">
          <img src="/iseyc-seal.svg" alt="ISEYC seal" width="42" height="42" className="rounded-full border border-gold-600 bg-white object-contain" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-700">ISEYC</p>
            <p className="max-w-[245px] text-xs font-semibold leading-4 text-forest-950">Initiative for Sustainable Evolution for Youth and Community</p>
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card sm:p-7">
          <div>
            <span className="inline-flex min-h-[26px] items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-900">Temporary access method</span>
            <h1 className="mt-3 font-serif text-2xl text-forest-950">Sign in</h1>
            
          </div>

          <div className="space-y-2">
            {oidcConfigured ? (
              <a href="/api/auth/oidc/start" className="inline-flex min-h-[48px] w-full items-center justify-center rounded-control border border-forest-900 bg-white px-4 text-sm font-semibold text-forest-900 hover:bg-forest-100">
                Sign in with Google
              </a>
            ) : (
              <p className="rounded-control border border-line bg-cream-50 px-3 py-3 text-sm text-ink-700">Google identity sign-in · Setup pending</p>
            )}
            <p className="text-xs text-ink-600" role="status">Identity verified separately · Officer access not connected</p>
            {identityNotice ? <p role="status" className="rounded-control border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">{identityNotice}</p> : null}
          </div>

          <div className="rounded-control border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-950">Shared-key session · transitional</p>
            <p className="mt-1 text-xs text-amber-900" role="status">Shared session · Not individual identity</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-950" htmlFor="staff-key">Shared staff key</label>
            <input
              id="staff-key"
              name="staff-key"
              type="password"
              autoComplete="current-password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              aria-describedby="staff-key-help"
              required
              className="mt-2 min-h-[48px] w-full rounded-control border border-line bg-white px-3 text-base text-ink-950"
            />
            
          </div>

          {error ? <p role="alert" aria-live="assertive" className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

          <button type="submit" disabled={pending || !key.trim()} className="inline-flex min-h-[48px] w-full items-center justify-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? "Checking access…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-600">Private · ISEYC</p>
      </div>
    </main>
  );
}
