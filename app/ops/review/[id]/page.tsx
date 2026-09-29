"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Meeting = {
  id: string;
  title: string;
  status: string;
  conveningBody: string;
  meetingDate: string;
  summary: string;
  sensitivity: string;
};

export default function ReviewPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    const res = await fetch(`/api/meetings/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unavailable");
      setMeeting(null);
      return;
    }
    setMeeting(data.meeting);
    setError(null);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function setStatus(status: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      setMeeting(data.meeting);
    } finally {
      setPending(false);
    }
  }

  if (error && !meeting) {
    return (
      <div className="space-y-3">
        <Link href="/ops/queue" className="text-sm text-emerald-800">← Queue</Link>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  if (!meeting) return <p className="text-sm text-slate-500">Loading record…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/ops/queue" className="text-sm text-emerald-800 hover:underline">← Return to queue</Link>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Controlled review</p>
        <h2 className="mt-1 font-serif text-2xl text-slate-950">{meeting.title}</h2>
        <p className="mt-2 text-sm text-slate-600">Approval is a human governance action, not an automated status change.</p>
      </div>
      <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <div><dt className="text-xs uppercase text-slate-400">Status</dt><dd className="font-medium">{meeting.status}</dd></div>
        <div><dt className="text-xs uppercase text-slate-400">Sensitivity</dt><dd className="font-medium">{meeting.sensitivity}</dd></div>
        <div><dt className="text-xs uppercase text-slate-400">Convening body</dt><dd className="font-medium">{meeting.conveningBody}</dd></div>
        <div><dt className="text-xs uppercase text-slate-400">Meeting date</dt><dd className="font-medium">{meeting.meetingDate || "—"}</dd></div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase text-slate-400">Summary</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{meeting.summary || "—"}</dd>
        </div>
      </dl>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => setStatus("In review")} className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm font-medium">Open review</button>
        <button type="button" disabled={pending} onClick={() => setStatus("Approved")} className="min-h-[44px] rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white">Approve record</button>
        <button type="button" disabled={pending} onClick={() => setStatus("Archived")} className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-600">Archive</button>
      </div>
    </div>
  );
}
