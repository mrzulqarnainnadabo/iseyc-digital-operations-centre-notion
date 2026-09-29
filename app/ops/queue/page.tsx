"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Meeting = {
  id: string;
  title: string;
  status: string;
  conveningBody: string;
  meetingDate: string;
};

export default function QueuePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meetings")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setMeetings(data.meetings || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            Operating records
          </p>
          <h2 className="font-serif text-2xl text-slate-950">Meeting &amp; Decisions queue</h2>
        </div>
        <Link
          href="/ops/intake"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950"
        >
          New intake
        </Link>
      </div>
      <p className="text-sm text-slate-600">
        Controlled queue. Records stay non-authoritative until human approval.
      </p>
      {loading ? (
        <p className="text-sm text-slate-500">Loading controlled queue…</p>
      ) : error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</p>
      ) : !meetings.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="font-medium text-slate-700">No meeting submissions yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Use New meeting intake. Share the Meetings Notion database with your integration.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {meetings.map((m) => (
            <li key={m.id}>
              <Link
                href={`/ops/review/${m.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{m.title}</p>
                  <p className="text-xs text-slate-500">
                    {m.conveningBody} · {m.meetingDate || "No date"}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {m.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
