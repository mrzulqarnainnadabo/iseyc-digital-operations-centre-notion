"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HumanDecisionPanel } from "@/components/HumanDecisionPanel";
import { StatusBadge } from "@/components/StatusBadge";

type Meeting = {
  id: string;
  title: string;
  status: string;
  conveningBody: string;
  meetingDate: string;
  summary: string;
  sensitivity: string;
  meetingType: string;
  purpose: string;
  meetingTime: string;
  venue: string;
  meetingOwnerRole: string;
  agenda: string;
  requiredParticipants: string;
  preReading: string;
  decisionsSought: string;
  minutesOwnerRole: string;
  attendanceNotes: string;
  draftMinutes: string;
  outcomeSummary: string;
  linkedActionIds: string[];
};

export default function ReviewPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [attendanceDraft, setAttendanceDraft] = useState("");
  const [minutesDraft, setMinutesDraft] = useState("");
  const [outcomeDraft, setOutcomeDraft] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!id) {
      setError("This meeting reference is invalid.");
      setMeeting(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/ops/api/meetings/${encodeURIComponent(id)}`, { cache: "no-store", signal });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error("This record is unavailable or you do not have access.");
      if (!data || typeof data !== "object" || !(data as { meeting?: unknown }).meeting) {
        throw new Error("The record returned an unexpected response.");
      }
      const loadedMeeting = (data as { meeting: Meeting }).meeting;
      setMeeting(loadedMeeting);
      setAttendanceDraft(loadedMeeting.attendanceNotes || "");
      setMinutesDraft(loadedMeeting.draftMinutes || "");
      setOutcomeDraft(loadedMeeting.outcomeSummary || "");
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

  async function setStatus(status: "In review") {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/ops/api/meetings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        setError("The requested workflow change is not authorised or could not be completed.");
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

  async function saveDraftNotes() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/ops/api/meetings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceNotes: attendanceDraft,
          draftMinutes: minutesDraft,
          outcomeSummary: outcomeDraft,
        }),
      });
      const data: unknown = await response.json();
      if (!response.ok || !data || typeof data !== "object" || !(data as { meeting?: unknown }).meeting) {
        setError("Draft notes could not be saved. No successful update was confirmed.");
        return;
      }
      setMeeting((data as { meeting: Meeting }).meeting);
      setError(null);
    } catch {
      setError("Network issue: draft notes could not be confirmed. Refresh the record before retrying.");
    } finally {
      setPending(false);
    }
  }

  if (loading && !meeting) return <div className="mx-auto max-w-2xl rounded-card border border-line bg-white p-5" role="status" aria-live="polite"><div className="h-4 w-32 animate-pulse rounded bg-slate-200" /><div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-slate-100" /><p className="sr-only">Loading meeting record</p></div>;

  if (error && !meeting) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Link href="/ops/queue" className="inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800">← Approval queue</Link>
        <div className="rounded-card border border-amber-200 bg-amber-50 p-4" role="alert">
          <p className="text-sm text-amber-950">{error}</p>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-2 min-h-[44px] font-semibold text-amber-950 underline">Try again</button>
        </div>
      </div>
    );
  }

  if (!meeting) return <p className="text-sm text-ink-600">Record unavailable.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/ops/queue" className="inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline">← Return to queue</Link>
        <button type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={loading || pending} className="min-h-[44px] rounded-control border border-line bg-white px-3 text-sm font-semibold text-ink-700 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh record"}</button>
      </div>

      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Controlled human review</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">{meeting.title}</h1>
          <StatusBadge status={meeting.status} />
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-600">This record remains a submission until an authorised human decision is recorded.</p>
      </header>

      <dl className="grid gap-4 rounded-card border border-line bg-white p-5 shadow-card sm:grid-cols-2">
        <div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-600">Sensitivity</dt><dd className="mt-1 text-sm font-semibold text-ink-950">{meeting.sensitivity}</dd></div>
        <div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-600">Convening body</dt><dd className="mt-1 text-sm font-semibold text-ink-950">{meeting.conveningBody || "Not supplied"}</dd></div>
        <div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-600">Meeting date</dt><dd className="mt-1 text-sm font-semibold text-ink-950">{meeting.meetingDate || "Not supplied"}</dd></div>
        <div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-600">Record source</dt><dd className="mt-1 text-sm font-semibold text-ink-950">Notion · Meetings</dd></div>
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-600">Summary / notes</dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">{meeting.summary || "No summary supplied."}</dd>
        </div>
      </dl>

      <section className="space-y-4">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Meeting brief</p>
          <h2 className="mt-1 font-serif text-xl text-forest-950">{meeting.meetingType || "Meeting"} preparation</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["Purpose", meeting.purpose],
              ["Proposed time", meeting.meetingTime ? `${meeting.meetingTime} WAT` : ""],
              ["Venue / meeting link", meeting.venue],
              ["Meeting owner role", meeting.meetingOwnerRole],
              ["Minutes owner role", meeting.minutesOwnerRole],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label}><p className="text-[10px] font-bold uppercase tracking-[.12em] text-ink-600">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-ink-900">{value}</p></div>)}
          </div>
        </div>
        {[
          ["Agenda", meeting.agenda],
          ["Required participants · roles", meeting.requiredParticipants],
          ["Pre-reading and papers", meeting.preReading],
          ["Decisions / outcomes sought", meeting.decisionsSought],
        ].some(([, value]) => value) ? <div className="rounded-card border border-line bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold-700">Preparation</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {[
              ["Agenda", meeting.agenda],
              ["Required participants · roles", meeting.requiredParticipants],
              ["Pre-reading and papers", meeting.preReading],
              ["Decisions / outcomes sought", meeting.decisionsSought],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label}><p className="text-xs font-semibold text-forest-950">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-700">{value}</p></div>)}
          </div>
        </div> : null}
        {[
          ["Attendance notes · draft", meeting.attendanceNotes],
          ["Draft minutes", meeting.draftMinutes],
          ["Outcome summary · draft", meeting.outcomeSummary],
        ].some(([, value]) => value) ? <div className="rounded-card border border-[#e7d9b8] bg-[#fbf8ef] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">After the meeting · draft records</p>
          <div className="mt-3 space-y-4">
            {[
              ["Attendance notes · draft", meeting.attendanceNotes],
              ["Draft minutes", meeting.draftMinutes],
              ["Outcome summary · draft", meeting.outcomeSummary],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label}><p className="text-xs font-semibold text-[#6e5425]">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#514a3a]">{value}</p></div>)}
          </div>
        </div> : null}
      </section>

            {meeting.sensitivity === "Standard" ? <section className="rounded-card border border-line bg-white p-4"><p className="text-xs font-semibold uppercase tracking-widest text-gold-700">Follow-up workflow</p><h2 className="mt-1 font-serif text-xl text-forest-950">Propose a follow-up action</h2><p className="mt-1 text-sm leading-5 text-ink-600">Open a new proposed action with this meeting selected as context. The link does not certify a decision, approve the action or assign an officer.</p><Link href={`/ops/actions?meetingId=${encodeURIComponent(meeting.id)}`} className="mt-3 inline-flex min-h-[44px] items-center rounded-control border border-forest-900 px-4 text-sm font-semibold text-forest-900">Prepare follow-up action →</Link></section> : null}

            {meeting.status === "Approved" && meeting.sensitivity === "Standard" ? <section className="rounded-card border border-forest-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-widest text-gold-700">External participation</p><h2 className="mt-1 font-serif text-xl text-forest-950">Invite organisations or contributors</h2><p className="mt-1 text-sm leading-5 text-ink-600">Prepare organisation-specific invitations linked to this approved meeting. Each invitation remains a draft until separately approved and dispatched.</p><Link href={`/ops/partners?meetingId=${encodeURIComponent(meeting.id)}`} className="mt-3 inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white">Prepare external invitations</Link></section> : null}

      <section className="rounded-card border border-[#e7d9b8] bg-[#fbf8ef] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a6b34]">Working record · draft only</p>
        <h2 className="mt-1 font-serif text-xl text-forest-950">Attendance notes and draft minutes</h2>
        <p className="mt-2 text-xs leading-5 text-[#756c58]">These fields support working notes on Standard-sensitivity records. Record roles and meeting facts only; do not enter personal or restricted information. They do not verify attendance, establish quorum, approve minutes or certify a decision. The shared staff key does not identify the editor.</p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold text-forest-950">Attendance notes · roles only
            <textarea rows={3} maxLength={1000} value={attendanceDraft} onChange={(event) => setAttendanceDraft(event.target.value)} className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal leading-5 text-ink-950" placeholder="Present roles, apologies and any unverified attendance notes." />
          </label>
          <label className="block text-sm font-semibold text-forest-950">Draft minutes
            <textarea rows={7} maxLength={1900} value={minutesDraft} onChange={(event) => setMinutesDraft(event.target.value)} className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal leading-5 text-ink-950" placeholder="Record discussion points and proposed actions. Keep unresolved matters explicit." />
          </label>
          <label className="block text-sm font-semibold text-forest-950">Outcome summary · draft
            <textarea rows={3} maxLength={1000} value={outcomeDraft} onChange={(event) => setOutcomeDraft(event.target.value)} className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal leading-5 text-ink-950" placeholder="Working summary only. Do not describe a proposal as an approved decision." />
          </label>
          <button type="button" disabled={pending} onClick={() => void saveDraftNotes()} className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Saving draft…" : "Save draft notes"}</button>
        </div>
      </section>

      {error ? <p className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}

      <section className="rounded-card border border-line bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Permitted transitional action</p>
        <h2 className="mt-1 text-sm font-semibold text-forest-950">Move record into review</h2>
        <p className="mt-1 text-sm leading-5 text-ink-600">This changes the workflow state to In review. It does not approve the record.</p>
        <button type="button" disabled={pending || meeting.status === "In review"} onClick={() => void setStatus("In review")} className="mt-3 inline-flex min-h-[44px] items-center rounded-control border border-forest-900 px-4 text-sm font-semibold text-forest-900 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Updating…" : meeting.status === "In review" ? "Already in review" : "Move to In review"}
        </button>
      </section>

      <HumanDecisionPanel disabledReason="Accept, Edit, Return and Reject are disabled for transitional shared-key sessions. Verified individual identity, scoped appointment permissions and durable audit logging are required before these decisions can be enabled." />
    </div>
  );
}
