"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorBanner } from "@/components/ErrorBanner";

type MeetingStatus = "New" | "Draft" | "In review" | "Approved" | "Archived";
type Meeting = { id: string; title: string; status: MeetingStatus; conveningBody: string; meetingDate: string };

export default function QueuePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/meetings").then(async res => { const data=await res.json(); if(!res.ok) throw new Error(data.error || "Could not load queue."); setMeetings(data.data || []); }).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Operating records</p><h2 className="font-serif text-2xl text-slate-950">Meeting &amp; Decisions queue</h2></div><Link href="/ops/intake" className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">New intake</Link></div>
      <p className="text-sm leading-6 text-slate-600">Controlled queue. Records stay non-authoritative until human approval.</p>
      {loading ? <p role="status" className="text-sm text-slate-600">Loading controlled queue…</p> : error ? <ErrorBanner message={error} /> : !meetings.length ? <div className="rounded-2xl border border-slate-200 bg-white p-8"><p className="font-semibold text-slate-800">No meeting submissions yet.</p><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Use New intake to create the first record. If setup is incomplete, the queue will explain what needs attention.</p></div> : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {meetings.map(m=><li key={m.id}><Link href={`/ops/review/${m.id}`} className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 hover:bg-slate-50">
            <div className="min-w-0"><p className="font-medium text-slate-900">{m.title}</p><p className="text-xs text-slate-600">{m.conveningBody} · {m.meetingDate || "No date"}</p></div>
            <span className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-800">{m.status}</span>
          </Link></li>)}
        </ul>
      )}
    </div>
  );
}
