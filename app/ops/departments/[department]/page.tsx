import Link from "next/link";
import { notFound } from "next/navigation";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";
import { getDepartment } from "@/lib/departments";
import {
  getDepartmentOperatingProfile,
  isOpsDepartmentId,
  type OpsDepartmentId,
  type DepartmentEvidenceOption,
} from "@/lib/department-operations";
import DepartmentProgrammePanel from "@/components/DepartmentProgrammePanel";
import DepartmentWorkPlanPanel from "@/components/DepartmentWorkPlanPanel";
import DepartmentReportPanel from "@/components/DepartmentReportPanel";
import { getDepartmentEvidence } from "@/lib/public-evidence";
import { getDepartmentSnapshots } from "@/lib/department-snapshots";
import { DEPARTMENT_EVIDENCE_BRIEFS } from "@/lib/department-evidence-briefs";

export const dynamic = "force-dynamic";

const ALL_DEPARTMENTS: { id: OpsDepartmentId; name: string }[] = [
  { id: "education", name: "Education & Capacity Building" },
  { id: "health", name: "Health & Well-being" },
  { id: "digital-systems", name: "Digital Systems & Technology" },
  { id: "civic-affairs", name: "Civic Affairs & Public Accountability" },
];

const DEPARTMENT_STYLE: Record<OpsDepartmentId, { number: string; short: string; focus: string; accent: string; label: string }> = {
  education: { number: "01", short: "Learning · Skills · Opportunity", focus: "Access and capability", accent: "education", label: "Learning pathways" },
  health: { number: "02", short: "Prevention · Access · Well-being", focus: "Community health", accent: "health", label: "Health and care" },
  "digital-systems": { number: "03", short: "Inclusion · Infrastructure · Innovation", focus: "Digital capacity", accent: "digital", label: "Connected systems" },
  "civic-affairs": { number: "04", short: "Participation · Engagement · Accountability", focus: "Civic responsibility", accent: "civic", label: "Public participation" },
};

