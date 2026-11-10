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
  const flags = configFlags();

  let meetings: Awaited<ReturnType<typeof listMeetings>>["meetings"] = [];
  let sourceMessage =
    "The approved Meetings register is not configured. No meeting records are shown.";
  if (flags.token && flags.meetings) {
    try {
      const result = await listMeetings({ pageSize: 50 });
      const visible = filterLegacyVisibleMeetings(result.meetings);
      meetings = visible.filter((meeting) => {
        const haystack = `${meeting.conveningBody} ${meeting.title}`.toLowerCase();
        return profile.meetingTerms.some((term) => haystack.includes(term));
      });
      sourceMessage =
        "Filtered from the connected internal Meetings register · Standard-sensitivity records only.";
    } catch {
      sourceMessage =
        "The Meetings register could not be reached. No cached or estimated records are displayed.";
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const recent = [...meetings]
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="overflow-hidden rounded-card border border-forest-900 bg-forest-950 p-5 text-white shadow-card sm:p-7">
        <Link href="/ops/readiness" className="inline-flex min-h-[36px] items-center text-sm text-white/75 hover:text-white">
          ← Department overview
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-400">Department operating workspace</p>
            <h1 className="mt-1 font-serif text-2xl leading-tight sm:text-3xl">{profile.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{profile.mandate}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-[32px] items-center rounded-full border border-white/20 px-3 text-xs font-medium text-white/85">Institutional</span>
            <span className="inline-flex min-h-[32px] items-center rounded-full border border-amber-300/40 bg-amber-950/30 px-3 text-xs font-medium text-amber-100">Shared-key limits apply</span>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-5 text-white/65">{profile.missionLink}</p>
      </header>

      <nav aria-label="Department sections" className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold">
        {[
          ["#mandate", "Mandate"],
          ["#functions", "Functions"],
          ["#programmes", "Programmes"],
          ["#work-plans", "Work plans"],
          ["#reports", "Reports"],
          ["#meetings", "Meetings"],
          ["#tools", "Tools"],
          ["#coordination", "Coordination"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-line bg-white px-3 text-forest-900 hover:border-forest-800">{label}</a>
        ))}
      </nav>

      <section className="rounded-card border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-amber-950">Authority boundary</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          This workspace supports coordination and record-keeping. Reports and ownership are not inferred from login identity. A staff login does not prove individual
          identity, appointment or decision authority. Formal approval, publication, official dispatch,
          decision authorisation and action closure remain disabled until verified appointments and
          scoped permissions are in place.
        </p>
      </section>

      <section id="mandate" className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Department identity</p>
          <h2 className="mt-1 font-serif text-xl text-forest-950">Mandate & responsibilities</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">{profile.mandate}</p>
          {publicDef ? <p className="mt-3 text-sm leading-6 text-ink-600">{publicDef.introduction}</p> : null}
          <ul className="mt-4 space-y-2">
            {profile.strategicPriorities.map((item) => (
              <li key={item} className="rounded-control border border-line bg-cream-50 px-3 py-2 text-sm text-ink-800">{item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Functional boundaries</p>
          <h2 className="mt-1 font-serif text-xl text-forest-950">What this department does not do</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-700">
            {profile.boundaries.map((item) => (<li key={item}>{item}</li>))}
          </ul>
        </article>
      </section>

      <section id="functions" className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Operating structure</p>
          <h2 className="font-serif text-xl text-forest-950 sm:text-2xl">Functional areas</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-600">
            Each function defines responsibility, typical activities, expected outputs and how work is
            documented. Functions are institutional structure — not evidence that staff are assigned.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {profile.functions.map((fn) => (
            <article key={fn.id} className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
              <h3 className="font-semibold text-forest-950">{fn.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-700">{fn.responsibility}</p>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Activities</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-700">
                    {fn.activities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Outputs</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-700">
                    {fn.outputs.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-600">
                <span className="font-semibold text-ink-700">Documentation:</span> {fn.documentation}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-600">
                <span className="font-semibold text-ink-700">Coordinates with:</span>{" "}
                {fn.coordinatesWith.join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="programmes" className="rounded-card border border-line bg-cream-50/50 p-4 shadow-card sm:p-5">
        <DepartmentProgrammePanel departmentId={department} departmentName={profile.name} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article id="work-plans" className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
          <p className="mb-3 text-xs leading-5 text-ink-600">
            A department task register is Not connected until the work-plan Notion register is configured; records are not simulated.
          </p>
          <DepartmentWorkPlanPanel departmentId={department} departmentName={profile.name} />
        </article>
        <article id="reports" className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
          <DepartmentReportPanel departmentId={department} departmentName={profile.name} />
        </article>
      </section>

      <section id="meetings" className="rounded-card border border-line bg-white p-5 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Meetings & coordination</p>
        <h2 className="mt-1 font-serif text-xl text-forest-950">Department-linked meetings</h2>
        <p className="mt-1 text-xs text-ink-600">{sourceMessage}</p>
        {recent.length ? (
          <ul className="mt-3 divide-y divide-line">
            {recent.map((meeting) => (
              <li key={meeting.id} className="py-3">
                <p className="font-semibold text-forest-950">{meeting.title}</p>
                <p className="text-xs text-ink-600">{meeting.meetingDate || "Date not supplied"} · {meeting.conveningBody}</p>
                <Link href={`/ops/review/${encodeURIComponent(meeting.id)}`} className="mt-1 inline-flex min-h-[36px] items-center text-sm font-semibold text-forest-800 hover:underline">Open meeting record →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-control bg-cream-50 p-4 text-sm text-ink-600">No matching department meetings were found in the loaded records. This is not evidence that no department activity exists.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/ops/intake" className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">Schedule a department meeting</Link>
          <Link href="/ops/actions" className="inline-flex min-h-[44px] items-center rounded-control border border-line px-4 text-sm font-semibold text-forest-950">Open Actions register</Link>
        </div>
      </section>

      <section id="tools" className="rounded-card border border-line bg-white p-5 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
          Shared institutional registers
        </p>
        <h2 className="mt-1 font-serif text-xl text-forest-950">Operational tools</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">
          Department programmes, work plans and reports use dedicated APIs when configured. Day-to-day
          coordination continues through the shared registers below. Authority limits on those registers
          still apply.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["/ops/actions", "Actions register"],
            ["/ops/intake", "Meeting intake"],
            ["/ops/queue", "Meeting queue"],
            ["/ops/media", "Communications"],
            ["/ops/chamber", "Digital Chamber"],
            ["/ops/partners", "External engagement"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-flex min-h-[44px] w-full items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800 hover:border-forest-800"
              >
                {label} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="coordination" className="rounded-card border border-line bg-white p-5 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">Institutional network</p>
        <h2 className="mt-1 font-serif text-xl text-forest-950">Interdepartmental coordination</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {ALL_DEPARTMENTS.filter((d) => d.id !== department).map((d) => (
            <li key={d.id}>
              <Link href={`/ops/departments/${d.id}`} className="inline-flex min-h-[44px] w-full items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800 hover:border-forest-800">{d.name} →</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
