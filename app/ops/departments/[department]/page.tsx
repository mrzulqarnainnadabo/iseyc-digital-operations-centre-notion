import Link from "next/link";
import { notFound } from "next/navigation";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";
import { getDepartment } from "@/lib/departments";
import {
  getDepartmentOperatingProfile,
  isOpsDepartmentId,
  type OpsDepartmentId,
} from "@/lib/department-operations";
import DepartmentProgrammePanel from "@/components/DepartmentProgrammePanel";
import DepartmentWorkPlanPanel from "@/components/DepartmentWorkPlanPanel";
import DepartmentReportPanel from "@/components/DepartmentReportPanel";

export const dynamic = "force-dynamic";

const ALL_DEPARTMENTS: { id: OpsDepartmentId; name: string }[] = [
  { id: "education", name: "Education & Capacity Building" },
  { id: "health", name: "Health & Well-being" },
  { id: "digital-systems", name: "Digital Systems & Technology" },
  { id: "civic-affairs", name: "Civic Affairs" },
];

const DEPARTMENT_STYLE: Record<OpsDepartmentId, { number: string; short: string; focus: string; accent: string; label: string }> = {
  education: { number: "01", short: "Learning · Skills · Opportunity", focus: "Access and capability", accent: "education", label: "Learning pathways" },
  health: { number: "02", short: "Prevention · Access · Well-being", focus: "Community health", accent: "health", label: "Health and care" },
  "digital-systems": { number: "03", short: "Inclusion · Infrastructure · Innovation", focus: "Digital capacity", accent: "digital", label: "Connected systems" },
  "civic-affairs": { number: "04", short: "Participation · Engagement · Accountability", focus: "Civic responsibility", accent: "civic", label: "Public participation" },
};

