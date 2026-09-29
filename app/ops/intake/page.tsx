"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorBanner } from "@/components/ErrorBanner";

export default function IntakePage() {
  const router = useRouter();
  const [title, setTitle] = useState(""); const [conveningBody, setConveningBody] = useState(""); const [meetingDate, setMeetingDate] = useState(""); const [summary, setSummary] = useState(""); const [sensitivity, setSensitivity] = useState("Standard");
  const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setPending(true); setError(null);
    try {
      const res = await fetch("/api/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, conveningBody, meetingDate, summary, sensitivity }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not create meeting."); return; }
      router.push(`/ops/review/${data.data.id}`); router.refresh();
    } catch { setError("Network error. Check your connection and try again."); }
    finally { setPending(false); }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/ops/queue" className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">← Meeting queue</Link>
      <h2 className="font-serif text-2xl text-slate-950">New meeting intake</h2>
      <p className="text-sm leading-6 text-slate-600">Creates a New record in Notion. It remains non-authoritative until an officer approves it.</p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div><label className="text-sm font-semibold text-slate-900" htmlFor="title">Meeting title <span aria-hidden="true">*</span></label><input id="title" name="title" required minLength={5} value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"/></div>
        <div><label className="text-sm font-semibold text-slate-900" htmlFor="body">Convening body</label><input id="body" name="conveningBody" value={conveningBody} onChange={(e)=>setConveningBody(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"/></div>
        <div><label className="text-sm font-semibold text-slate-900" htmlFor="date">Meeting date</label><input id="date" name="meetingDate" type="date" value={meetingDate} onChange={(e)=>setMeetingDate(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"/></div>
        <div><label className="text-sm font-semibold text-slate-900" htmlFor="summary">Summary / notes</label><textarea id="summary" name="summary" rows={4} value={summary} onChange={(e)=>setSummary(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"/></div>
        <div><label className="text-sm font-semibold text-slate-900" htmlFor="sens">Sensitivity</label><select id="sens" name="sensitivity" value={sensitivity} onChange={(e)=>setSensitivity(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"><option>Standard</option><option>Restricted</option></select></div>
        {error ? <ErrorBanner message={error} /> : null}
        <button type="submit" disabled={pending} aria-busy={pending} className="min-h-[52px] w-full rounded-xl bg-emerald-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Saving…" : "Submit for review queue"}</button>
      </form>
    </div>
  );
}
