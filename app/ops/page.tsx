import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";

export const dynamic = "force-dynamic";

const departments = [
  { id: "education", name: "Education & Capacity Building" },
  { id: "health", name: "Health & Well-being" },
  { id: "digital-systems", name: "Digital Systems & Technology" },
  { id: "civic-affairs", name: "Civic Affairs" },
] as const;

export default async function CommandBriefPage() {
  // Defence in depth: verify at the page/data boundary as well as the
  // protected layout before reading the private Notion meeting register.
  if (!(await requireStaffSession())) redirect("/login");

  const flags = configFlags();
  let meetings: Awaited<ReturnType<typeof listMeetings>>["meetings"] = [];
  let listError: string | null = null;
  if (flags.token && flags.meetings) {
    try {
      const firstPage = await listMeetings({ pageSize: 25 });
      meetings = filterLegacyVisibleMeetings(firstPage.meetings);
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
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-[27px] leading-tight sm:text-3xl">Command home</h1>
            </div>
            <span className="inline-flex min-h-[32px] w-fit items-center rounded-full border border-white/20 px-3 text-xs font-medium text-white/80">Private</span>
          </div>
        </div>
        <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4 sm:px-7">
            <p className="text-xs text-white/60">Awaiting · first page</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{queueConnected ? awaiting.length : "—"}</p>
            <p className="mt-1 text-xs text-white/60">{queueConnected ? "Up to 25 loaded records · open queue for more" : "Not connected"}</p>
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
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Governance structure</p>
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
          <h2 id="departments-heading" className="text-lg font-semibold text-forest-950">Department desks</h2>
          <Link href="/ops/readiness" className="min-h-[44px] inline-flex items-center text-sm font-semibold text-forest-800 hover:underline">View readiness</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {departments.map((department) => (
            <Link key={department.id} href={`/ops/departments/${department.id}`} className="flex min-h-[112px] flex-col rounded-card border border-line bg-white p-4 shadow-card hover:border-forest-800">
              <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-ink-700">Not operational</span>
              <h3 className="mt-4 text-sm font-semibold leading-5 text-ink-950">{department.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="shared-heading" className="rounded-card border border-line bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Shared function · not a fifth department</p>
          <h2 id="shared-heading" className="mt-1 text-base font-semibold text-forest-950">Communications coordination</h2>
        </div>
        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-ink-700">Not operational</span>
          <Link href="/ops/media" className="inline-flex min-h-[44px] items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800 hover:bg-forest-100">Module status</Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/ops/queue" className="group rounded-card border border-forest-900 bg-forest-900 p-5 shadow-card hover:bg-forest-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d7c18f]">Primary action · human review</p>
          <h2 className="mt-1 text-base font-semibold text-white">Open queue</h2>
          <span className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-white">Open</span>
        </Link>
        <Link href="/ops/intake" className="group rounded-card border border-line bg-white p-5 shadow-card hover:border-forest-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Notion workflow</p>
          <h2 className="mt-1 text-base font-semibold text-forest-950">Meeting intake</h2>
          <span className="mt-4 inline-flex min-h-[44px] items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800">Start</span>
        </Link>
      </section>

      <section aria-labelledby="environment-heading" className="rounded-card border border-line bg-white p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Configuration indicators</p>
          <h2 id="environment-heading" className="mt-1 text-sm font-semibold text-forest-950">Environment configuration</h2>
        </div>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {([
            ["Staff key", flags.staffKey],
            ["Notion token", flags.token],
            ["Meetings database", flags.meetings],
            ["Media database", flags.media],
            ["Chamber database", flags.chamber],
            ["Actions database", flags.actions],
          ] as const).map(([label, configured]) => (
            <li key={label} className="flex min-h-[40px] items-center justify-between rounded-control border border-line px-3">
              <span className="text-ink-700">{label}</span>
              <span className={configured ? "font-semibold text-forest-800" : "text-ink-600"}>{configured ? "Configured" : "Not configured"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-line bg-forest-100 p-4 sm:p-5">
        <p className="text-sm font-semibold text-forest-950">Published civic systems</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="https://2027-street-mandate.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-control border border-forest-900 bg-white px-3 text-sm font-semibold text-forest-900">Civic Mandate ↗</a>
          <a href="https://iseyc-civic-brain.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-control border border-forest-900 bg-white px-3 text-sm font-semibold text-forest-900">Civic Brain ↗</a>
        </div>
      </section>
    </div>
  );
}
