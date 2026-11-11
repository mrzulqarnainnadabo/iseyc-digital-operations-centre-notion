"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type Kind = "actions" | "media" | "chamber";
type RecordRow = {
  id: string; title: string; status: string; detail: string; date: string; url: string;
  department?: string; priority?: string; expectedEvidence?: string; blocker?: string; sourceMeetingId?: string; notes?: string; progressUpdate?: string;
  purpose?: string; chairRole?: string; secretaryRole?: string; agenda?: string;
  attendanceBasis?: string; decisionItems?: string; draftMinutes?: string; decisionOutcome?: string;
};
type MeetingOption = { id: string; title: string; status: string; meetingDate: string; sensitivity: string };

const TITLES: Record<Kind, string> = {
  actions: "Action register",
  media: "Communications work queue",
  chamber: "Council and Chamber sessions",
};
const DETAILS: Record<Kind, string> = {
  actions: "Record proposed follow-up work from meetings and departmental priorities. An initial register entry is not an accepted assignment; progress reporting waits for verified officer identity and assignment.",
  media: "Prepare institutional communications for factual and editorial review. Draft creation does not approve, publish or dispatch content.",
  chamber: "Prepare formal institutional sessions with an agenda, chair and secretary roles, attendance basis and draft decision notes. These records do not certify quorum or decisions.",
};
const KIND_LABEL: Record<Kind, string> = { actions: "Actions", media: "Communications", chamber: "Chamber" };
const field = "mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal text-ink-950";
const area = "mt-1 w-full rounded-control border border-line bg-cream-50 px-3 py-2 text-sm font-normal leading-5 text-ink-950";

