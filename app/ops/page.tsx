import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";

export const dynamic = "force-dynamic";

const departments = [
  {
    id: "education",
    number: "01",
    name: "Education & Capacity Building",
    short: "Learning access, skills and stronger learning environments.",
    focus: ["Learning access", "Skills development", "Education partnerships"],
    tone: "education",
  },
  {
    id: "health",
    number: "02",
    name: "Health & Well-being",
    short: "Community health, prevention and access to essential services.",
    focus: ["Health awareness", "Primary care access", "Facility conditions"],
    tone: "health",
  },
  {
    id: "digital-systems",
    number: "03",
    name: "Digital Systems & Technology",
    short: "Digital inclusion, institutional systems and responsible innovation.",
    focus: ["Digital inclusion", "Institutional systems", "Technology capacity"],
    tone: "digital",
  },
  {
    id: "civic-affairs",
    number: "04",
    name: "Civic Affairs",
    short: "Civic participation, community concerns and accountability.",
    focus: ["Civic participation", "Community engagement", "Accountability"],
    tone: "civic",
  },
] as const;

function DepartmentGlyph({ tone }: { tone: string }) {
  if (tone === "education") return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="h-16 w-16">
      <path d="M10 19c12-5 22-3 30 4v40c-8-7-18-9-30-4V19Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M70 19c-12-5-22-3-30 4v40c8-7 18-9 30-4V19Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M20 29c6-1 11 0 15 3M20 38c6-1 11 0 15 3M60 29c-6-1-11 0-15 3M60 38c-6-1-11 0-15 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (tone === "health") return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="h-16 w-16">
      <path d="M40 12v56M12 40h56" stroke="currentColor" strokeWidth="1.5" opacity=".25" />
      <path d="M9 42h17l7-16 11 30 8-17h19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="40" r="31" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
  if (tone === "digital") return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="h-16 w-16">
      <path d="M40 15 17 28v25l23 13 23-13V28L40 15Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m17 28 23 13 23-13M40 41v25" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="40" cy="15" r="4" fill="currentColor" /><circle cx="17" cy="28" r="4" fill="currentColor" /><circle cx="63" cy="28" r="4" fill="currentColor" /><circle cx="40" cy="41" r="4" fill="currentColor" /><circle cx="17" cy="53" r="4" fill="currentColor" /><circle cx="63" cy="53" r="4" fill="currentColor" /><circle cx="40" cy="66" r="4" fill="currentColor" />
    </svg>
  );
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="h-16 w-16">
      <circle cx="40" cy="40" r="29" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="40" cy="40" r="17" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="40" cy="11" r="4" fill="currentColor" /><circle cx="69" cy="40" r="4" fill="currentColor" /><circle cx="40" cy="69" r="4" fill="currentColor" /><circle cx="11" cy="40" r="4" fill="currentColor" />
      <path d="M40 23v34M23 40h34" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
    </svg>
  );
}

