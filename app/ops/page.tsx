import Link from "next/link";
import { configFlags, listMeetings } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function CommandBriefPage() {
  const flags = configFlags();
  let meetings: Awaited<ReturnType<typeof listMeetings>> = [];
  let listError: string | null = null;
  if (flags.token && flags.meetings) {
    try {
      meetings = await listMeetings();
    } catch (e) {
      listError = e instanceof Error ? e.message : "Could not load meetings";
    }
  }
  const awaiting = meetings.filter((m) =>
    ["New", "Draft", "In review"].includes(m.status)
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 text-slate-100 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
          Presidential Command Brief
        </p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl">
          Attention for institutional leadership
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Same DOC mission: structured institutional memory with human approval. Backend is Notion
          — not Supabase.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Meetings in queue</p>
            <p className="mt-1 font-serif text-3xl">{awaiting.length}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Meetings total</p>
            <p className="mt-1 font-serif text-3xl">{meetings.length}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Notion meetings DB</p>
            <p className="mt-1 font-serif text-xl">{flags.meetings ? "Connected" : "Not set"}</p>
          </div>
        </div>
        {listError ? <p className="mt-4 text-sm text-amber-200">{listError}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/ops/queue"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950"
          >
            Open meeting queue
          </Link>
          <Link
            href="/ops/intake"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-600 px-4 text-sm font-semibold text-white"
          >
            New meeting intake
          </Link>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Configuration</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {(
            [
              ["Staff key", flags.staffKey],
              ["Notion token", flags.token],
              ["Meetings database", flags.meetings],
              ["Media database", flags.media],
              ["Chamber database", flags.chamber],
              ["Actions database", flags.actions],
            ] as const
          ).map(([label, ok]) => (
            <li key={label} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2">
              <span>{label}</span>
              <span className={ok ? "font-semibold text-emerald-700" : "text-slate-400"}>
                {ok ? "Ready" : "Missing"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
