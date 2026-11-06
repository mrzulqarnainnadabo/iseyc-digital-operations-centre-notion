"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Meeting = {
  id: string;
  title: string;
  status: string;
  conveningBody: string;
  meetingDate: string;
};

const statusClass: Record<string, string> = {
  New: "border-sky-200 bg-sky-50 text-sky-900",
  Draft: "border-slate-200 bg-slate-50 text-slate-700",
  "In review": "border-amber-200 bg-amber-50 text-amber-900",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Archived: "border-slate-200 bg-slate-100 text-slate-600",
};

export default function QueuePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch("/api/meetings", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const data: unknown = await res.json();
        if (!res.ok) {
          const message = data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "The meeting queue could not be loaded.";
          throw new Error(message);
        }
        if (!data || typeof data !== "object" || !Array.isArray((data as { meetings?: unknown }).meetings)) {
          throw new Error("The meeting queue returned an unexpected response.");
        }
        setMeetings((data as { meetings: Meeting[] }).meetings);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "The meeting queue is temporarily unavailable. Try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const visibleMeetings = useMemo(
    () => filter === "All" ? meetings : meetings.filter((meeting) => meeting.status === filter),
    [filter, meetings],
  );
  const reviewCount = meetings.filter((meeting) => ["New", "Draft", "In review"].includes(meeting.status)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Human authority · controlled records</p>
          <h1 className="mt-1 font-serif text-2xl text-forest-950 sm:text-3xl">Global approval queue</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">A single review surface for records submitted to the Notion-backed meeting workflow. A queue item is not an institutional decision.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={loading} className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-ink-700 disabled:opacity-50">
            {loading ? "Refreshing…" : "Refresh queue"}
          </button>
          <Link href="/ops/intake" className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">New intake</Link>
        </div>
      </header>

      <section className="rounded-card border border-amber-200 bg-amber-50 p-4" aria-label="Human review policy">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-900" aria-hidden="true">!</span>
          <div>
            <p className="text-sm font-semibold text-amber-950">Human review is mandatory</p>
            <p className="mt-1 text-sm leading-5 text-amber-900">AI assistance, if introduced, remains a draft aid only. No AI output is an institutional decision, and no record is approved by appearing in this queue.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Queue summary">
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-ink-600">Records loaded</p>
          <p className="mt-1 font-serif text-2xl tabular-nums">{loading ? "—" : error ? "—" : meetings.length}</p>
        </div>
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-ink-600">Awaiting review</p>
          <p className="mt-1 font-serif text-2xl tabular-nums">{loading || error ? "—" : reviewCount}</p>
        </div>
        <div className="col-span-2 rounded-card border border-line bg-white p-4 sm:col-span-1">
          <p className="text-xs text-ink-600">Source</p>
          <p className="mt-1 text-sm font-semibold text-forest-900">Notion · Meetings</p>
          <p className="mt-1 text-xs text-ink-600">Standard records only</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-forest-950">Review records</h2>
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-ink-700">
            <span className="sr-only">Filter records by status</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-[44px] rounded-control border border-line bg-white px-3 text-sm">
              <option>All</option>
              <option>New</option>
              <option>Draft</option>
              <option>In review</option>
              <option>Approved</option>
              <option>Archived</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="rounded-card border border-line bg-white p-5" role="status">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 h-12 rounded-control bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-card border border-amber-200 bg-amber-50 p-4" role="alert">
            <p className="text-sm text-amber-950">{error}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-3 min-h-[44px] font-semibold text-amber-950 underline">Retry</button>
          </div>
        ) : !visibleMeetings.length ? (
          <div className="rounded-card border border-dashed border-line bg-white px-5 py-10 text-center">
            <p className="font-semibold text-ink-950">{meetings.length ? "No records match this filter." : "No items awaiting review."}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-ink-600">{meetings.length ? "Choose another status to see other records." : "The connected meeting register returned no visible Standard records. This does not mean there are no institutional matters outside this register."}</p>
            {!meetings.length ? <Link href="/ops/intake" className="mt-4 inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white">Create meeting intake</Link> : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {visibleMeetings.map((meeting) => (
              <li key={meeting.id} className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold leading-5 text-ink-950">{meeting.title}</h3>
                      <span className={`inline-flex min-h-[25px] items-center rounded-full border px-2.5 text-[11px] font-semibold ${statusClass[meeting.status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>{meeting.status}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-ink-600">{meeting.conveningBody || "Convening body not supplied"} · {meeting.meetingDate || "Date not supplied"}</p>
                    <p className="mt-2 text-xs text-ink-600">Human decision required · Not an approved institutional record</p>
                  </div>
                  <Link href={`/ops/review/${encodeURIComponent(meeting.id)}`} className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-control border border-forest-900 px-4 text-sm font-semibold text-forest-900 hover:bg-forest-100">Open for review</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-line bg-white p-4">
        <p className="text-sm font-semibold text-forest-950">Decision controls are restricted</p>
        <p className="mt-1 text-sm leading-5 text-ink-600">Accept, edit, return and reject controls remain unavailable to transitional shared-key sessions. They require verified individual identity, explicit appointment scope, permission checks and a durable audit record. This interface will not simulate those decisions.</p>
      </section>
    </div>
  );
}
