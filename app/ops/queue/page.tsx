"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueueStates";

type Meeting = {
  id: string;
  title: string;
  status: string;
  conveningBody: string;
  meetingDate: string;
};

type QueueResponse = {
  meetings: Meeting[];
  nextCursor: string | null;
  hasMore: boolean;
};

export default function QueuePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState("All");

  const currentCursor = cursorHistory[pageIndex] ?? null;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const query = currentCursor ? `?cursor=${encodeURIComponent(currentCursor)}` : "";
    fetch(`/ops/api/meetings${query}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data: unknown = await response.json();
        if (!response.ok) {
          const message = data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "The meeting queue could not be loaded.";
          throw new Error(message);
        }
        if (!data || typeof data !== "object" || !Array.isArray((data as QueueResponse).meetings)) {
          throw new Error("The meeting queue returned an unexpected response.");
        }
        const page = data as QueueResponse;
        if (!(page.nextCursor === null || typeof page.nextCursor === "string") || typeof page.hasMore !== "boolean") {
          throw new Error("The meeting queue returned invalid pagination metadata.");
        }
        setMeetings(page.meetings);
        setNextCursor(page.nextCursor);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "The meeting queue is temporarily unavailable. Try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [currentCursor, reloadKey]);

  const visibleMeetings = useMemo(
    () => filter === "All" ? meetings : meetings.filter((meeting) => meeting.status === filter),
    [filter, meetings],
  );
  const reviewCount = meetings.filter((meeting) => ["New", "Draft", "In review"].includes(meeting.status)).length;

  function goNext() {
    if (!nextCursor || loading) return;
    setCursorHistory((history) => {
      const next = history.slice(0, pageIndex + 1);
      next.push(nextCursor);
      return next;
    });
    setPageIndex((index) => index + 1);
  }

  function goPrevious() {
    if (pageIndex === 0 || loading) return;
    setPageIndex((index) => index - 1);
  }

  function refresh() {
    setCursorHistory([null]);
    setPageIndex(0);
    setReloadKey((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <div>
          <h1 className="mt-1 font-serif text-2xl text-forest-950 sm:text-3xl">Approval queue</h1>
          <p className="mt-1 text-sm text-ink-600">Showing up to 25 Standard records per page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refresh} disabled={loading} className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-ink-700 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
          <Link href="/ops/intake" className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">Intake</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Queue summary">
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-ink-600">Records on this page</p>
          <p className="mt-1 font-serif text-2xl tabular-nums">{loading || error ? "—" : meetings.length}</p>
        </div>
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-ink-600">Awaiting on this page</p>
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
            <span className="sr-only">Filter records by status on this page</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-[44px] rounded-control border border-line bg-white px-3 text-sm">
              <option>All</option><option>New</option><option>Draft</option><option>In review</option><option>Approved</option><option>Archived</option>
            </select>
          </label>
        </div>

        {loading ? (
          <LoadingState label="Loading approval queue" />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : !visibleMeetings.length ? (
          <EmptyState title={meetings.length ? "No matching items on this page" : "No items on this page"} />
        ) : (
          <ul className="space-y-2">
            {visibleMeetings.map((meeting) => (
              <li key={meeting.id} className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold leading-5 text-ink-950">{meeting.title}</h3>
                      <StatusBadge status={meeting.status} />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-ink-600">{meeting.conveningBody || "Convening body not supplied"} · {meeting.meetingDate || "Date not supplied"}</p>
                  </div>
                  <Link href={`/ops/review/${encodeURIComponent(meeting.id)}`} className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-control border border-forest-900 px-4 text-sm font-semibold text-forest-900 hover:bg-forest-100">Review</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex items-center justify-between gap-3" aria-label="Queue pagination">
        <button type="button" onClick={goPrevious} disabled={loading || pageIndex === 0} className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-ink-700 disabled:opacity-40">Previous</button>
        <span className="text-sm text-ink-600" aria-live="polite">Page {pageIndex + 1}{nextCursor ? " · More records available" : " · End of queue"}</span>
        <button type="button" onClick={goNext} disabled={loading || !nextCursor} className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-ink-700 disabled:opacity-40">Next</button>
      </nav>

      <p className="text-xs text-ink-600" role="status">Decision actions unavailable · Authority not connected</p>
    </div>
  );
}
