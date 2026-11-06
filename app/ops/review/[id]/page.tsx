"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!id) {
      setError("This meeting reference is invalid.");
      setMeeting(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${encodeURIComponent(id)}`, {
        cache: "no-store",
        signal,
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error("This record is unavailable or you do not have access.");
      if (!data || typeof data !== "object" || !(data as { meeting?: unknown }).meeting) {
        throw new Error("The record returned an unexpected response.");
      }
      setMeeting((data as { meeting: Meeting }).meeting);
      setError(null);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setMeeting(null);
      setError(cause instanceof Error ? cause.message : "The record could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  async function setStatus(status: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError("The requested status change is not authorised or could not be completed.");
        return;
      }
      if (!data || typeof data !== "object" || !(data as { meeting?: unknown }).meeting) {
        setError("The server returned an unexpected update response.");
        return;
      }
      setMeeting((data as { meeting: Meeting }).meeting);
    } catch {
      setError("Network issue: the update could not be confirmed. Refresh the record before retrying.");
    } finally {
      setPending(false);
    }
  }

  if (loading && !meeting) return <p className="text-sm text-slate-500" role="status">Loading record…</p>;

  if (error && !meeting) {
    return (
      <div className="space-y-3">
        <Link href="/ops/queue" className="text-sm text-emerald-800">← Queue</Link>
        <p className="text-slate-600" role="alert">{error}</p>
        <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm font-semibold">
          Try again
        </button>
      </div>
    );
  }

  if (!meeting) return <p className="text-sm text-slate-500">Record unavailable.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/ops/queue" className="text-sm text-emerald-800 hover:underline">← Return to queue</Link>
        <button type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={loading || pending} className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-50">
          {loading ? "Refreshing…" : "Refresh record"}
        </button>
      </div>
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
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending || meeting.status === "In review"} onClick={() => void setStatus("In review")} className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm font-medium disabled:opacity-50">
          {pending ? "Updating…" : "Open review"}
        </button>
        <button type="button" disabled className="min-h-[44px] cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500">Approval requires authorised officer access</button>
        <button type="button" disabled className="min-h-[44px] cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500">Archiving requires authorised officer access</button>
      </div>
    </div>
  );
}
