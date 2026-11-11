"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { DepartmentEvidenceOption, OpsDepartmentId, WorkPlanRecord, WorkPriority, RiskLevel } from "@/lib/department-operations";

type Props = { departmentId: OpsDepartmentId; departmentName: string; evidenceOptions: DepartmentEvidenceOption[] };

export default function DepartmentWorkPlanPanel({ departmentId, departmentName, evidenceOptions }: Props) {
  const [rows, setRows] = useState<WorkPlanRecord[]>([]);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<WorkPriority>("Unspecified");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Unspecified");
  const [contributors, setContributors] = useState("");
  const [accountableRole, setAccountableRole] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const refresh = useCallback(
    async (append = false) => {
      setBusy(true);
      setError("");
      try {
        const cursor = append ? nextCursor : null;
        const qs = new URLSearchParams({ department: departmentId });
        if (cursor) qs.set("cursor", cursor);
        const r = await fetch(`/ops/api/department-workplans?${qs}`, { cache: "no-store" });
        const j = await r.json();
        if (r.status === 503) {
          setConfigured(false);
          setRows([]);
          setLoaded(true);
          setNextCursor(null);
          setError(j.error || "Department work plans register is not configured.");
          return;
        }
        if (!r.ok) throw new Error(j.error || "Could not load work plans.");
        if (!Array.isArray(j.records)) {
          throw new Error("The register returned an invalid response. No records are shown.");
        }
        setConfigured(true);
        setRows((current) => (append ? [...current, ...j.records] : j.records));
        setNextCursor(j.hasMore ? j.nextCursor : null);
        setLoaded(true);
      } catch (e) {
        if (!append) {
          setRows([]);
          setLoaded(false);
          setNextCursor(null);
        }
        setError(e instanceof Error ? e.message : "Could not load work plans.");
      } finally {
        setBusy(false);
      }
    },
    [departmentId, nextCursor]
  );

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body: Record<string, string> = {
        title,
        departmentId,
        objective,
        deliverable,
        startDate,
        dueDate,
        priority,
        riskLevel,
        contributors,
        accountableRole,
        evidenceUrl,
      };
      const r = await fetch("/ops/api/department-workplans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save work-plan item.");
      setTitle("");
      setObjective("");
      setDeliverable("");
      setStartDate("");
      setDueDate("");
      setPriority("Unspecified");
      setRiskLevel("Unspecified");
      setContributors("");
      setAccountableRole("");
      setEvidenceUrl("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save work-plan item.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
            Work planning · {departmentName}
          </p>
          <h2 className="mt-1 font-serif text-xl text-forest-950">Work plans & deliverables</h2>
          <p className="mt-1 text-sm leading-6 text-ink-600">
            Items start as Proposed. Completion claims require evidence. Role titles are not appointments.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
          {configured === false ? "Not connected" : configured ? "Connected · Proposed only" : "Checking…"}
        </span>
      </div>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[#e1e7df] bg-[#f8faf7] px-3 py-2 text-xs leading-5 text-[#59665d]">
        <span>Need a follow-up? Copy the work-plan record’s Notion URL into the Action notes. The current registers do not create an automatic link, approval or assignment.</span>
        <Link href="/ops/actions" className="inline-flex min-h-8 items-center font-semibold text-[#194b3b] underline underline-offset-2">Open Action register →</Link>
      </p>

      {configured === true ? (
        <details className="rounded-xl border border-[#dfe6df] bg-[#fafbf8] p-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#194b3b]">
            <span>Add a work-plan item<span className="mt-1 block text-xs font-normal text-[#68736b]">New items are saved as Proposed. They are not proof that work has started.</span></span>
            <span aria-hidden="true" className="text-lg text-[#a7833f]">＋</span>
          </summary>
          <div className="mt-3">
          <form onSubmit={submit} className="grid gap-3 rounded-control border border-line bg-cream-50 p-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Title · required
            <input required minLength={3} maxLength={180} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Objective
            <textarea maxLength={1800} rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Deliverable
            <input maxLength={1800} value={deliverable} onChange={(e) => setDeliverable(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as WorkPriority)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal">
              <option value="Unspecified">Not set</option><option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Risk level
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as RiskLevel)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal">
              <option value="Unspecified">Not assessed</option><option value="Low">Low</option><option value="Moderate">Moderate</option><option value="High">High</option><option value="Critical">Critical</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Supporting teams / roles
            <input maxLength={1000} value={contributors} onChange={(e) => setContributors(e.target.value)} placeholder="Departments or role titles only — no personal or sensitive details" className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Proposed accountable role · title only
            <input maxLength={180} value={accountableRole} onChange={(e) => setAccountableRole(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          
          {evidenceOptions.length > 0 ? (
            <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
              Select an Observatory source (optional)
              <select
                value={evidenceOptions.some((option) => option.sourceUrl === evidenceUrl) ? evidenceUrl : ""}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal"
              >
                <option value="">No Observatory source selected</option>
                {evidenceOptions.map((option) => (
                  <option key={option.id} value={option.sourceUrl}>
                    {option.title} · {option.publisher} · {option.referencePeriod} · {option.geographyLabel}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs font-normal text-ink-600">This copies the original publisher URL. The Observatory record ID is not stored in the current Notion register.</span>
            </label>
          ) : null}
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Evidence / deliverable URL (optional)
            <input type="url" maxLength={2048} value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://…" className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
            <span className="mt-1 block text-xs font-normal text-ink-600">Link to the source used. A source link does not prove work completion or impact.</span>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" disabled={busy || !title.trim()} className="min-h-11 rounded-control bg-forest-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save work-plan item"}</button>
            <button type="button" onClick={() => void refresh()} disabled={busy} className="min-h-11 rounded-control border border-line px-4 text-sm font-semibold disabled:opacity-50">Refresh</button>
          </div>
        </form>
          </div>
        </details>
      ) : configured === false ? (
        <p className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          Configure <code className="text-xs">NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID</code>. Work-plan items use the shared register’s Operations work type; no separate work-plan database is assumed.
        </p>
      ) : (
        <p role="status" className="rounded-xl border border-[#e1e7df] bg-[#f8faf7] p-4 text-xs leading-5 text-[#68736b]">Checking the shared operations register. Work-plan entry becomes available only after the connection is confirmed.</p>
      )}

      {error ? (<p role="alert" className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p>) : null}
      {loaded && configured && rows.length === 0 ? (<div className="rounded-xl border border-dashed border-[#d9e1d8] bg-[#f8faf7] p-4">
          <p className="text-sm font-semibold text-[#35483d]">No work-plan items returned</p>
          <p className="mt-1 text-xs leading-5 text-[#68736b]">There are no work-plan entries on the current result page for this department.</p>
        </div>) : null}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-control border border-line bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-forest-950">{row.title}</p>
              <StatusBadge status={row.status} />
            </div>
            {row.objective ? <p className="mt-1 text-sm text-ink-700">{row.objective}</p> : null}
            <p className="mt-1 text-xs text-ink-600">{[row.startDate && `Start ${row.startDate}`, row.dueDate && `Due ${row.dueDate}`, row.accountableRole && `Proposed role · ${row.accountableRole}`, row.deliverable].filter(Boolean).join(" · ")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {row.priority !== "Unspecified" ? <span className="rounded-full border border-[#e4e8e1] bg-[#fafbf8] px-2.5 py-1 text-[10px] font-semibold text-[#405b49]">Priority · {row.priority}</span> : null}
              {row.riskLevel !== "Unspecified" ? <span className="rounded-full border border-[#e4e8e1] bg-[#fafbf8] px-2.5 py-1 text-[10px] font-semibold text-[#805b27]">Risk · {row.riskLevel}</span> : null}
            </div>
            {row.contributors ? <p className="mt-2 text-xs text-ink-600"><span className="font-semibold">Supporting teams / roles:</span> {row.contributors}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              {row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center text-xs font-semibold text-forest-800 underline underline-offset-2">Open work-plan record ↗</a> : null}
              {row.evidenceNote ? <a href={row.evidenceNote} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center text-xs font-semibold text-forest-800 underline underline-offset-2">Open evidence / deliverable ↗</a> : null}
            </div>
          </li>
        ))}
      </ul>
      {nextCursor ? (<button type="button" onClick={() => void refresh(true)} disabled={busy} className="min-h-11 rounded-control border border-line px-4 text-sm font-semibold disabled:opacity-50">{busy ? "Loading…" : "Load more work-plan items"}</button>) : null}
    </div>
  );
}
