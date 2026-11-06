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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, conveningBody, meetingDate, summary, sensitivity: "Standard" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create meeting");
        return;
      }
      router.push(`/ops/review/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/ops/queue" className="text-sm text-emerald-800 hover:underline">
        ← Meeting queue
      </Link>
      <h2 className="font-serif text-2xl text-slate-950">New meeting intake</h2>
      <p className="text-sm text-slate-600">
        Creates a New record in Notion. Not institutional memory until an officer approves it.
      </p>
      <form onSubmit={onSubmit} aria-busy={pending} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label className="text-sm font-medium" htmlFor="title">Meeting title</label>
          <input id="title" required minLength={5} maxLength={200} autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="body">Convening body</label>
          <input id="body" maxLength={200} autoComplete="organization" value={conveningBody} onChange={(e) => setConveningBody(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="date">Meeting date</label>
          <input id="date" type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="summary">Summary / notes</label>
          <textarea id="summary" rows={4} maxLength={1900} value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-800">Sensitivity: Standard</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Transitional staff sessions may submit Standard records only. Restricted records
            cannot be submitted through this intake until individual officer authorisation is available.
          </p>
        </div>
        {error ? <p className="text-sm text-red-700" role="alert" aria-live="assertive">{error}</p> : null}
        <button type="submit" disabled={pending || title.trim().length < 5} className="min-h-[52px] w-full rounded-xl bg-emerald-700 font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Submit for queue"}
        </button>
      </form>
    </div>
  );
}
