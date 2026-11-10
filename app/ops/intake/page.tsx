"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function IntakePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [conveningBody, setConveningBody] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [venue, setVenue] = useState("");
  const [purpose, setPurpose] = useState("");
  const [ownerRole, setOwnerRole] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participants, setParticipants] = useState("");
  const [preReading, setPreReading] = useState("");
  const [decisions, setDecisions] = useState("");
  const [minutesOwner, setMinutesOwner] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const meetingPack = useMemo(() => [
    ["Purpose", purpose],
    ["Proposed time", meetingTime ? `${meetingTime} WAT (Africa/Lagos)` : ""],
    ["Venue / meeting link", venue],
    ["Meeting owner role", ownerRole],
    ["Agenda", agenda],
    ["Required participants by role", participants],
    ["Pre-reading / papers", preReading],
    ["Decisions or outcomes sought", decisions],
    ["Minutes owner role", minutesOwner],
    ["Additional notes", notes],
  ].filter(([, value]) => String(value).trim()).map(([label, value]) => `${label}:\n${String(value).trim()}`).join("\n\n"), [
    purpose, meetingTime, venue, ownerRole, agenda, participants, preReading, decisions, minutesOwner, notes,
  ]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending || meetingPack.length > 1900) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/ops/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, conveningBody, meetingDate, summary: meetingPack, sensitivity: "Standard" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "The meeting record could not be created.");
        return;
      }
      router.push(`/ops/review/${encodeURIComponent(data.id)}`);
      router.refresh();
    } catch {
      setError("The service could not be reached. No successful submission was confirmed.");
    } finally {
      setPending(false);
    }
  }

  const field = "mt-1 min-h-[46px] w-full rounded-control border border-line bg-white px-3 text-sm text-ink-950";
  const area = "mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm leading-5 text-ink-950";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <Link href="/ops/executive" className="inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline">← Executive desk</Link>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold-700">Executive coordination · Meetings</p>
        <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">Prepare a meeting brief</h1>
        <p className="max-w-2xl text-sm leading-6 text-ink-600">Capture the purpose, agenda, participants by role and expected outcomes before a meeting enters the internal review queue.</p>
      </header>

      <div className="rounded-xl border border-[#e7d9b8] bg-[#fbf8ef] p-4">
        <p className="text-sm font-semibold text-[#6e5425]">Standard-sensitivity intake only</p>
        <p className="mt-1 text-xs leading-5 text-[#756c58]">This creates a New meeting record for review. It does not approve the meeting, send invitations, confirm attendance or issue an official notice. Do not enter restricted or sensitive personal information.</p>
      </div>

      <form onSubmit={onSubmit} aria-busy={pending} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
        <section className="space-y-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold-700">01 · Meeting identity</p><h2 className="mt-1 font-serif text-xl text-forest-950">What is being convened?</h2></div>
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-ink-950">Meeting title <span className="text-red-700">*</span></label>
            <input id="title" required minLength={5} maxLength={200} autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="body" className="block text-sm font-semibold text-ink-950">Convening body</label><input id="body" maxLength={200} autoComplete="organization" value={conveningBody} onChange={(e) => setConveningBody(e.target.value)} className={field} placeholder="e.g. Executive Council" /></div>
            <div><label htmlFor="owner" className="block text-sm font-semibold text-ink-950">Meeting owner / secretariat role <span className="text-red-700">*</span></label><input id="owner" required maxLength={120} value={ownerRole} onChange={(e) => setOwnerRole(e.target.value)} className={field} placeholder="Role title only, not a named appointment" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label htmlFor="date" className="block text-sm font-semibold text-ink-950">Proposed date <span className="text-red-700">*</span></label><input id="date" required type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className={field} /></div>
            <div><label htmlFor="time" className="block text-sm font-semibold text-ink-950">Proposed time</label><input id="time" type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className={field} /><p className="mt-1 text-[10px] text-ink-600">West Africa Time</p></div>
            <div><label htmlFor="venue" className="block text-sm font-semibold text-ink-950">Venue / meeting link</label><input id="venue" maxLength={240} value={venue} onChange={(e) => setVenue(e.target.value)} className={field} placeholder="Location or online link" /></div>
          </div>
          <div><label htmlFor="purpose" className="block text-sm font-semibold text-ink-950">Purpose and expected result <span className="text-red-700">*</span></label><textarea id="purpose" required rows={3} maxLength={450} value={purpose} onChange={(e) => setPurpose(e.target.value)} className={area} placeholder="Why is this meeting necessary, and what should it produce?" /></div>
        </section>

        <div className="border-t border-line" />
        <section className="space-y-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold-700">02 · Meeting preparation</p><h2 className="mt-1 font-serif text-xl text-forest-950">Agenda and participants</h2></div>
          <div><label htmlFor="agenda" className="block text-sm font-semibold text-ink-950">Agenda items</label><textarea id="agenda" rows={4} maxLength={550} value={agenda} onChange={(e) => setAgenda(e.target.value)} className={area} placeholder={"1. Opening and review\n2. Department updates\n3. Matters requiring a decision\n4. Next steps"} /></div>
          <div><label htmlFor="participants" className="block text-sm font-semibold text-ink-950">Required participants · roles only</label><textarea id="participants" rows={2} maxLength={300} value={participants} onChange={(e) => setParticipants(e.target.value)} className={area} placeholder="e.g. National President, department leads, secretariat" /></div>
          <div><label htmlFor="papers" className="block text-sm font-semibold text-ink-950">Pre-reading and papers</label><textarea id="papers" rows={2} maxLength={300} value={preReading} onChange={(e) => setPreReading(e.target.value)} className={area} placeholder="Document titles or links to papers" /></div>
          <div><label htmlFor="decisions" className="block text-sm font-semibold text-ink-950">Decisions / outcomes sought</label><textarea id="decisions" rows={2} maxLength={300} value={decisions} onChange={(e) => setDecisions(e.target.value)} className={area} placeholder="State the question or outcome requiring consideration. Do not pre-record an approval." /></div>
          <div><label htmlFor="minutes" className="block text-sm font-semibold text-ink-950">Minutes owner role</label><input id="minutes" maxLength={120} value={minutesOwner} onChange={(e) => setMinutesOwner(e.target.value)} className={field} placeholder="Role responsible for preparing draft minutes" /></div>
          <div><label htmlFor="notes" className="block text-sm font-semibold text-ink-950">Additional notes</label><textarea id="notes" rows={2} maxLength={250} value={notes} onChange={(e) => setNotes(e.target.value)} className={area} /></div>
        </section>

        <div className="rounded-xl border border-line bg-cream-50 p-3">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-ink-950">Meeting brief length</p><p className={`text-xs font-semibold tabular-nums ${meetingPack.length > 1900 ? "text-red-700" : "text-ink-600"}`}>{meetingPack.length}/1900</p></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className={`h-full rounded-full ${meetingPack.length > 1900 ? "bg-red-700" : "bg-forest-800"}`} style={{ width: `${Math.min(100, meetingPack.length / 19)}%` }} /></div>
          <p className="mt-2 text-[10px] leading-4 text-ink-600">The existing Meetings database stores the structured brief in its approved Summary field. No new database properties or duplicate register are introduced.</p>
        </div>

        {error ? <p role="alert" aria-live="assertive" className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <button type="submit" disabled={pending || title.trim().length < 5 || !meetingDate || !purpose.trim() || !ownerRole.trim() || meetingPack.length > 1900} className="inline-flex min-h-[48px] w-full items-center justify-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Creating meeting brief…" : "Create meeting brief"}
        </button>
      </form>
    </div>
  );
}
