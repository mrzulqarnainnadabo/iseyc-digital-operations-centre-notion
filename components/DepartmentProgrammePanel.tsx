"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { OpsDepartmentId, ProgrammeRecord } from "@/lib/department-operations";

type Props = { departmentId: OpsDepartmentId; departmentName: string };

export default function DepartmentProgrammePanel({ departmentId, departmentName }: Props) {
  const [rows, setRows] = useState<ProgrammeRecord[]>([]);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState<"checking" | "connected" | "not-configured" | "error">("checking");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [accountableRole, setAccountableRole] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const refresh = useCallback(
    async (append = false) => {
      setBusy(true);
      setError("");
      try {
        const cursor = append ? nextCursor : null;
        const qs = new URLSearchParams({ department: departmentId });
        if (cursor) qs.set("cursor", cursor);
        const r = await fetch(`/ops/api/department-programmes?${qs}`, { cache: "no-store" });
        const j = await r.json();
        if (r.status === 503) {
          setConnectionState("not-configured");
          setRows([]);
          setLoaded(true);
          setNextCursor(null);
          setError(j.error || "Department programmes register is not configured.");
          return;
        }
        if (!r.ok) throw new Error(j.error || "Could not load programmes.");
        if (!Array.isArray(j.records)) {
          throw new Error("The register returned an invalid response. No records are shown.");
        }
        setConnectionState("connected");
        setRows((current) => (append ? [...current, ...j.records] : j.records));
        setNextCursor(j.hasMore ? j.nextCursor : null);
        setLoaded(true);
      } catch (e) {
        if (!append) {
          setConnectionState("error");
          setRows([]);
          setLoaded(false);
          setNextCursor(null);
        }
        setError(e instanceof Error ? e.message : "Could not load programmes.");
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
      const r = await fetch("/ops/api/department-programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          departmentId,
          objectives,
          accountableRole,
          deliverables: acceptanceCriteria,
          startDate,
          endDate,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save programme.");
      setTitle("");
      setObjectives("");
      setAccountableRole("");
      setAcceptanceCriteria("");
      setStartDate("");
      setEndDate("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save programme.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
            Programme management · {departmentName}
          </p>
          <h2 className="mt-1 font-serif text-xl text-forest-950">Programmes & initiatives</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
            Shared institutional register filtered to this department. Creation is limited to Proposed. Role titles do not assign appointments.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
          {connectionState === "checking" ? "Checking…" : connectionState === "connected" ? "Connected · Proposed only" : connectionState === "not-configured" ? "Not connected" : "Connection error"}
        </span>
      </div>

      {connectionState === "connected" ? (
        <details className="rounded-xl border border-[#dfe6df] bg-[#fafbf8] p-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#194b3b]">
            <span>Prepare a programme proposal<span className="mt-1 block text-xs font-normal text-[#68736b]">Saved as Proposed in the live register. This does not approve or start a programme.</span></span>
            <span aria-hidden="true" className="text-lg text-[#a7833f]">＋</span>
          </summary>
          <div className="mt-3">
          <form onSubmit={submit} className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Create proposal</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
              Title · required
              <input
                required
                minLength={3}
                maxLength={180}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal"
              />
            </label>
            <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
              Intended outcome
              <textarea
                maxLength={1800}
                rows={3}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                className="mt-1 w-full rounded-control border border-line bg-cream-50 px-3 py-2 text-sm font-normal"
              />
            </label>
                        <label className="block text-sm font-semibold text-ink-800">
              Accountable role · title only
              <input maxLength={180} value={accountableRole} onChange={(e) => setAccountableRole(e.target.value)} placeholder="Role title — not a personal appointment" className="mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal" />
            </label>
            <label className="block text-sm font-semibold text-ink-800">
              Start date
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal" />
            </label>
            <label className="block text-sm font-semibold text-ink-800">
              Due date
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal" />
            </label>
            <label className="block text-sm font-semibold text-ink-800 sm:col-span-2">
              Acceptance criteria
              <textarea maxLength={1800} rows={2} value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} className="mt-1 w-full rounded-control border border-line bg-cream-50 px-3 py-2 text-sm font-normal" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="min-h-11 rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save programme proposal"}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={busy}
              className="min-h-11 rounded-control border border-line px-4 text-sm font-semibold disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </form>
          </div>
        </details>
      ) : (
        {connectionState === "checking" ? (
          <p role="status" className="rounded-control border border-line bg-white p-3 text-sm text-ink-600">Checking the Notion register…</p>
        ) : connectionState === "not-configured" ? (
          <p className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Configure <code className="text-xs">NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID</code> and share the database with the DOC Notion integration. No programme records are invented while the register is disconnected.</p>
        ) : (
          <div className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p>The register connection could not be verified. Draft creation is disabled until the connection is restored.</p>
            <button type="button" onClick={() => void refresh()} disabled={busy} className="mt-2 min-h-10 rounded-control border border-amber-300 px-3 font-semibold disabled:opacity-50">Retry connection</button>
          </div>
        )}
      )}

      {error ? (
        <p role="alert" className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          {error}
        </p>
      ) : null}

      {!loaded && !error ? <p className="text-sm text-ink-600">Loading programmes…</p> : null}

      {loaded && connectionState === "connected" && rows.length === 0 ? (
        <p className="rounded-card border border-line bg-white p-4 text-sm text-ink-600">
          No programmes on the returned page for this department.
        </p>
      ) : null}

      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-card border border-line bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-forest-950">{row.title}</h3>
              <StatusBadge status={row.status} />
            </div>
            {row.objectives ? (
              <p className="mt-2 text-sm leading-6 text-ink-700">{row.objectives}</p>
            ) : null}
            <dl className="mt-3 grid gap-2 text-xs text-ink-600 sm:grid-cols-2">
              {row.targetCommunity ? (
                <div>
                  <dt className="font-semibold text-ink-700">Target community</dt>
                  <dd>{row.targetCommunity}</dd>
                </div>
              ) : null}
              {row.geography ? (
                <div>
                  <dt className="font-semibold text-ink-700">Geography</dt>
                  <dd>{row.geography}</dd>
                </div>
              ) : null}
              {row.accountableRole ? (
                <div>
                  <dt className="font-semibold text-ink-700">Accountable role</dt>
                  <dd>{row.accountableRole}</dd>
                </div>
              ) : null}
              {(row.startDate || row.endDate) && (
                <div>
                  <dt className="font-semibold text-ink-700">Dates</dt>
                  <dd>
                    {row.startDate || "—"} → {row.endDate || "—"}
                  </dd>
                </div>
              )}
            </dl>
            {row.url ? (
              <a
                href={row.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-forest-800 underline"
              >
                Open Notion record ↗
              </a>
            ) : null}
          </article>
        ))}
      </div>

      {nextCursor ? (
        <button
          type="button"
          onClick={() => void refresh(true)}
          disabled={busy}
          className="min-h-11 rounded-control border border-line px-4 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Loading…" : "Load more programmes"}
        </button>
      ) : null}
    </div>
  );
}