export default function OperationalRegister({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [date, setDate] = useState("");
  const [channel, setChannel] = useState("Website");
  const [department, setDepartment] = useState("Executive");
  const [priority, setPriority] = useState("Normal");
  const [expectedEvidence, setExpectedEvidence] = useState("");
  const [blocker, setBlocker] = useState("");
  const [notes, setNotes] = useState("");
  const [sourceMeetingId, setSourceMeetingId] = useState("");
  const [meetings, setMeetings] = useState<MeetingOption[]>([]);
  const [meetingSourceError, setMeetingSourceError] = useState("");
  const [purpose, setPurpose] = useState("");
  const [chairRole, setChairRole] = useState("");
  const [secretaryRole, setSecretaryRole] = useState("");
  const [agenda, setAgenda] = useState("");
  const [attendanceBasis, setAttendanceBasis] = useState("");
  const [decisionItems, setDecisionItems] = useState("");
  const [draftMinutes, setDraftMinutes] = useState("");
  const [decisionOutcome, setDecisionOutcome] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  async function refresh(append = false) {
    setBusy(true);
    setError("");
    const cursor = append ? nextCursor : null;
    try {
      const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const response = await fetch(`/ops/api/registers/${kind}${suffix}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load register.");
      if (!Array.isArray(data.records) || (data.nextCursor !== null && typeof data.nextCursor !== "string") || typeof data.hasMore !== "boolean") {
        throw new Error("The register returned an invalid response. No records are shown.");
      }
      setRows((current) => append ? [...current, ...data.records] : data.records);
      setNextCursor(data.hasMore ? data.nextCursor : null);
      setLoaded(true);
    } catch (cause) {
      if (!append) { setRows([]); setLoaded(false); setNextCursor(null); }
      setError(cause instanceof Error ? cause.message : "Could not load register.");
    } finally { setBusy(false); }
  }

  useEffect(() => {
    void refresh();
    if (kind === "actions") {
      fetch("/ops/api/meetings", { cache: "no-store" })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !Array.isArray(data.meetings)) throw new Error("The Meetings source is not available.");
          setMeetings(data.meetings.filter((meeting: MeetingOption) => meeting.sensitivity === "Standard"));
        })
        .catch(() => setMeetingSourceError("Meeting references are unavailable. You can still create an action without linking a meeting."));
    }
  }, [kind]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const body = kind === "media"
      ? { title, detail, channel }
      : kind === "actions"
        ? { title, detail, date, department, priority, expectedEvidence, blocker, notes, sourceMeetingId }
        : { title, detail, date, purpose, chairRole, secretaryRole, agenda, attendanceBasis, decisionItems, draftMinutes, decisionOutcome };
    try {
      const response = await fetch(`/ops/api/registers/${kind}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save record.");
      setTitle(""); setDetail(""); setDate(""); setExpectedEvidence(""); setBlocker(""); setNotes(""); setSourceMeetingId("");
      setPurpose(""); setChairRole(""); setSecretaryRole(""); setAgenda(""); setAttendanceBasis(""); setDecisionItems(""); setDraftMinutes(""); setDecisionOutcome("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save record.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Shared institutional register · {KIND_LABEL[kind]}</p>
            <h1 className="mt-1 font-serif text-2xl text-forest-950 sm:text-3xl">{TITLES[kind]}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">{DETAILS[kind]}</p>
          </div>
          <Link href="/ops/executive" className="inline-flex min-h-10 items-center text-sm font-semibold text-forest-800 hover:underline">Executive desk →</Link>
        </div>
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-950">Authority and record boundary</p>
          <p className="mt-1 text-xs leading-5 text-amber-900">A role label is not an appointment or an accepted action assignment. The proposed owner role field does not assign access or imply a named officer. A meeting reference is context, not proof of a decision. Records created here remain initial states. Approval, publication, closure and formal decisions remain human-authorised and require verified individual authority and audit.</p>
        </section>
      </header>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Create record</p>
        <h2 className="mt-1 font-serif text-xl text-forest-950">New {KIND_LABEL[kind].toLowerCase()} entry</h2>
        <form onSubmit={submit} aria-busy={busy} className="mt-4 space-y-4">
          <label className="block text-sm font-semibold text-ink-800">Title · required
            <input required minLength={3} maxLength={180} value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder={kind === "actions" ? "Action title" : kind === "media" ? "Draft title" : "Session title"} />
          </label>

          {kind === "actions" ? <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink-800">Proposed owner role · required
                <input required minLength={2} maxLength={180} value={detail} onChange={(e) => setDetail(e.target.value)} className={field} placeholder="Role title only — not a named or accepted assignment" />
              </label>
              <label className="block text-sm font-semibold text-ink-800">Due date · required
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink-800">Department
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className={field}>
                  <option>Executive</option><option>Education</option><option>Health</option><option>Digital Systems</option><option>Civic Affairs</option><option>Institution-wide</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink-800">Priority
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={field}>
                  <option>Urgent</option><option>High</option><option>Normal</option><option>Low</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-semibold text-ink-800">Expected evidence / deliverable
              <textarea rows={2} maxLength={500} value={expectedEvidence} onChange={(e) => setExpectedEvidence(e.target.value)} className={area} placeholder="What will demonstrate that this action was carried out?" />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Blocker / support required
              <textarea rows={2} maxLength={500} value={blocker} onChange={(e) => setBlocker(e.target.value)} className={area} placeholder="Leave blank until a blocker is known." />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Related meeting · optional
              <select value={sourceMeetingId} onChange={(e) => setSourceMeetingId(e.target.value)} className={field}>
                <option value="">No linked meeting</option>
                {meetings.map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.meetingDate || "Undated"} · {meeting.title} · {meeting.status}</option>)}
              </select>
              <span className="mt-1 block text-[10px] font-normal text-ink-600">{meetingSourceError || "Links to a Standard meeting record as context. It does not certify a decision or create an approval."}</span>
            </label>
            <label className="block text-sm font-semibold text-ink-800">Working notes
              <textarea rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className={area} />
            </label>
          </> : null}

          {kind === "media" ? <>
            <label className="block text-sm font-semibold text-ink-800">Brief notes
              <textarea maxLength={1800} value={detail} onChange={(e) => setDetail(e.target.value)} rows={4} className={area} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Channel
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={field}><option>Website</option><option>Social</option><option>Email</option><option>Press</option><option>Internal</option></select>
            </label>
          </> : null}

          {kind === "chamber" ? <>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-semibold text-ink-800">Session date · required
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
              </label>
              <label className="block text-sm font-semibold text-ink-800">Chair role
                <input maxLength={160} value={chairRole} onChange={(e) => setChairRole(e.target.value)} className={field} placeholder="Role only" />
              </label>
              <label className="block text-sm font-semibold text-ink-800">Secretary role
                <input maxLength={160} value={secretaryRole} onChange={(e) => setSecretaryRole(e.target.value)} className={field} placeholder="Role only" />
              </label>
            </div>
            <label className="block text-sm font-semibold text-ink-800">Session purpose
              <textarea rows={2} maxLength={500} value={purpose} onChange={(e) => setPurpose(e.target.value)} className={area} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Agenda
              <textarea rows={3} maxLength={1000} value={agenda} onChange={(e) => setAgenda(e.target.value)} className={area} placeholder="List the matters to be considered." />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Attendance and quorum basis · draft
              <textarea rows={2} maxLength={1000} value={attendanceBasis} onChange={(e) => setAttendanceBasis(e.target.value)} className={area} placeholder="Record the applicable rule or state that it is not configured. Do not infer quorum." />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Decision items for consideration
              <textarea rows={2} maxLength={1000} value={decisionItems} onChange={(e) => setDecisionItems(e.target.value)} className={area} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Draft minutes · optional
              <textarea rows={3} maxLength={1800} value={draftMinutes} onChange={(e) => setDraftMinutes(e.target.value)} className={area} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Decision outcome notes · draft only
              <textarea rows={2} maxLength={1000} value={decisionOutcome} onChange={(e) => setDecisionOutcome(e.target.value)} className={area} placeholder="Draft note only; not a certified decision." />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Additional session summary
              <textarea rows={2} maxLength={1800} value={detail} onChange={(e) => setDetail(e.target.value)} className={area} />
            </label>
          </> : null}

          {error ? <p role="alert" aria-live="assertive" className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={busy || title.trim().length < 3 || ((kind === "actions" || kind === "chamber") && !date) || (kind === "actions" && !detail.trim())} className="min-h-11 rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-50">{busy ? "Saving…" : kind === "chamber" ? "Schedule session" : "Save to Notion"}</button>
            <button type="button" onClick={() => void refresh()} disabled={busy} className="min-h-11 rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-950 hover:bg-cream-50 disabled:opacity-50">Refresh list</button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Register</p><h2 className="font-semibold text-forest-950">Register records</h2></div><button type="button" onClick={() => void refresh()} disabled={busy} className="min-h-10 rounded-control border border-line px-3 text-sm font-semibold disabled:opacity-50">Refresh</button></div>
        {error ? <p role="alert" className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p> : null}
        {!loaded && !error ? <p className="text-sm text-ink-600">Loading records…</p> : null}
        {loaded && rows.length === 0 ? <p className="rounded-card border border-line bg-white p-4 text-sm text-ink-600">The connected register contains no records on the returned page.</p> : null}
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-card border border-line bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-forest-950">{row.title}</h3><StatusBadge status={row.status} /></div>
              {row.detail ? (kind === "actions" ? <p className="mt-2 text-sm leading-6 text-ink-700"><strong>Proposed owner role:</strong> {row.detail}</p> : <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">{row.detail}</p>) : null}
              {row.date ? <p className="mt-1 text-xs text-ink-600">{row.date}</p> : null}
              {kind === "actions" ? <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                {row.department ? <span className="rounded-full bg-cream-50 px-2.5 py-1 font-semibold text-forest-900">{row.department}</span> : null}
                {row.priority ? <span className="rounded-full border border-line px-2.5 py-1 font-semibold text-ink-700">{row.priority} priority</span> : null}
              </div> : null}
              {row.notes ? <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-ink-700">{row.notes}</p> : null}
              {row.expectedEvidence ? <p className="mt-3 text-xs leading-5 text-ink-700"><strong>Expected evidence:</strong> {row.expectedEvidence}</p> : null}
              {row.progressUpdate ? <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-ink-700"><strong>Latest self-reported progress:</strong> {row.progressUpdate}</p> : null}
              {row.blocker ? <p className="mt-2 text-xs leading-5 text-amber-900"><strong>Blocker:</strong> {row.blocker}</p> : null}
              {kind === "actions" && !["Done", "Archived"].includes(row.status) ? <p className="mt-3 rounded-control border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Progress updates are paused. The system must first verify the individual officer and their assignment to this action. Shared staff access cannot record accountable progress.</p> : null}
              {row.purpose || row.agenda ? <div className="mt-3 space-y-2 border-t border-line pt-3 text-xs leading-5 text-ink-700">{row.purpose ? <p><strong>Purpose:</strong> {row.purpose}</p> : null}{row.chairRole ? <p><strong>Chair role:</strong> {row.chairRole}</p> : null}{row.secretaryRole ? <p><strong>Secretary role:</strong> {row.secretaryRole}</p> : null}{row.agenda ? <p className="whitespace-pre-wrap"><strong>Agenda:</strong> {row.agenda}</p> : null}{row.decisionItems ? <p className="whitespace-pre-wrap"><strong>Decision items:</strong> {row.decisionItems}</p> : null}{row.draftMinutes ? <p className="whitespace-pre-wrap"><strong>Draft minutes:</strong> {row.draftMinutes}</p> : null}{row.decisionOutcome ? <p className="whitespace-pre-wrap"><strong>Decision outcome · draft:</strong> {row.decisionOutcome}</p> : null}</div> : null}
              {row.sourceMeetingId ? <Link href={`/ops/review/${encodeURIComponent(row.sourceMeetingId)}`} className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-forest-800 hover:underline">Open source meeting →</Link> : null}
              {row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="mt-2 ml-3 inline-flex min-h-9 items-center text-xs font-semibold text-forest-800 underline">Open Notion record ↗</a> : null}
            </article>
          ))}
        </div>
        {nextCursor ? <button type="button" onClick={() => void refresh(true)} disabled={busy} className="min-h-11 rounded-control border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50">{busy ? "Loading…" : "Load more records"}</button> : null}
      </section>

      <footer className="rounded-card border border-line bg-cream-50 p-4">
        <p className="text-sm font-semibold text-ink-950">Institutional use</p>
        <p className="mt-1 text-sm leading-6 text-ink-700">Shared registers connect departments and executive coordination. Draft records, role labels and meeting links do not grant authority. Formal approval, official publication, decision certification and action acceptance remain separate controlled processes.</p>
        <Link href="/ops/executive" className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-forest-800 hover:underline">Return to executive desk →</Link>
      </footer>
    </div>
  );
}
