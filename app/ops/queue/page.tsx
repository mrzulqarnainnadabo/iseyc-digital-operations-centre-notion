"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type MeetingsResponse = {
  meetings: Meeting[];
  nextCursor: string | null;
};

async function readMeetings(url: string, signal?: AbortSignal): Promise<MeetingsResponse> {
  const response = await fetch(url, { cache: "no-store", signal });
  const data: unknown = await response.json();
  if (!response.ok) {
    const message = data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
      ? (data as { error: string }).error
      : "The meeting queue could not be loaded.";
    throw new Error(message);
  }
  if (!data || typeof data !== "object" ||
      !Array.isArray((data as { meetings?: unknown }).meetings) ||
      !("nextCursor" in data) ||
      ((data as { nextCursor: unknown }).nextCursor !== null &&
       typeof (data as { nextCursor: unknown }).nextCursor !== "string")) {
    throw new Error("The meeting queue returned an unexpected response.");
  }
  return data as MeetingsResponse;
}

export default function QueuePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setMeetings([]);
    setNextCursor(null);
    readMeetings("/ops/api/meetings", controller.signal)
      .then((data) => {
        setMeetings(data.meetings);
        setNextCursor(data.nextCursor);
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

  async function loadMore() {
    if (!nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await readMeetings(`/ops/api/meetings?cursor=${encodeURIComponent(nextCursor)}`);
      setMeetings((current) => {
        const existing = new Set(current.map((meeting) => meeting.id));
        return [...current, ...data.meetings.filter((meeting) => !existing.has(meeting.id))];
      });
      setNextCursor(data.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load more records. Try again.");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  const visibleMeetings = useMemo(
    () => filter === "All" ? meetings : meetings.filter((meeting) => meeting.status === filter),
    [filter, meetings],
  );
  const reviewCount = meetings.filter((meeting) => ["New", "Draft", "In review"].includes(meeting.status)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <div>
          <h1 className="mt-1 font-serif text-2xl text-forest-950 sm:text-3xl">Approval queue</h1>
          <p className="mt-1 text-sm text-ink-600">Records are loaded in pages from the internal Meetings register.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={loading || loadingMore} className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-ink-700 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
          <Link href="/ops/intake" className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">Intake</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Loaded queue summary">
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-ink-600">Loaded records</p>
          <p className="mt-1 font-serif text-2xl tabular-nums">{loading || error ? "—" : meetings.length}</p>
        </div>
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-ink-600">Awaiting · loaded</p>
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
            <span className="sr-only">Filter loaded records by status</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-[44px] rounded-control border border-line bg-white px-3 text-sm">
              <option>All</option><option>New</option><option>Draft</option><option>In review</option><option>Approved</option><option>Archived</option>
            </select>
          </label>
        </div>

        {loading ? (
          <LoadingState label="Loading approval queue" />
        ) : error && meetings.length === 0 ? (
          <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : !visibleMeetings.length ? (
          <EmptyState title={meetings.length ? "No matching loaded items" : nextCursor ? "No visible records on this page" : "No items"} />
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
        {error && meetings.length > 0 ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
        {nextCursor ? (
          <button type="button" onClick={loadMore} disabled={loadingMore} className="inline-flex min-h-[44px] items-center rounded-control border border-forest-900 px-4 text-sm font-semibold text-forest-900 disabled:opacity-50">
            {loadingMore ? "Loading more…" : "Load more records"}
          </button>
        ) : null}
      </section>

      <p className="text-xs text-ink-600" role="status">Decision actions unavailable · Authority not connected</p>
    </div>
  );
}
