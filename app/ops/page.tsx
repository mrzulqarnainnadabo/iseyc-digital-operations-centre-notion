import Link from "next/link";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";

export const dynamic = "force-dynamic";

const departments = [
  { id: "education", name: "Education & Capacity Building", description: "Learning, skills development and institutional capacity." },
  { id: "health", name: "Health & Well-being", description: "Health awareness, well-being and community health initiatives." },
  { id: "digital-systems", name: "Digital Systems & Technology", description: "Digital infrastructure, technology delivery and systems support." },
  { id: "civic-affairs", name: "Civic Affairs", description: "Civic participation, public evidence and accountability work." },
] as const;

export default async function CommandBriefPage() {
  const flags = configFlags();
  let meetings: Awaited<ReturnType<typeof listMeetings>> = [];
  let listError: string | null = null;
  if (flags.token && flags.meetings) {
    try {
      meetings = filterLegacyVisibleMeetings(await listMeetings());
    } catch {
      listError = "Unable to load the meeting queue. No count is shown until the source responds.";
    }
  }

  const awaiting = meetings.filter((meeting) => ["New", "Draft", "In review"].includes(meeting.status));
  const queueConnected = flags.token && flags.meetings && !listError;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="overflow-hidden rounded-card border border-forest-900 bg-forest-950 text-white shadow-card">
        <div className="border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d7c18f]">Institutional command desk</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-[27px] leading-tight sm:text-3xl">Command home</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">A working view of institutional responsibilities, review activity and system readiness.</p>
            </div>
            <span className="inline-flex min-h-[32px] w-fit items-center rounded-full border border-white/20 px-3 text-xs font-medium text-white/80">Private officer interface</span>
          </div>
        </div>
        <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4 sm:px-7">
            <p className="text-xs text-white/60">Items awaiting review</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{queueConnected ? awaiting.length : "—"}</p>
            <p className="mt-1 text-xs text-white/60">{queueConnected ? "Current Standard meeting records" : "Not connected"}</p>
          </div>
          <div className="px-5 py-4 sm:px-7">
            <p className="text-xs text-white/60">Meeting register</p>
            <p className="mt-1 text-xl font-semibold">{queueConnected ? "Connected" : "Not connected"}</p>
            <p className="mt-1 text-xs text-white/60">Notion-backed · Standard records only</p>
          </div>
          <div className="px-5 py-4 sm:px-7">
            <p className="text-xs text-white/60">Decision authority</p>
            <p className="mt-1 text-xl font-semibold">Human-led</p>
            <p className="mt-1 text-xs text-white/60">Transitional shared-key limits apply</p>
          </div>
        </div>
        {listError ? <p role="alert" className="border-t border-white/10 bg-amber-950/40 px-5 py-3 text-sm text-amber-100 sm:px-7">{listError}</p> : null}
      </section>

      <section aria-labelledby="council-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Governance structure</p>
            <h2 id="council-heading" className="text-lg font-semibold text-forest-950">Presidential Council</h2>
          </div>
          <span className="text-xs text-ink-600">Seat occupancy not connected</span>
        </div>
        <div className="rounded-card border border-line bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-semibold text-ink-950">Council seat register</p>
            <p className="mt-1 text-sm leading-5 text-ink-600">Role titles, appointment records and current seat-holders must come from approved governance data.</p>
          </div>
          <span className="mt-3 inline-flex min-h-[30px] items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-900 sm:mt-0">Not connected</span>
        </div>
      </section>

      <section id="departments" aria-labelledby="departments-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Four institutional departments</p>
            <h2 id="departments-heading" className="text-lg font-semibold text-forest-950">Department desks</h2>
          </div>
          <Link href="/ops/readiness" className="min-h-[40px] inline-flex items-center text-sm font-semibold text-forest-800 hover:underline">View readiness</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {departments.map((department) => (
            <article key={department.id} className="flex min-h-[176px] flex-col rounded-card border border-line bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-100 text-sm font-bold text-forest-900" aria-hidden="true">{department.name.slice(0,1)}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-ink-700">Not operational</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold leading-5 text-ink-950">{department.name}</h3>
              <p className="mt-1 text-xs leading-5 text-ink-600">{department.description}</p>
              <p className="mt-auto pt-3 text-[11px] text-ink-600">Desk activation awaits approved roles and workflow data.</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="shared-heading" className="rounded-card border border-line bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Shared function · not a fifth department</p>
          <h2 id="shared-heading" className="mt-1 text-base font-semibold text-forest-950">Communications coordination</h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-ink-600">Shared communications sits under the Chief of Staff coordination line. Editorial permissions and publication approvals remain human-controlled.</p>
        </div>
        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-ink-700">Not operational</span>
          <Link href="/ops/media" className="inline-flex min-h-[44px] items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800 hover:bg-forest-100">Module status</Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/ops/queue" className="group rounded-card border border-line bg-white p-5 shadow-card hover:border-forest-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Human review</p>
          <h2 className="mt-1 text-base font-semibold text-forest-950">Open approval queue</h2>
          <p className="mt-1 text-sm text-ink-600">Review meeting records and inspect their current workflow state.</p>
          <span className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800">Open queue →</span>
        </Link>
        <Link href="/ops/intake" className="group rounded-card border border-line bg-white p-5 shadow-card hover:border-forest-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Notion workflow</p>
          <h2 className="mt-1 text-base font-semibold text-forest-950">Submit meeting intake</h2>
          <p className="mt-1 text-sm text-ink-600">Create a Standard meeting record for controlled review.</p>
          <span className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800">Start intake →</span>
        </Link>
      </section>

      <section className="rounded-card border border-line bg-forest-100/70 p-4 sm:p-5">
        <p className="text-sm font-semibold text-forest-950">Published civic systems</p>
        <p className="mt-1 text-sm leading-5 text-ink-700">These links open their public surfaces. They do not expose private submissions or internal officer records.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="https://2027-street-mandate.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-control border border-forest-900/20 bg-white px-3 text-sm font-semibold text-forest-900">Civic Mandate ↗</a>
          <a href="https://iseyc-civic-brain.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-control border border-forest-900/20 bg-white px-3 text-sm font-semibold text-forest-900">Civic Brain ↗</a>
        </div>
      </section>
    </div>
  );
}
