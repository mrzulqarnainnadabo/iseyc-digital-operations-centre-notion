"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type Kind = "actions" | "media" | "chamber";
type RecordRow = {
  id: string;
  title: string;
  status: string;
  detail: string;
  date: string;
  url: string;
};

const TITLES: Record<Kind, string> = {
  actions: "Action register",
  media: "Communications work queue",
  chamber: "Chamber sessions",
};

const DETAILS: Record<Kind, string> = {
  actions:
    "Create follow-up actions with an accountable role, due date and visible status. Closure, evidence review and formal escalation remain disabled under the transitional shared-key session.",
  media:
    "Create editorial drafts for human review. This module does not publish content, approve messaging or dispatch official communications.",
  chamber:
    "Schedule institutional sessions and keep their records together. This module does not certify decisions, record attendance or issue formal minutes.",
};

const KIND_LABEL: Record<Kind, string> = {
  actions: "Actions",
  media: "Communications",
  chamber: "Chamber",
};

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
    setBusy(true);
    setError("");
    const cursor = append ? nextCursor : null;
    try {
      const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const r = await fetch(`/ops/api/registers/${kind}${suffix}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not load register.");
      if (
        !Array.isArray(j.records) ||
        (j.nextCursor !== null && typeof j.nextCursor !== "string") ||
        typeof j.hasMore !== "boolean"
      ) {
        throw new Error("The register returned an invalid response. No records are shown.");
      }
      setRows((current) => (append ? [...current, ...j.records] : j.records));
      setNextCursor(j.hasMore ? j.nextCursor : null);
      setLoaded(true);
    } catch (e) {
      if (!append) {
        setRows([]);
        setLoaded(false);
        setNextCursor(null);
      }
      setError(e instanceof Error ? e.message : "Could not load register.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [kind]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/ops/api/registers/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "media" ? { title, detail, channel } : { title, detail, date }
        ),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save record.");
      setTitle("");
      setDetail("");
      setDate("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save record.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
              Shared operational register · {KIND_LABEL[kind]}
            </p>
            <h1 className="mt-1 font-serif text-2xl text-forest-950 sm:text-3xl">{TITLES[kind]}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">{DETAILS[kind]}</p>
          </div>
          <Link
            href="/ops/readiness"
            className="inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline"
          >
            Module readiness →
          </Link>
        </div>
        <section className="rounded-card border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-950">Authority boundary</p>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            Records created here are initial workflow states only. Approval, publication, closure and
            formal decisions remain human-authorised and are not enabled by the transitional shared-key
            session. An accountable role field does not assign access or imply a named appointment.
          </p>
        </section>
      </header>

      <section className="rounded-card border border-line bg-white p-5 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Create record</p>
        <h2 className="mt-1 font-serif text-xl text-forest-950">New {KIND_LABEL[kind].toLowerCase()} entry</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="block text-sm font-semibold text-ink-800">
            Title · required
            <input
              required minLength={2} maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal text-ink-950"
              placeholder={
                kind === "actions"
                  ? "Action title"
                  : kind === "media"
                    ? "Draft title"
                    : "Session title"
              }
            />
          </label>

          {kind === "actions" ? (
            <label className="block text-sm font-semibold text-ink-800">
              Accountable owner role · required
              <input
                required minLength={2} maxLength={180}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal text-ink-950"
                placeholder="Role title only — not a personal appointment claim"
              />
            </label>
          ) : (
            <label className="block text-sm font-semibold text-ink-800">
              {kind === "media" ? "Brief notes" : "Session summary"}
              <textarea
                maxLength={1800}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-control border border-line bg-cream-50 px-3 py-2 text-sm font-normal text-ink-950"
              />
            </label>
          )}

          {kind === "media" ? (
            <label className="block text-sm font-semibold text-ink-800">
              Channel
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal text-ink-950"
              >
                <option>Website</option>
                <option>Social</option>
                <option>Email</option>
                <option>Press</option>
                <option>Internal</option>
              </select>
            </label>
          ) : null}

          {kind === "actions" || kind === "chamber" ? (
            <label className="block text-sm font-semibold text-ink-800">
              {kind === "actions" ? "Due date · required" : "Session date · required"}
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-control border border-line bg-cream-50 px-3 text-sm font-normal text-ink-950"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="min-h-11 rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save to Notion"}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={busy}
              className="min-h-11 rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-950 hover:bg-cream-50 disabled:opacity-50"
            >
              Refresh list
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs leading-5 text-ink-600">
          Creation is limited to initial workflow states. Approval, publication, closure and formal
          decisions remain human-authorised and are not enabled by the transitional shared-key session.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Register</p>
            <h2 className="font-semibold text-forest-950">Register records</h2>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={busy}
            className="min-h-10 rounded-control border border-line px-3 text-sm font-semibold disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <p role="alert" className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            {error}
          </p>
        ) : null}

        {!loaded && !error ? <p className="text-sm text-ink-600">Loading records…</p> : null}

        {loaded && rows.length === 0 ? (
          <p className="rounded-card border border-line bg-white p-4 text-sm text-ink-600">
            The connected register contains no records on the returned page.
          </p>
        ) : null}

        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-card border border-line bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-forest-950">{row.title}</h3>
                <StatusBadge status={row.status} />
              </div>
              {row.detail ? <p className="mt-2 text-sm leading-6 text-ink-700">{row.detail}</p> : null}
              {row.date ? <p className="mt-1 text-xs text-ink-600">{row.date}</p> : null}
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
            className="min-h-11 rounded-control border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Loading…" : "Load more records"}
          </button>
        ) : null}
      </section>

      <footer className="rounded-card border border-line bg-cream-50 p-4">
        <p className="text-sm font-semibold text-ink-950">Department use</p>
        <p className="mt-1 text-sm leading-6 text-ink-700">
          This register is shared across departments. Department workspaces link here for follow-up
          work; they do not create separate private copies of these records. Open a department desk to
          review mandate, meeting context and the authorised operational path.
        </p>
        <Link
          href="/ops/readiness"
          className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline"
        >
          Open department workspaces →
        </Link>
      </footer>
    </div>
  );
}