function DepartmentMark({ department }: { department: OpsDepartmentId }) {
  const common = "h-40 w-40 text-[#e4d3aa]";
  if (department === "education") return (
    <div className="ops-department-mark ops-department-mark--education" aria-hidden="true">
      <svg viewBox="0 0 160 160" className={common} fill="none">
        <circle cx="80" cy="80" r="69" stroke="currentColor" strokeOpacity=".35" />
        <circle cx="80" cy="80" r="55" stroke="currentColor" strokeOpacity=".18" />
        <path d="M30 53c19-8 36-4 50 7v57c-14-11-31-15-50-7V53Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="M130 53c-19-8-36-4-50 7v57c14-11 31-15 50-7V53Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="M43 68c10-2 20 0 28 5M43 81c10-2 20 0 28 5M117 68c-10-2-20 0-28 5M117 81c-10-2-20 0-28 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>LEARNING</span>
    </div>
  );
  if (department === "health") return (
    <div className="ops-department-mark ops-department-mark--health" aria-hidden="true">
      <svg viewBox="0 0 160 160" className={common} fill="none">
        <circle cx="80" cy="80" r="69" stroke="currentColor" strokeOpacity=".35" />
        <circle cx="80" cy="80" r="53" stroke="currentColor" strokeOpacity=".18" />
        <path d="M19 83h31l13-29 21 58 16-38 10 9h31" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80 24v112M24 80h112" stroke="currentColor" strokeOpacity=".16" />
      </svg>
      <span>WELL-BEING</span>
    </div>
  );
  if (department === "digital-systems") return (
    <div className="ops-department-mark ops-department-mark--digital" aria-hidden="true">
      <svg viewBox="0 0 160 160" className={common} fill="none">
        <circle cx="80" cy="80" r="69" stroke="currentColor" strokeOpacity=".35" />
        <path d="M80 30 35 55v50l45 25 45-25V55L80 30Z" stroke="currentColor" strokeWidth="2" />
        <path d="m35 55 45 25 45-25M80 80v50" stroke="currentColor" strokeWidth="2" />
        {[ [80,30],[35,55],[125,55],[80,80],[35,105],[125,105],[80,130] ].map(([x,y]) => <circle key={x+":"+y} cx={x} cy={y} r="4" fill="currentColor" />)}
      </svg>
      <span>CONNECTED SYSTEMS</span>
    </div>
  );
  return (
    <div className="ops-department-mark ops-department-mark--civic" aria-hidden="true">
      <svg viewBox="0 0 160 160" className={common} fill="none">
        <circle cx="80" cy="80" r="69" stroke="currentColor" strokeOpacity=".35" />
        <circle cx="80" cy="80" r="48" stroke="currentColor" strokeWidth="2" />
        <circle cx="80" cy="80" r="27" stroke="currentColor" strokeWidth="2" />
        <path d="M80 18v124M18 80h124" stroke="currentColor" strokeOpacity=".5" />
        <circle cx="80" cy="18" r="4" fill="currentColor" /><circle cx="142" cy="80" r="4" fill="currentColor" />
        <circle cx="80" cy="142" r="4" fill="currentColor" /><circle cx="18" cy="80" r="4" fill="currentColor" />
      </svg>
      <span>PUBLIC ACCOUNTABILITY</span>
    </div>
  );
}

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
  const evidenceSlug = department === "digital-systems" ? "technology" : department === "civic-affairs" ? "civic" : department;
  const evidencePromise = getDepartmentEvidence(evidenceSlug);
  const snapshotsPromise = getDepartmentSnapshots(department);

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
      sourceMessage = "Filtered from the first loaded page (up to 50 records) of the connected Meetings register · Standard-sensitivity records only.";
    } catch {
      sourceMessage = "The Meetings register could not be reached. No cached records are displayed.";
    }
  }

  const recent = [...meetings].sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)).slice(0, 5);
  const [evidence, snapshots] = await Promise.all([evidencePromise, snapshotsPromise]);
  const evidenceOptions: DepartmentEvidenceOption[] =
    snapshots.status === "ready" || snapshots.status === "stale"
      ? snapshots.records.map((record) => ({
          id: record.id,
          title: record.title,
          publisher: record.publisher,
          referencePeriod: record.referencePeriod,
          geographyLabel: record.geography.label,
          sourceUrl: record.sourceUrl,
        }))
      : [];
  const evidenceBrief = DEPARTMENT_EVIDENCE_BRIEFS[department];

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
          <div className="flex justify-center lg:justify-center">
            <DepartmentMark department={department} />
          </div>
        </div>
        <div className="relative grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/10">
          <div className="px-4 py-3 sm:px-7"><p className="text-[9px] uppercase tracking-[.16em] text-white/50">Mandate</p><p className="mt-1 text-xs font-semibold text-white">Defined</p></div>
          <div className="px-4 py-3 sm:px-7"><p className="text-[9px] uppercase tracking-[.16em] text-white/50">Programme register</p><p className="mt-1 text-xs font-semibold text-white">Connection shown below</p></div>
          <div className="px-4 py-3 sm:px-7"><p className="text-[9px] uppercase tracking-[.16em] text-white/50">Authority</p><p className="mt-1 text-xs font-semibold text-white">Human-led</p></div>
        </div>
      </header>

      <nav aria-label="Department workspace navigation" className="ops-department-nav flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto rounded-2xl border border-[#e1e5dc] bg-white p-2 shadow-[0_3px_14px_rgba(20,49,38,.04)]">
        <a href="#overview">Overview</a>
        <a href="#intelligence">Evidence</a>
        <a href="#programmes">Programmes</a>
        <a href="#work-plans">Work plans</a>
        <details className="ops-department-nav-more relative shrink-0">
          <summary className="inline-flex min-h-[2.65rem] cursor-pointer list-none items-center rounded-full border border-[#d9dfd7] bg-[#f3f4ee] px-4 text-xs font-bold text-[#315b45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a7833f]">More <span aria-hidden="true" className="ml-2">＋</span></summary>
          <div className="absolute right-0 top-full z-30 mt-2 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-1 rounded-xl border border-[#e1e5dc] bg-white p-2 shadow-xl">
            <a href="#functions">Functions</a>
            <a href="#indicators">Indicator pilot</a>
            <a href="#reports">Reports</a>
            <a href="#meetings">Meetings</a>
            <a href="#shared-tools">Shared tools</a>
          </div>
        </details>
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

      <section id="intelligence" className="scroll-mt-5 overflow-hidden rounded-2xl border border-[#dce4dc] bg-white shadow-[0_4px_18px_rgba(20,49,38,.04)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e8ece6] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">Shared evidence foundation · all departments</p>
            <h2 className="mt-1 font-serif text-2xl text-[#173c30]">Intelligence Observatory</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#68736b]">Source-backed evidence relevant to this department. Each record keeps its publisher, period, geography and limitations.</p>
          </div>
          <a href="https://iseyc-civic-intelligence-observatory.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Open Observatory ↗</a>
        </div>
        <div className="p-5 sm:p-6">
          {snapshots.status === "ready" || snapshots.status === "stale" ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-[#68736b]">{snapshots.records.length} source records · Snapshot bundle retrieved {snapshots.retrievedAt}</p>
                <span className={snapshots.status === "stale" ? "rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-900" : "rounded-full border border-[#dce6dc] bg-[#f0f5ef] px-3 py-1.5 text-[10px] font-semibold text-[#315b45]"}>
                  {snapshots.status === "stale" ? "Snapshot bundle needs refresh" : "Published snapshots connected"}
                </span>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {snapshots.records.map((record) => {
                  const metrics = [...record.metrics, ...(record.additionalMetrics || [])];
                  return (
                    <article key={record.id} className="rounded-xl border border-[#e4e9e2] bg-[#fbfcfa] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#8a6b34]">{record.evidenceType}</p>
                          <h3 className="mt-1 text-sm font-semibold leading-5 text-[#173c30]">{record.title}</h3>
                        </div>
                        <span className="shrink-0 rounded-full border border-[#e2e7df] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#59665d]">{record.geography.level}</span>
                      </div>
                      <dl className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-[#e8ece6] bg-white p-3 sm:grid-cols-3">
                        <div className="min-w-0">
                          <dt className="text-[9px] font-bold uppercase tracking-[.12em] text-[#8a6b34]">Publisher</dt>
                          <dd className="mt-1 break-words text-[11px] font-semibold leading-4 text-[#35483d]">{record.publisher}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[9px] font-bold uppercase tracking-[.12em] text-[#8a6b34]">Reference period</dt>
                          <dd className="mt-1 break-words text-[11px] font-semibold leading-4 text-[#35483d]">{record.referencePeriod}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[9px] font-bold uppercase tracking-[.12em] text-[#8a6b34]">Geographic coverage</dt>
                          <dd className="mt-1 break-words text-[11px] font-semibold leading-4 text-[#35483d]">{record.geography.label}</dd>
                        </div>
                      </dl>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {record.metrics.slice(0, 2).map((metric) => (
                          <div key={metric.label} className="rounded-lg border border-[#e8ece6] bg-white p-3">
                            <p className="text-[10px] font-medium leading-4 text-[#68736b]">{metric.label}</p>
                            <p className="mt-1 text-lg font-semibold leading-tight tabular-nums text-[#173c30]">{metric.value}</p>
                            <p className="mt-1 text-[9px] leading-4 text-[#7a837c]">{metric.unit} · {metric.period}</p>
                            <p className="mt-1 text-[9px] leading-4 text-[#7a837c]">{metric.measurementType}</p>
                            {metric.interval ? <p className="mt-1 text-[9px] text-[#7a837c]">Published interval: {metric.interval}</p> : null}
                          </div>
                        ))}
                      </div>
                      <details className="mt-3 border-t border-[#e8ece6] pt-2.5">
                        <summary className="min-h-8 cursor-pointer text-[11px] font-semibold text-[#315b45]">Evidence details · {metrics.length} metrics <span aria-hidden="true">＋</span></summary>
                        <div className="mt-2 space-y-3">
                          {metrics.length > 2 ? (
                            <div className="space-y-2">
                              {metrics.slice(2).map((metric) => (
                                <div key={metric.label} className="flex flex-wrap justify-between gap-2 border-b border-[#edf0ea] pb-2 last:border-0">
                                  <div><p className="text-[10px] font-semibold text-[#35483d]">{metric.label}</p><p className="text-[9px] text-[#7a837c]">{metric.measurementType}</p></div>
                                  <div className="text-right"><p className="text-[11px] font-semibold tabular-nums text-[#173c30]">{metric.value}</p><p className="text-[9px] text-[#7a837c]">{metric.unit} · {metric.period}</p></div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {record.interpretation ? <p className="text-[10px] leading-5 text-[#59665d]">{record.interpretation}</p> : null}
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#8a6b34]">Limitations</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">{record.limitations.map((item) => <li key={item} className="text-[10px] leading-4 text-[#68736b]">{item}</li>)}</ul>
                          </div>
                          <p className="text-[9px] text-[#7a837c]">Record retrieved {record.retrievedAt} · Source ID: {record.sourceId}</p>
                          {record.relatedSources?.length ? <div className="flex flex-wrap gap-3">{record.relatedSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-[#194b3b]">{source.title} ↗</a>)}</div> : null}
                        </div>
                      </details>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e8ece6] pt-2.5">
                        <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-[#194b3b]">Original source ↗</a>
                        <span className="text-[9px] text-[#7a837c]">Snapshot · not a live publisher feed</span>
                      </div>
                    </article>
                  );
                })}
              </div>
              {snapshots.note ? <p className="mt-4 text-[10px] leading-5 text-[#7a837c]">{snapshots.note}</p> : null}
              {snapshots.limitations?.length ? <ul className="mt-2 list-disc space-y-1 pl-4">{snapshots.limitations.map((item) => <li key={item} className="text-[10px] leading-4 text-[#7a837c]">{item}</li>)}</ul> : null}
            </>
          ) : snapshots.status === "empty" ? (
            <p className="rounded-xl border border-dashed border-[#d8dfd7] bg-[#fafbf8] p-4 text-xs leading-5 text-[#68736b]">The Observatory returned a valid response, but no department-linked snapshots are currently available.</p>
          ) : (
            <div className="rounded-xl border border-dashed border-[#d8dfd7] bg-[#fafbf8] p-4">
              <p className="text-sm font-semibold text-[#173c30]">{snapshots.status === "invalid" ? "Evidence response withheld" : "Evidence source unavailable"}</p>
              <p className="mt-1 text-xs leading-5 text-[#68736b]">{snapshots.status === "invalid" ? "The snapshot response did not pass contract, department-scope or provenance checks. No records are shown." : "The Observatory snapshot endpoint could not be reached. No cached or estimated replacement records are shown."}</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#dce4dc] bg-[#f4f5ef] p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Evidence interpretation</p>
          <h2 className="mt-1 font-serif text-xl text-[#173c30] sm:text-2xl">Turn evidence into better questions</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#68736b]">Use published evidence to frame investigation and programme design. Do not treat a national snapshot as a local needs assessment or proof of impact.</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-[#e1e6de] bg-white p-4">
            <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#8a6b34]">What it can inform</p>
            <p className="mt-2 text-xs leading-5 text-[#405047]">{evidenceBrief.whatItCanInform}</p>
          </article>
          <article className="rounded-xl border border-[#e1e6de] bg-white p-4">
            <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#8a6b34]">What it cannot establish</p>
            <p className="mt-2 text-xs leading-5 text-[#405047]">{evidenceBrief.cannotEstablish}</p>
          </article>
          <article className="rounded-xl border border-[#e1e6de] bg-white p-4">
            <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#8a6b34]">Next evidence step</p>
            <p className="mt-2 text-xs leading-5 text-[#405047]">{evidenceBrief.nextEvidenceStep}</p>
          </article>
        </div>
      </section>

      <section id="indicators" className="scroll-mt-5 overflow-hidden rounded-2xl border border-[#dce4dc] bg-white shadow-[0_4px_18px_rgba(20,49,38,.04)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e8ece6] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">Indicator pilot · supplementary series</p>
            <h2 className="mt-1 font-serif text-xl text-[#173c30]">National indicator series</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#68736b]">A separate live pilot feed. These national estimates are not local service measurements.</p>
          </div>
          <a href="https://iseyc-civic-intelligence-observatory.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Open Observatory ↗</a>
        </div>
        <div className="p-5 sm:p-6">
          {evidence.status === "ready" || evidence.status === "stale" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#173c30]">{evidence.indicator?.title}</p>
                  <p className="mt-1 text-[10px] text-[#68736b]">{evidence.indicator?.sourcePublisher} · Nigeria · National estimates</p>
                </div>
                <span className={evidence.status === "stale" ? "rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-900" : "rounded-full border border-[#dce6dc] bg-[#f0f5ef] px-3 py-1.5 text-[10px] font-semibold text-[#315b45]"}>
                  {evidence.status === "stale" ? "Feed receipt is stale" : "Source connected"}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(evidence.observations || []).slice(-6).reverse().map((observation) => (
                  <div key={observation.observationId} className="rounded-xl border border-[#e6eae3] bg-[#fafbf8] p-3">
                    <p className="text-[10px] font-semibold text-[#68736b]">{observation.referencePeriod}</p>
                    <p className="mt-1 font-serif text-2xl tabular-nums text-[#173c30]">{new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(observation.value)}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-[#68736b]">{observation.unit}</p>
                    <p className="mt-2 text-[9px] font-medium uppercase tracking-[.1em] text-[#8a6b34]">Estimated · {observation.geoLevel}</p>
                    <p className="mt-1 text-[9px] leading-4 text-[#7a837c]">{observation.sourceAttribution}</p>
                    <a href={observation.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-7 items-center text-[10px] font-semibold text-[#194b3b]">Source ↗</a>
                  </div>
                ))}
              </div>
              {evidence.indicator?.limitations?.length ? (
                <details className="mt-4 rounded-xl border border-[#e6eae3] px-3 py-2.5">
                  <summary className="min-h-8 cursor-pointer text-xs font-semibold text-[#315b45]">Method and limitations <span aria-hidden="true">＋</span></summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {evidence.indicator.limitations.map((limitation) => <li key={limitation} className="text-[11px] leading-5 text-[#68736b]">{limitation}</li>)}
                  </ul>
                  {evidence.indicator.methodologyNotes ? <p className="mt-2 text-[11px] leading-5 text-[#68736b]">{evidence.indicator.methodologyNotes}</p> : null}
                </details>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ea] pt-3">
                <a href={evidence.indicator?.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-[#194b3b]">Original source ↗</a>
                <p className="text-[10px] text-[#7a837c]">Retrieved {evidence.retrievedAt ? new Date(evidence.retrievedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "date unavailable"}</p>
              </div>
              <p className="mt-3 text-[10px] leading-5 text-[#7a837c]">National estimates are not Kaduna State, LGA, ward or facility measurements. They must not be used as proof of a local condition or ISEYC programme result.</p>
            </>
          ) : evidence.status === "empty" ? (
            <p className="rounded-xl border border-dashed border-[#d8dfd7] bg-[#fafbf8] p-4 text-xs leading-5 text-[#68736b]">The Observatory returned a valid response, but no observations are currently available for this indicator.</p>
          ) : evidence.status === "not-integrated" ? (
            <div className="rounded-xl border border-dashed border-[#d8dfd7] bg-[#fafbf8] p-4">
              <p className="text-sm font-semibold text-[#173c30]">No department-matched indicator in the current pilot</p>
              <p className="mt-1 text-xs leading-5 text-[#68736b]">The Observatory connection is active, but this department does not yet have a matched indicator in the published pilot catalogue. No proxy metric is substituted.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#d8dfd7] bg-[#fafbf8] p-4">
              <p className="text-sm font-semibold text-[#173c30]">Evidence temporarily unavailable</p>
              <p className="mt-1 text-xs leading-5 text-[#68736b]">{evidence.status === "invalid" ? "The Observatory response did not pass the expected source and provenance checks. Values are withheld." : "The Observatory could not be reached. No cached or estimated replacement values are shown."}</p>
            </div>
          )}
        </div>
      </section>

      <section id="programmes" className="scroll-mt-5 rounded-2xl border border-[#e1e5dc] bg-white p-4 shadow-[0_4px_18px_rgba(20,49,38,.04)] sm:p-6">
        <div className="mb-4 flex items-center gap-3"><span className="h-8 w-1 rounded-full bg-[#a7833f]" /><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">01 · Department delivery</p><h2 className="font-serif text-2xl text-[#173c30]">Programmes</h2></div></div>
        <DepartmentProgrammePanel departmentId={department} departmentName={profile.name} evidenceOptions={evidenceOptions} />
      </section>

      <section className="grid scroll-mt-5 gap-4 lg:grid-cols-2">
        <article id="work-plans" className="rounded-2xl border border-[#e1e5dc] bg-white p-4 shadow-[0_4px_18px_rgba(20,49,38,.04)] sm:p-5">
          
          <p className="mb-3 text-[10px] leading-4 text-[#7a837c]">Department task register status appears in the work-plan panel. No sample tasks are displayed.</p>
        <div className="mb-3 flex items-center gap-3"><span className="h-8 w-1 rounded-full bg-[#315b45]" /><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">02 · Execution</p><h2 className="font-serif text-xl text-[#173c30]">Work plans</h2></div></div>
          <DepartmentWorkPlanPanel departmentId={department} departmentName={profile.name} evidenceOptions={evidenceOptions} />
        </article>
        <article id="reports" className="scroll-mt-5 rounded-2xl border border-[#e1e5dc] bg-white p-4 shadow-[0_4px_18px_rgba(20,49,38,.04)] sm:p-5">
          <div className="mb-3 flex items-center gap-3"><span className="h-8 w-1 rounded-full bg-[#a7833f]" /><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">03 · Documentation</p><h2 className="font-serif text-xl text-[#173c30]">Department reports</h2></div></div>
          <DepartmentReportPanel departmentId={department} departmentName={profile.name} evidenceOptions={evidenceOptions} />
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
        ))}</ul> : <p className="mt-4 rounded-xl border border-dashed border-[#d7ddd4] bg-white/70 p-4 text-xs leading-5 text-[#6c786f]">No matching meetings appear on this page. Other pages may contain more.</p>}
      </section>

      <section id="shared-tools" className="scroll-mt-5 rounded-2xl border border-[#dce4dc] bg-white p-5 sm:p-6">
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
