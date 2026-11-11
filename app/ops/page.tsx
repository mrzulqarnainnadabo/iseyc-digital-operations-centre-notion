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
    name: "Education",
    fullName: "Education & Capacity Building",
    summary: "Learning access, skills and stronger learning environments.",
    focus: ["Learning access", "Skills", "Partnerships"],
    tone: "education",
  },
  {
    id: "health",
    number: "02",
    name: "Health",
    fullName: "Health & Well-being",
    summary: "Community health, prevention and essential services.",
    focus: ["Health awareness", "Primary care", "Facility conditions"],
    tone: "health",
  },
  {
    id: "digital-systems",
    number: "03",
    name: "Digital Systems",
    fullName: "Digital Systems & Technology",
    summary: "Digital inclusion, institutional systems and responsible innovation.",
    focus: ["Digital inclusion", "Institutional systems", "Technology skills"],
    tone: "digital",
  },
  {
    id: "civic-affairs",
    number: "04",
    name: "Civic Affairs",
    fullName: "Civic Affairs & Public Accountability",
    summary: "Civic learning, community concerns and public accountability.",
    focus: ["Civic learning", "Community engagement", "Accountability"],
    tone: "civic",
  },
] as const;

const coordinationLinks = [
  { label: "Actions", detail: "Tasks and follow-up", href: "/ops/actions" },
  { label: "Meetings", detail: "Intake and records", href: "/ops/intake" },
  { label: "Communications", detail: "Editorial drafts", href: "/ops/media" },
  { label: "External engagement", detail: "Partners and contacts", href: "/ops/partners" },
  { label: "Digital Chamber", detail: "Shared institutional space", href: "/ops/chamber" },
];

