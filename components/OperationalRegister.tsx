"use client";
import { useEffect, useState } from "react";
type Kind = "actions" | "media" | "chamber";
type RecordRow = { id: string; title: string; status: string; detail: string; date: string; url: string };
const TITLES: Record<Kind, string> = { actions: "Action register", media: "Communications work queue", chamber: "Chamber sessions" };
const DETAILS: Record<Kind, string> = { actions: "Create follow-up actions with an accountable role, due date and visible status.", media: "Create editorial drafts for human review. This module does not publish content.", chamber: "Schedule institutional sessions and keep their records together. This module does not certify decisions." };
export default function OperationalRegister({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [date, setDate] = useState("");
  const [channel, setChannel] = useState("Website");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  async function refresh(append = false) {
    setBusy(true); setError("");
    const cursor = append ? nextCursor : null;
    try {
      const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const r = await fetch(`/ops/api/registers/${kind}${suffix}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not load register.");
      if (!Array.isArray(j.records) || (j.nextCursor !== null && typeof j.nextCursor !== "string") || typeof j.hasMore !== "boolean") throw new Error("The register returned an invalid response. No records are shown.");
      setRows(current => append ? [...current, ...j.records] : j.records);
      setNextCursor(j.hasMore ? j.nextCursor : null);
      setLoaded(true);
    } catch (e) {
      if (!append) { setRows([]); setLoaded(false); setNextCursor(null); }
      setError(e instanceof Error ? e.message : "Could not load register.");
    } finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, [kind]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { const r = await fetch(`/ops/api/registers/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kind === "media" ? { title, detail, channel } : { title, detail, date }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || "Could not save record."); setTitle(""); setDetail(""); setDate(""); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save record."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-4xl space-y-6">
    <header className="rounded-card border border-forest-900 bg-forest-950 p-5 text-white sm:p-7"><p className="text-xs font-semibold uppercase tracking-widest text-[#d7c18f]">Private · Notion-backed register</p><h1 className="mt-2 font-serif text-3xl">{TITLES[kind]}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{DETAILS[kind]}</p></header>
    <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-forest-950">Create a record</h2><span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">{kind === "media" ? "Draft only" : kind === "chamber" ? "Scheduling only" : "Open action"}</span></div>
      <form onSubmit={submit} className="mt-4 space-y-3"><label className="block text-sm font-medium">Title<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line px-3" /></label>
      {kind === "actions" ? <label className="block text-sm font-medium">Accountable role (not an access grant)<input value={detail} onChange={e=>setDetail(e.target.value)} placeholder="e.g. Department Director" className="mt-1 min-h-11 w-full rounded-control border border-line px-3" /></label> : <label className="block text-sm font-medium">{kind === "media" ? "Brief / notes" : "Session summary"}<textarea value={detail} onChange={e=>setDetail(e.target.value)} maxLength={1800} rows={3} className="mt-1 w-full rounded-control border border-line p-3" /></label>}
      {kind === "media" ? <label className="block text-sm font-medium">Channel<select value={channel} onChange={e=>setChannel(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line px-3"><option>Website</option><option>WhatsApp</option><option>X</option><option>Other</option></select></label> : null}
      {kind !== "media" ? <label className="block text-sm font-medium">{kind === "actions" ? "Due date · required" : "Session date · required"}<input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line px-3" /></label> : null}
      <button disabled={busy || !title.trim()} className="min-h-11 rounded-control bg-forest-900 px-5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save to Notion"}</button></form>
      <p className="mt-3 text-xs leading-5 text-ink-600">Creation is limited to initial workflow states. Approval, publication, closure and formal decisions remain human-authorised and are not enabled by the transitional shared-key session.</p>
    </section>
    <section className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-forest-950">Register records</h2><button onClick={()=>void refresh()} disabled={busy} className="min-h-10 rounded-control border border-line px-3 text-sm font-semibold">Refresh</button></div>
    {error ? <p role="alert" className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p> : null}
    {!loaded && !error ? <p className="text-sm text-ink-600">Loading records…</p> : null}
    {loaded && rows.length === 0 ? <p className="rounded-card border border-line bg-white p-4 text-sm text-ink-600">The connected register contains no records on the returned page.</p> : null}
    {rows.map(row=><article key={row.id} className="rounded-card border border-line bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-forest-950">{row.title}</h3><span className="rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs">{row.status}</span></div>{row.detail ? <p className="mt-2 text-sm text-ink-700">{row.detail}</p> : null}{row.date ? <p className="mt-1 text-xs text-ink-600">{row.date}</p> : null}{row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-forest-800 underline">Open Notion record ↗</a> : null}</article>)}
    {nextCursor ? <button type="button" onClick={()=>void refresh(true)} disabled={busy} className="min-h-11 rounded-control border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50">{busy ? "Loading…" : "Load more records"}</button> : null}
    </section>
  </div>;
}
