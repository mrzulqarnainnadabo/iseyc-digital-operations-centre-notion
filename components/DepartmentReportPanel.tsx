"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type {
  DepartmentReportRecord,
  OpsDepartmentId,
  ReportType,
} from "@/lib/department-operations";

type Props = { departmentId: OpsDepartmentId; departmentName: string };

const REPORT_TYPES: ReportType[] = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "Annual",
];

export default function DepartmentReportPanel({ departmentId, departmentName }: Props) {
  const [rows, setRows] = useState<DepartmentReportRecord[]>([]);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState<ReportType>("Monthly");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [summary, setSummary] = useState("");
  const [challenges, setChallenges] = useState("");
  const [outstandingActions, setOutstandingActions] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [dataLimitations, setDataLimitations] = useState("");

  const refresh = useCallback(
    async (append = false) => {
      setBusy(true);
      setError("");
      try {
        const cursor = append ? nextCursor : null;
        const qs = new URLSearchParams({ department: departmentId });
        if (cursor) qs.set("cursor", cursor);
        const r = await fetch(`/ops/api/department-reports?${qs}`, { cache: "no-store" });
        const j = await r.json();
        if (r.status === 503) {
          setConfigured(false);
          setRows([]);
          setLoaded(true);
          setNextCursor(null);
          setError(j.error || "Department reports register is not configured.");
          return;
        }
        if (!r.ok) throw new Error(j.error || "Could not load reports.");
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
        setError(e instanceof Error ? e.message : "Could not load reports.");
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
      const r = await fetch("/ops/api/department-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          departmentId,
          reportType,
          periodStart,
          periodEnd,
          summary,
          challenges,
          outstandingActions,
          recommendations,
          evidenceUrl,
          dataLimitations,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save report.");
      setTitle("");
      setPeriodStart("");
      setPeriodEnd("");
      setSummary("");
      setChallenges("");
      setOutstandingActions("");
      setRecommendations("");
      setEvidenceUrl("");
      setDataLimitations("");
      setReportType("Monthly");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
            Reporting · {departmentName}
          </p>
          <h2 className="mt-1 font-serif text-xl text-forest-950">Reports & documentation</h2>
          <p className="mt-1 text-sm leading-6 text-ink-600">
            Draft only. Submission for review is not institutional approval or certification.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
          {configured === false ? "Not connected" : configured ? "Connected · Draft only" : "Checking…"}
        </span>
      </div>

      {configured !== false ? (
        <details className="rounded-xl border border-[#dfe6df] bg-[#fafbf8] p-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#194b3b]">
            <span>Prepare a report draft<span className="mt-1 block text-xs font-normal text-[#68736b]">Draft records are for review; saving does not certify or approve the report.</span></span>
            <span aria-hidden="true" className="text-lg text-[#a7833f]">＋</span>
          </summary>
          <div className="mt-3">
          <form onSubmit={submit} className="grid gap-3 rounded-control border border-line bg-cream-50 p-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Title · required
            <input required minLength={3} maxLength={180} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Reporting cycle
            <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal">
              {REPORT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </label>
                    <label className="block text-sm font-semibold text-ink-800">
            Period start
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Period end
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Completed work
            <textarea maxLength={1800} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Risks & blockers
            <textarea maxLength={1800} rows={2} value={challenges} onChange={(e) => setChallenges(e.target.value)} className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            Decisions required
            <textarea maxLength={1800} rows={2} value={outstandingActions} onChange={(e) => setOutstandingActions(e.target.value)} className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Outcomes / evidence
            <textarea maxLength={1800} rows={2} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Evidence link (optional)
            <input type="url" maxLength={2048} value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://…" className="mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm font-normal" />
            <span className="mt-1 block text-xs font-normal text-ink-600">Link to the Observatory snapshot or original source used in this report.</span>
          </label>
          <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
            Data limitations
            <textarea maxLength={1800} rows={2} value={dataLimitations} onChange={(e) => setDataLimitations(e.target.value)} placeholder="Missing coverage, reference period, uncertainty, or what this report cannot establish." className="mt-1 w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal" />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" disabled={busy || !title.trim()} className="min-h-11 rounded-control bg-forest-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save report draft"}</button>
            <button type="button" onClick={() => void refresh()} disabled={busy} className="min-h-11 rounded-control border border-line px-4 text-sm font-semibold disabled:opacity-50">Refresh</button>
          </div>
        </form>
          </div>
        </details>
      ) : (
        <p className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          Configure <code className="text-xs">NOTION_DEPARTMENT_REPORTS_DATABASE_ID</code>. No report records are invented while disconnected.
        </p>
      )}

      {error ? (<p role="alert" className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p>) : null}
      {loaded && configured && rows.length === 0 ? (<p className="text-sm text-ink-600">No reports on the returned page for this department.</p>) : null}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-control border border-line bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-forest-950">{row.title}</p>
              <StatusBadge status={row.status} />
            </div>
            <p className="mt-1 text-xs text-ink-600">{row.reportType}{row.periodStart || row.periodEnd ? ` · ${row.periodStart || "—"} to ${row.periodEnd || "—"}` : ""}</p>
            {row.summary ? <p className="mt-1 text-sm text-ink-700">{row.summary}</p> : null}
            {row.evidenceUrl ? <a href={row.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-forest-800 underline">Open evidence source ↗</a> : null}
            {row.dataLimitations ? <p className="mt-2 text-xs leading-5 text-ink-600"><span className="font-semibold">Limitations:</span> {row.dataLimitations}</p> : null}
          </li>
        ))}
      </ul>
      {nextCursor ? (<button type="button" onClick={() => void refresh(true)} disabled={busy} className="min-h-11 rounded-control border border-line px-4 text-sm font-semibold disabled:opacity-50">{busy ? "Loading…" : "Load more reports"}</button>) : null}
    </div>
  );
}