const publicSystems = [
  { name: "Civic Mandate", href: "https://2027-street-mandate.vercel.app", detail: "Published community records" },
  { name: "Civic Brain", href: "https://iseyc-civic-brain.vercel.app", detail: "Evidence explanation" },
  { name: "Intelligence Observatory", href: "https://iseyc-civic-intelligence-observatory.vercel.app", detail: "Public evidence and context" },
];

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
      listError = "The meeting register could not be reached. No count is shown.";
    }
  }

  const pendingMeetings = meetings.filter((meeting) =>
    ["New", "Draft", "In review"].includes(meeting.status),
  );
  const meetingsConnected = Boolean(flags.token && flags.meetings && !listError);

  return (
    <main className="mx-auto max-w-7xl space-y-7 pb-10">
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#123b2f] text-white shadow-[0_18px_48px_rgba(12,43,34,.12)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-[28rem] w-[28rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-16 h-[20rem] w-[20rem] rounded-full border border-[#d9c59b]/25" />
        <div className="relative grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d9c59b]">ISEYC · Operations</p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.04] tracking-[-.035em] sm:text-5xl">
              Four departments.<br /><span className="text-[#d9c59b]">One institution.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/75">
              Choose a department to open its workspace. Shared coordination supports the work; people remain responsible for review and decisions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#departments" className="inline-flex min-h-11 items-center rounded-full bg-[#e8d8b4] px-5 text-sm font-bold text-[#173c30] transition hover:bg-white">
                Open departments <span aria-hidden="true" className="ml-2">↓</span>
              </Link>
              <Link href="/ops/readiness" className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                System readiness <span aria-hidden="true" className="ml-2">↗</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {departments.map((department) => (
              <Link
                key={department.id}
                href={`/ops/departments/${department.id}`}
                className="group flex min-h-28 flex-col justify-between rounded-2xl border border-white/15 bg-white/[.07] p-4 transition hover:-translate-y-0.5 hover:bg-white/[.13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8d8b4]"
              >
                <span className="text-[10px] font-semibold tracking-[.16em] text-[#d9c59b]">{department.number} / DEPARTMENT</span>
                <span className="flex items-end justify-between gap-2">
                  <span className="text-sm font-semibold leading-5 text-white">{department.name}</span>
                  <span className="text-lg text-[#d9c59b] transition group-hover:translate-x-1" aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="relative grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/10">
          <div className="px-4 py-3 sm:px-8"><p className="text-[9px] uppercase tracking-[.14em] text-white/50">Departments</p><p className="mt-1 text-sm font-semibold">04 workspaces</p></div>
          <div className="px-4 py-3 sm:px-8"><p className="text-[9px] uppercase tracking-[.14em] text-white/50">Review</p><p className="mt-1 text-sm font-semibold">Human-led</p></div>
          <div className="px-4 py-3 sm:px-8"><p className="text-[9px] uppercase tracking-[.14em] text-white/50">Access</p><p className="mt-1 text-sm font-semibold">Coordination</p></div>
        </div>
      </section>

      <section id="departments" className="scroll-mt-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Department workspaces</p>
            <h2 className="mt-1 font-serif text-2xl text-[#173c30] sm:text-3xl">Where the work happens</h2>
          </div>
          <p className="max-w-xs text-xs leading-5 text-[#68736b]">Each department owns its priorities and work records.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {departments.map((department) => (
            <Link
              key={department.id}
              href={`/ops/departments/${department.id}`}
              className={`group relative isolate flex min-h-[205px] flex-col overflow-hidden rounded-2xl border border-[#e1e5dc] border-l-4 bg-white p-5 shadow-[0_3px_14px_rgba(20,49,38,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(20,49,38,.08)] dept-workspace-card dept-workspace-card--${department.tone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold tracking-[.16em] text-[#8a6b34]">{department.number}</span>
                <span className="text-xs font-semibold text-[#194b3b] transition group-hover:translate-x-1">Open workspace ↗</span>
              </div>
              <div className="mt-auto">
                <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#8a6b34]">{department.fullName}</p>
                <h3 className="mt-1 font-serif text-2xl leading-tight text-[#173c30]">{department.name}</h3>
                <p className="mt-2 max-w-md text-sm leading-5 text-[#68736b]">{department.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {department.focus.map((item) => (
                    <span key={item} className="rounded-full border border-[#e5e8e1] bg-[#fafaf7] px-2.5 py-1 text-[10px] font-medium text-[#59665d]">{item}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-[#e1e5dc] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Shared coordination</p>
              <h2 className="mt-1 font-serif text-xl text-[#173c30] sm:text-2xl">One place to coordinate</h2>
              <p className="mt-2 max-w-lg text-xs leading-5 text-[#68736b]">Shared registers support departments. They do not replace departmental ownership.</p>
            </div>
            <span className="hidden rounded-full border border-[#e1e5dc] px-3 py-1 text-[10px] font-semibold text-[#68736b] sm:inline-flex">Institution-wide</span>
          </div>
          <div className="mt-5 divide-y divide-[#edf0ea] border-y border-[#edf0ea]">
            {coordinationLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group flex min-h-14 items-center justify-between gap-3 py-2.5">
                <span><span className="block text-sm font-semibold text-[#173c30]">{item.label}</span><span className="mt-0.5 block text-[11px] text-[#68736b]">{item.detail}</span></span>
                <span className="text-[#8a6b34] transition group-hover:translate-x-1" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#173f32] p-5 text-white sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#d9c59b]">Meeting review</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="font-serif text-5xl tabular-nums">{meetingsConnected ? pendingMeetings.length : "—"}</p>
            <span className={meetingsConnected ? "mb-1 rounded-full border border-white/20 px-2.5 py-1 text-[9px] font-semibold text-[#d9c59b]" : "mb-1 rounded-full border border-[#d9c59b]/35 px-2.5 py-1 text-[9px] font-semibold text-[#e8d8b4]"}>
              {meetingsConnected ? "Register connected" : "Not connected"}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/70">{meetingsConnected ? "Pending in the first 25 loaded records" : "No live count available"}</p>
          {listError ? <p role="alert" className="mt-2 text-xs text-amber-200">{listError}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/ops/queue" className="inline-flex min-h-10 items-center rounded-full bg-[#e8d8b4] px-4 text-xs font-bold text-[#173c30]">Open review queue ↗</Link>
            <Link href="/ops/readiness" className="inline-flex min-h-10 items-center rounded-full border border-white/25 px-4 text-xs font-semibold text-white">View readiness</Link>
          </div>
          <p className="mt-4 text-[10px] leading-4 text-white/50">Counts appear only when the connected register responds. No estimates are used.</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#e1e5dc] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Governance</p>
          <h2 className="mt-1 font-serif text-xl text-[#173c30]">Presidential Council</h2>
          <p className="mt-2 text-xs leading-5 text-[#68736b]">Role guides are available. No named, approved appointments are linked to system access.</p>
          <Link href="/ops/council" className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">View role framework →</Link>
        </div>
        <div className="rounded-2xl border border-[#e1e5dc] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Communications</p>
          <h2 className="mt-1 font-serif text-xl text-[#173c30]">Drafts only</h2>
          <p className="mt-2 text-xs leading-5 text-[#68736b]">Editorial work can be prepared. Publication is not enabled.</p>
          <Link href="/ops/media" className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Open communications →</Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e1e5dc] bg-[#f3f5f0] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Public evidence systems</p>
            <h2 className="mt-1 font-serif text-xl text-[#173c30] sm:text-2xl">Connected public platforms</h2>
          </div>
          <p className="max-w-xs text-[11px] leading-5 text-[#68736b]">Separate systems. Their records are not copied into this workspace.</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {publicSystems.map((system) => (
            <a key={system.name} href={system.href} target="_blank" rel="noopener noreferrer" className="group flex min-h-16 items-center justify-between gap-3 rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 transition hover:border-[#aebdad] hover:bg-[#fbfcfa]">
              <span><span className="block text-sm font-semibold text-[#173c30]">{system.name}</span><span className="mt-0.5 block text-[10px] text-[#68736b]">{system.detail}</span></span>
              <span className="text-[#8a6b34] transition group-hover:translate-x-0.5" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e5dc] pt-4">
        <p className="max-w-2xl text-[10px] leading-5 text-[#68736b]">Drafted or planned work is not automatically approved, delivered or verified. Formal decisions remain with authorised people.</p>
        <Link href="/ops/readiness" className="inline-flex min-h-10 items-center text-xs font-bold text-[#194b3b]">Full system readiness ↗</Link>
      </div>
    </main>
  );
}
