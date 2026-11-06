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
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch("/api/meetings", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const data: unknown = await res.json();
        if (!res.ok) throw new Error("The meeting queue could not be loaded.");
        if (!data || typeof data !== "object" || !Array.isArray((data as { meetings?: unknown }).meetings)) {
          throw new Error("The meeting queue returned an unexpected response.");
        }
        setMeetings((data as { meetings: Meeting[] }).meetings);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError("The meeting queue is temporarily unavailable. Try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            Operating records
          </p>
          <h2 className="font-serif text-2xl text-slate-950">Meeting &amp; Decisions queue</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            href="/ops/intake"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950"
          >
            New intake
          </Link>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Controlled queue. Records stay non-authoritative until human approval.
      </p>
      {loading ? (
        <p className="text-sm text-slate-500" role="status">Loading controlled queue…</p>
      ) : error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-2 font-semibold underline">
            Retry
          </button>
        </div>
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
                href={`/ops/review/${encodeURIComponent(m.id)}`}
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