export default async function DepartmentDeskPage({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department } = await params;
  if (!isOpsDepartmentId(department)) notFound();

  const profile = getDepartmentOperatingProfile(department);
  if (!profile) notFound();

  const publicDef = getDepartment(profile.publicSlug);
  const style = DEPARTMENT_STYLE[department];
  const flags = configFlags();

  let meetings: Awaited<ReturnType<typeof listMeetings>>["meetings"] = [];
  let sourceMessage = "The Meetings register is not configured.";
  if (flags.token && flags.meetings) {
    try {
      const result = await listMeetings({ pageSize: 50 });
      const visible = filterLegacyVisibleMeetings(result.meetings);
      meetings = visible.filter((meeting) => {
        const haystack = `${meeting.conveningBody} ${meeting.title}`.toLowerCase();
        return profile.meetingTerms.some((term) => haystack.includes(term));
      });
      sourceMessage = "Filtered from the connected Meetings register · Standard-sensitivity records.";
    } catch {
      sourceMessage = "The Meetings register could not be reached. No cached records are displayed.";
    }
  }

  const recent = [...meetings].sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)).slice(0, 5);

  return (
    <main className={`mx-auto max-w-7xl space-y-6 pb-8 ops-department ops-department--${style.accent}`}>
      <header className="ops-department-hero relative isolate overflow-hidden rounded-[22px] bg-[#10392e] text-white shadow-[0_18px_48px_rgba(12,43,34,.12)]">
        <div aria-hidden="true" className="ops-department-orbit" />
        <div className="relative grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1fr_260px] lg:items-center">
          <div>
            <Link href="/ops#departments" className="inline-flex min-h-9 items-center text-xs font-semibold text-white/65 hover:text-white">← All departments</Link>
            <div className="mt-5 flex items-center gap-3">
              <span className="h-px w-8 bg-[#d1b77f]" />
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d9c59b]">ISEYC · Department {style.number}</p>
            </div>
            <h1 className="mt-3 max-w-3xl font-serif text-3xl leading-[1.05] tracking-[-.03em] sm:text-4xl lg:text-5xl">{profile.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{style.short}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/[.06] px-3 py-1.5 text-[11px] font-medium text-white/85">{style.focus}</span>
              <span className="rounded-full border border-[#d9c59b]/35 bg-[#d9c59b]/10 px-3 py-1.5 text-[11px] font-medium text-[#ead9b5]">Coordination workspace</span>
            </div>
          </div>
          <div className="hidden lg:flex lg:justify-center">
            <div className="ops-department-seal" aria-hidden="true">
              <span>{style.number}</span><i /><b /><em />
            </div>
          </div>
        </div>
        <div className="relative grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/10">
          <div className="px-4 py-3 sm:px-7"><p className="text-[9px] uppercase tracking-[.16em] text-white/50">Mandate</p><p className="mt-1 text-xs font-semibold text-white">Defined</p></div>
          <div className="px-4 py-3 sm:px-7"><p className="text-[9px] uppercase tracking-[.16em] text-white/50">Programme register</p><p className="mt-1 text-xs font-semibold text-white">Notion-backed when configured</p></div>
          <div className="px-4 py-3 sm:px-7"><p className="text-[9px] uppercase tracking-[.16em] text-white/50">Authority</p><p className="mt-1 text-xs font-semibold text-white">Human-led</p></div>
        </div>
      </header>

      <nav aria-label="Department workspace navigation" className="ops-department-nav flex gap-2 overflow-x-auto pb-1">
        {[
          ["#overview", "Overview"],
          ["#functions", "Functions"],
          ["#programmes", "Programmes"],
          ["#work-plans", "Work plans"],
          ["#reports", "Reports"],
          ["#meetings", "Meetings"],
          ["#shared-tools", "Shared tools"],
        ].map(([href, label]) => <a key={href} href={href}>{label}</a>)}
      </nav>

      <section id="overview" className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-[#e1e5dc] bg-white p-5 shadow-[0_4px_18px_rgba(20,49,38,.04)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">Department mandate</p>
            <span className="text-xs font-semibold text-[#a7833f]">{style.number} / 04</span>
          </div>
          <h2 className="mt-2 max-w-2xl font-serif text-2xl leading-tight text-[#173c30]">{style.label}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6c63]">{profile.mandate}</p>
          {publicDef ? <p className="mt-2 text-xs leading-5 text-[#7a837c]">{publicDef.introduction}</p> : null}
        </article>
        <article className="rounded-2xl border border-[#e1e5dc] bg-[#f3f4ee] p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">Strategic priorities</p>
          <ol className="mt-3 space-y-0">
            {profile.strategicPriorities.map((item, index) => (
              <li key={item} className="flex gap-3 border-b border-[#dfe4da] py-2.5 last:border-0">
                <span className="pt-0.5 font-mono text-[10px] text-[#a7833f]">0{index + 1}</span>
                <span className="text-xs font-medium leading-5 text-[#35483d]">{item}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section id="functions" className="scroll-mt-5 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">How this department works</p><h2 className="mt-1 font-serif text-2xl text-[#173c30]">Functional areas</h2></div>
          <span className="text-[11px] text-[#7a837c]">{profile.functions.length} defined functions</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.functions.map((fn, index) => (
            <article key={fn.id} className="rounded-2xl border border-[#e1e5dc] bg-white p-4 shadow-[0_4px_18px_rgba(20,49,38,.035)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf2ec] font-mono text-[10px] font-bold text-[#315b45]">0{index + 1}</span>
                <span className="h-px flex-1 bg-[#e8ebe5] mt-4" />
                <span className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#9a7a42]">Function</span>
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#173c30]">{fn.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#66736a]">{fn.responsibility}</p>
              <details className="mt-3 border-t border-[#edf0ea] pt-3">
                <summary className="min-h-9 cursor-pointer list-none text-xs font-bold text-[#194b3b] marker:hidden">View activities and expected outputs <span aria-hidden="true" className="ml-1">＋</span></summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">Activities</p><ul className="mt-2 space-y-1.5">{fn.activities.map((item) => <li key={item} className="text-[11px] leading-4 text-[#66736a]">• {item}</li>)}</ul></div>
                  <div><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">Outputs</p><ul className="mt-2 space-y-1.5">{fn.outputs.map((item) => <li key={item} className="text-[11px] leading-4 text-[#66736a]">• {item}</li>)}</ul></div>
                </div>
                <p className="mt-3 text-[10px] leading-4 text-[#7a837c]">Coordinates with: {fn.coordinatesWith.join(" · ")}</p>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section id="programmes" className="scroll-mt-5 rounded-2xl border border-[#e1e5dc] bg-white p-4 shadow-[0_4px_18px_rgba(20,49,38,.04)] sm:p-6">
        <div className="mb-4 flex items-center gap-3"><span className="h-8 w-1 rounded-full bg-[#a7833f]" /><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">01 · Department delivery</p><h2 className="font-serif text-2xl text-[#173c30]">Programmes</h2></div></div>
        <DepartmentProgrammePanel departmentId={department} departmentName={profile.name} />
      </section>

      <section className="grid scroll-mt-5 gap-4 lg:grid-cols-2">
        <article id="work-plans" className="rounded-2xl border border-[#e1e5dc] bg-white p-4 shadow-[0_4px_18px_rgba(20,49,38,.04)] sm:p-5">
          <p className="mb-3 text-[10px] leading-4 text-[#7a837c]">A department task register is Not connected until its Notion register is configured. No task records are simulated.</p>
          <div className="mb-3 flex items-center gap-3"><span className="h-8 w-1 rounded-full bg-[#315b45]" /><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">02 · Execution</p><h2 className="font-serif text-xl text-[#173c30]">Work plans</h2></div></div>
          <DepartmentWorkPlanPanel departmentId={department} departmentName={profile.name} />
        </article>
        <article id="reports" className="scroll-mt-5 rounded-2xl border border-[#e1e5dc] bg-white p-4 shadow-[0_4px_18px_rgba(20,49,38,.04)] sm:p-5">
          <div className="mb-3 flex items-center gap-3"><span className="h-8 w-1 rounded-full bg-[#a7833f]" /><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">03 · Documentation</p><h2 className="font-serif text-xl text-[#173c30]">Department reports</h2></div></div>
          <DepartmentReportPanel departmentId={department} departmentName={profile.name} />
        </article>
      </section>

      <section id="meetings" className="scroll-mt-5 rounded-2xl border border-[#e1e5dc] bg-[#f3f4ee] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">04 · Coordination</p><h2 className="mt-1 font-serif text-2xl text-[#173c30]">Department meetings</h2></div>
          <Link href="/ops/intake" className="inline-flex min-h-10 items-center rounded-full bg-[#173f32] px-4 text-xs font-bold text-white hover:bg-[#245540]">Meeting intake ↗</Link>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#7a837c]">{sourceMessage}</p>
        {recent.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{recent.map((meeting) => (
          <li key={meeting.id} className="rounded-xl border border-[#e0e4db] bg-white p-3">
            <p className="text-sm font-semibold text-[#173c30]">{meeting.title}</p>
            <p className="mt-1 text-[10px] text-[#7a837c]">{meeting.meetingDate || "Date not supplied"} · {meeting.conveningBody}</p>
            <Link href={`/ops/review/${encodeURIComponent(meeting.id)}`} className="mt-2 inline-flex min-h-8 items-center text-[11px] font-bold text-[#194b3b]">Open meeting record →</Link>
          </li>
        ))}</ul> : <p className="mt-4 rounded-xl border border-dashed border-[#d7ddd4] bg-white/70 p-4 text-xs leading-5 text-[#6c786f]">No matching department meetings were found on the loaded page. This does not establish that no department activity exists.</p>}
      </section>

      <section id="tools" className="scroll-mt-5 rounded-2xl border border-[#dce4dc] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">Institution-wide support</p><h2 className="mt-1 font-serif text-2xl text-[#173c30]">Shared registers</h2></div><span className="text-[10px] text-[#7a837c]">Common tools · not additional departments</span></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["/ops/actions", "Actions", "Follow-up and deliverables"],
            ["/ops/queue", "Review queue", "Human review workflow"],
            ["/ops/media", "Communications", "Editorial coordination"],
            ["/ops/chamber", "Digital Chamber", "Institutional sessions"],
            ["/ops/partners", "External engagement", "Organisations and invitations"],
            ["/ops/intake", "Meeting intake", "Meeting requests"],
          ].map(([href, title, detail]) => <Link key={href} href={href} className="group flex min-h-[76px] items-center justify-between gap-3 rounded-xl border border-[#e5e9e2] bg-[#fafbf8] px-4 py-3 transition hover:border-[#9eaf9f] hover:bg-[#f3f6f1]"><span><span className="block text-xs font-bold text-[#234b37]">{title}</span><span className="mt-1 block text-[10px] text-[#7a837c]">{detail}</span></span><span className="text-lg text-[#a7833f] transition group-hover:translate-x-1" aria-hidden="true">→</span></Link>)}
        </div>
      </section>

      <details className="rounded-xl border border-[#e7d9b8] bg-[#fbf8ef] p-4">
        <summary className="min-h-9 cursor-pointer list-none text-xs font-bold text-[#6e5425]">Governance and authority limits <span aria-hidden="true" className="ml-1">＋</span></summary>
        <p className="mt-2 max-w-4xl text-xs leading-5 text-[#6f654e]">This workspace supports coordination and record-keeping. Reports and ownership are not inferred from login identity. A staff login does not prove individual identity, appointment or decision authority. Formal approval, publication, official dispatch, decision authorisation and action closure remain disabled until verified appointments and scoped permissions are in place. {profile.boundaries.join(" ")}</p>
      </details>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e5dc] pt-4">
        <p className="text-[10px] text-[#7a837c]">ISEYC · {profile.name}</p>
        <div className="flex flex-wrap gap-2">{ALL_DEPARTMENTS.filter((item) => item.id !== department).map((item) => <Link key={item.id} href={`/ops/departments/${item.id}`} className="inline-flex min-h-9 items-center rounded-full border border-[#dce4dc] px-3 text-[10px] font-semibold text-[#315b45] hover:bg-white">{item.name} ↗</Link>)}</div>
      </footer>
    </main>
  );
}