export default async function CommandBriefPage() {
  if (!(await requireStaffSession())) redirect("/login");

  const flags = configFlags();
  let meetings: Awaited<ReturnType<typeof listMeetings>>["meetings"] = [];
  let listError: string | null = null;
  if (flags.token && flags.meetings) {
    try {
      const firstPage = await listMeetings({ pageSize: 25 });
      meetings = filterLegacyVisibleMeetings(firstPage.meetings);
    } catch {
      listError = "The meeting queue could not be reached. No count is shown.";
    }
  }
  const awaiting = meetings.filter((meeting) => ["New", "Draft", "In review"].includes(meeting.status));
  const queueConnected = Boolean(flags.token && flags.meetings && !listError);

  return (
    <main className="mx-auto max-w-7xl space-y-8 pb-8">
      <section className="relative isolate overflow-hidden rounded-[22px] bg-[#10392e] text-white shadow-[0_18px_48px_rgba(12,43,34,.14)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-12 h-56 w-56 rounded-full border border-[#c7a66a]/35" />
        <div className="relative grid gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#c7a66a]" />
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#ddc99f]">ISEYC · Institutional operations</p>
            </div>
            <h1 className="mt-5 max-w-2xl font-serif text-4xl leading-[1.04] tracking-[-.035em] sm:text-5xl">Four departments.<br /><span className="text-[#d9c59b]">One institution.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-base">The work of ISEYC is organised through four departments, supported by shared coordination and human review.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#departments" className="inline-flex min-h-11 items-center rounded-full bg-[#e8d8b4] px-5 text-sm font-bold text-[#173c30] transition hover:bg-white">Explore departments <span aria-hidden="true" className="ml-2">↗</span></Link>
              <Link href="/ops/readiness" className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">System readiness</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="grid grid-cols-2 gap-3">
              {departments.map((department) => (
                <Link key={department.id} href={`/ops/departments/${department.id}`} className="group flex min-h-[132px] flex-col justify-between rounded-2xl border border-white/15 bg-white/[.07] p-4 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[.12]">
                  <span className="text-[10px] font-semibold tracking-[.18em] text-[#d9c59b]">{department.number} / DEPARTMENT</span>
                  <span className="flex items-end justify-between gap-2">
                    <span className="max-w-[130px] text-sm font-semibold leading-5 text-white">{department.name.split(" & ")[0]}</span>
                    <span className="text-xl text-[#d9c59b]" aria-hidden="true">↗</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.2em] text-white/45"><span className="h-px w-8 bg-white/20" />Shared institutional coordination<span className="h-px w-8 bg-white/20" /></div>
          </div>
        </div>
        <div className="relative grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/10">
          <div className="px-5 py-4 sm:px-8"><p className="text-[10px] uppercase tracking-[.16em] text-white/50">Department structure</p><p className="mt-1 text-sm font-semibold">4 workspaces</p></div>
          <div className="px-5 py-4 sm:px-8"><p className="text-[10px] uppercase tracking-[.16em] text-white/50">Review model</p><p className="mt-1 text-sm font-semibold">Human-led</p></div>
          <div className="px-5 py-4 sm:px-8"><p className="text-[10px] uppercase tracking-[.16em] text-white/50">Current access</p><p className="mt-1 text-sm font-semibold">Coordination only</p></div>
        </div>
      </section>

      <section id="departments" className="scroll-mt-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">The institutional structure</p><h2 className="mt-1 font-serif text-2xl text-[#173c30] sm:text-3xl">Department workspaces</h2></div>
          <p className="max-w-sm text-xs leading-5 text-[#68736b]">Select a department to enter its dedicated operating desk.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {departments.map((department) => (
            <Link key={department.id} href={`/ops/departments/${department.id}`} className={`group relative isolate flex min-h-[248px] flex-col overflow-hidden rounded-2xl border border-[#e1e5dc] bg-white p-5 shadow-[0_4px_18px_rgba(20,49,38,.045)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(20,49,38,.09)] sm:p-6 dept-workspace-card dept-workspace-card--${department.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold tracking-[.16em] text-[#7b6a4b]">{department.number}</span>
                <span className="dept-workspace-glyph"><DepartmentGlyph tone={department.tone} /></span>
              </div>
              <div className="mt-auto">
                <h3 className="max-w-sm font-serif text-2xl leading-tight text-[#173c30]">{department.name}</h3>
                <p className="mt-2 max-w-md text-sm leading-5 text-[#68736b]">{department.short}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {department.focus.map((item) => <span key={item} className="rounded-full border border-[#e5e8e1] bg-[#fafaf7] px-2.5 py-1 text-[10px] font-medium text-[#59665d]">{item}</span>)}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[#edf0ea] pt-3 text-xs font-bold text-[#194b3b]"><span>Enter department workspace</span><span className="text-base transition group-hover:translate-x-1" aria-hidden="true">→</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e1e5dc] bg-[#f4f3ed] p-5 sm:p-7">
        <div className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">How work moves</p><h2 className="mt-1 font-serif text-2xl text-[#173c30]">From departmental work to institutional review</h2></div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            ["01", "Department", "Programmes and priorities"],
            ["02", "Work planning", "Deliverables and follow-up"],
            ["03", "Shared registers", "Meetings, actions and coordination"],
            ["04", "Human review", "Review before formal decisions"],
          ].map(([number, title, detail], index) => (
            <div key={number} className="relative rounded-xl border border-[#e0e4db] bg-white p-4">
              <span className="text-[10px] font-bold tracking-[.15em] text-[#a7833f]">{number}</span>
              <h3 className="mt-3 text-sm font-bold text-[#173c30]">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-[#68736b]">{detail}</p>
              {index < 3 ? <span className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe4dc] bg-[#f4f3ed] text-xs text-[#8a6b34] md:flex" aria-hidden="true">›</span> : null}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#68736b]">A record being drafted or planned does not mean that work has been approved, delivered or verified.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-[#dce4dc] bg-white p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">Shared institutional function</p>
          <h2 className="mt-1 font-serif text-xl text-[#173c30]">Coordination across departments</h2>
          <p className="mt-2 max-w-xl text-sm leading-5 text-[#68736b]">Common registers support meetings, actions, communications and external engagement. They do not replace departmental ownership.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/ops/actions" className="inline-flex min-h-10 items-center rounded-full border border-[#dce4dc] px-4 text-xs font-semibold text-[#194b3b] hover:bg-[#f3f6f2]">Actions</Link>
            <Link href="/ops/intake" className="inline-flex min-h-10 items-center rounded-full border border-[#dce4dc] px-4 text-xs font-semibold text-[#194b3b] hover:bg-[#f3f6f2]">Meeting intake</Link>
            <Link href="/ops/media" className="inline-flex min-h-10 items-center rounded-full border border-[#dce4dc] px-4 text-xs font-semibold text-[#194b3b] hover:bg-[#f3f6f2]">Communications</Link>
            <Link href="/ops/partners" className="inline-flex min-h-10 items-center rounded-full border border-[#dce4dc] px-4 text-xs font-semibold text-[#194b3b] hover:bg-[#f3f6f2]">External engagement</Link>
            <Link href="/ops/chamber" className="inline-flex min-h-10 items-center rounded-full border border-[#dce4dc] px-4 text-xs font-semibold text-[#194b3b] hover:bg-[#f3f6f2]">Digital Chamber</Link>
          </div>
        </div>
        <div className="rounded-2xl bg-[#173f32] p-5 text-white sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d9c59b]">Review queue</p>
          <p className="mt-3 font-serif text-4xl tabular-nums">{queueConnected ? awaiting.length : "—"}</p>
          <p className="mt-1 text-xs text-white/65">{queueConnected ? "Awaiting review in the first 25 loaded records" : "Meeting register not connected"}</p>
          {listError ? <p role="alert" className="mt-2 text-xs text-amber-200">{listError}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/ops/queue" className="inline-flex min-h-10 items-center rounded-full bg-[#e8d8b4] px-4 text-xs font-bold text-[#173c30]">Open review queue ↗</Link>
            <Link href="/ops/readiness" className="inline-flex min-h-10 items-center rounded-full border border-white/25 px-4 text-xs font-semibold text-white">Readiness</Link>
          </div>
          <p className="mt-4 text-[10px] leading-4 text-white/50">Live count is shown only when the connected register responds. No estimated activity is displayed.</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e1e5dc] bg-white p-4">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Shared function · not a fifth department</p>
          <h2 className="mt-1 text-sm font-bold text-[#173c30]">Communications coordination</h2>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#68736b]">Editorial drafts only · publication remains disabled.</p>
            <span className="shrink-0 rounded-full border border-[#e7d9b8] bg-[#fbf8ef] px-2 py-1 text-[9px] font-bold text-[#6e5425]">Not operational</span>
          </div>
          <Link href="/ops/media" className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Open communications →</Link>
        </div>
        <div className="rounded-xl border border-[#e1e5dc] bg-white p-4">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Governance records</p>
          <h2 className="mt-1 text-sm font-bold text-[#173c30]">Presidential Council</h2>
          <p className="mt-2 text-[11px] text-[#68736b]">Seat occupancy not connected. Role and appointment records require approved governance data.</p>
          <Link href="/ops/readiness" className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">View readiness →</Link>
        </div>
      </section>

      <details className="rounded-xl border border-[#e1e5dc] bg-white px-4 py-3">
        <summary className="min-h-9 cursor-pointer list-none text-xs font-bold text-[#315b45]">Environment configuration <span className="ml-1 text-[#a7833f]">＋</span></summary>
        <ul className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["Staff key", flags.staffKey],
            ["Notion token", flags.token],
            ["Meetings database", flags.meetings],
            ["Media database", flags.media],
            ["Chamber database", flags.chamber],
            ["Actions database", flags.actions],
          ] as const).map(([label, configured]) => (
            <li key={label} className="flex items-center justify-between gap-3 rounded-lg bg-[#f6f7f3] px-3 py-2">
              <span className="text-[#68736b]">{label}</span>
              <span className={configured ? "font-bold text-[#28664a]" : "font-medium text-[#8a6b34]"}>{configured ? "Configured" : "Not connected"}</span>
            </li>
          ))}
        </ul>
      </details>

      <section className="rounded-xl border border-[#dce4dc] bg-[#edf2ec] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Published civic systems</p><p className="mt-1 text-xs text-[#68736b]">Separate public platforms connected to ISEYC’s civic work.</p></div>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          <a href="https://2027-street-mandate.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center rounded-full border border-[#cdd8ce] bg-white px-3 text-[11px] font-bold text-[#194b3b]">Civic Mandate ↗</a>
          <a href="https://iseyc-civic-brain.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center rounded-full border border-[#cdd8ce] bg-white px-3 text-[11px] font-bold text-[#194b3b]">Civic Brain ↗</a>
        </div>
      </section>
    </main>
  );
}
