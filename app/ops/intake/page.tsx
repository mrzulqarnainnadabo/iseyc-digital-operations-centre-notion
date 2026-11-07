"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function IntakePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [conveningBody, setConveningBody] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/ops/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, conveningBody, meetingDate, summary, sensitivity: "Standard" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "The meeting record could not be created.");
        return;
      }
      router.push(`/ops/review/${encodeURIComponent(data.id)}`);
      router.refresh();
    } catch {
      setError("The service could not be reached. No successful submission was confirmed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <Link href="/ops/queue" className="inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline">← Approval queue</Link>
        <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">New meeting intake</h1>
        
      </header>

      <p className="text-xs text-ink-600" role="status">Standard records only · Transitional access</p>

      <form onSubmit={onSubmit} aria-busy={pending} className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
        <div>
          <label className="block text-sm font-semibold text-ink-950" htmlFor="title">Meeting title <span className="text-red-700">*</span></label>
          <input id="title" required minLength={5} maxLength={200} autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 min-h-[48px] w-full rounded-control border border-line px-3 text-base" />
          
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-950" htmlFor="body">Convening body</label>
          <input id="body" maxLength={200} autoComplete="organization" value={conveningBody} onChange={(event) => setConveningBody(event.target.value)} className="mt-2 min-h-[48px] w-full rounded-control border border-line px-3 text-base" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-950" htmlFor="date">Meeting date</label>
          <input id="date" type="date" value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} className="mt-2 min-h-[48px] w-full rounded-control border border-line px-3 text-base" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-950" htmlFor="summary">Summary / notes</label>
          <textarea id="summary" rows={5} maxLength={1900} value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-2 w-full rounded-control border border-line px-3 py-2 text-base leading-6" />
          
        </div>
        <div className="rounded-control border border-line bg-cream-50 p-3">
          <p className="text-sm font-semibold text-ink-950">Sensitivity: Standard</p>
          
        </div>
        {error ? <p role="alert" aria-live="assertive" className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <button type="submit" disabled={pending || title.trim().length < 5} className="inline-flex min-h-[48px] w-full items-center justify-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
