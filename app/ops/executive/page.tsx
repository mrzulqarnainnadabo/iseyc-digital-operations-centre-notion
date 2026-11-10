import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";
import { listRegister, registerConfigured } from "@/lib/notion-registers";

export const dynamic = "force-dynamic";

type RegisterState = {
  configured: boolean;
  rows: Awaited<ReturnType<typeof listRegister>>["rows"];
  error: string | null;
};

function localToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function SourceState({ configured, error }: { configured: boolean; error: string | null }) {
  const label = error ? "Source unavailable" : configured ? "Connected source" : "Not connected";
  const style = error || !configured ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#d7e4d9] bg-[#f0f5ef] text-[#285a3c]";
  return <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[10px] font-semibold ${style}`}>{label}</span>;
}

export default async function ExecutiveDeskPage() {
  if (!(await requireStaffSession())) redirect("/login");

  const flags = configFlags();
  const today = localToday();
  let meetings: Awaited<ReturnType<typeof listMeetings>>["meetings"] = [];
  let meetingsError: string | null = null;
  if (flags.token && flags.meetings) {
    try {
      const result = await listMeetings({ pageSize: 50 });
      meetings = filterLegacyVisibleMeetings(result.meetings);
    } catch {
      meetingsError = "The Meetings register could not be reached. No stale meeting records are shown.";
    }
  }

  async function loadRegister(kind: "actions" | "chamber" | "media"): Promise<RegisterState> {
    const configured = Boolean(flags.token && registerConfigured(kind));
    if (!configured) return { configured: false, rows: [], error: null };
    try {
      const page = await listRegister(kind);
      return { configured: true, rows: page.rows, error: null };
    } catch {
      return { configured: true, rows: [], error: "The source could not be reached. No cached records are shown." };
    }
  }

  const [actions, chamber, media] = await Promise.all([
    loadRegister("actions"),
    loadRegister("chamber"),
    loadRegister("media"),
  ]);

  const upcomingMeetings = meetings
    .filter((meeting) => validDate(meeting.meetingDate) && meeting.meetingDate >= today)
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))
    .slice(0, 5);
  const meetingReview = meetings.filter((meeting) => ["New", "Draft", "In review"].includes(meeting.status));
  const openActions = actions.rows.filter((row) => !["Done", "Accepted", "Closed", "Archived"].includes(row.status));
  const upcomingSessions = chamber.rows
    .filter((row) => validDate(row.date) && row.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const sources = [
    { label: "Meetings", connected: Boolean(flags.token && flags.meetings && !meetingsError), error: meetingsError },
    { label: "Action register", connected: actions.configured && !actions.error, error: actions.error },
    { label: "Council sessions", connected: chamber.configured && !chamber.error, error: chamber.error },
    { label: "Communications", connected: media.configured && !media.error, error: media.error },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-8">
      <header className="relative isolate overflow-hidden rounded-[22px] bg-[#10392e] px-5 py-7 text-white shadow-[0_18px_48px_rgba(12,43,34,.12)] sm:px-8 sm:py-9">
        <div aria-hidden="true" className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d9c59b]">ISEYC · Executive coordination</p>
            <h1 className="mt-3 font-serif text-3xl leading-tight tracking-[-.025em] sm:text-4xl">Executive desk</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">A working view of meetings, council sessions, assigned actions and institutional follow-through. Source-backed records only.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/ops/intake" className="inline-flex min-h-11 items-center rounded-full bg-[#e8d8b4] px-4 text-xs font-bold text-[#173c30] hover:bg-white">Prepare meeting brief ↗</Link>
            <Link href="/ops/calendar" className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-4 text-xs font-semibold text-white hover:bg-white/10">Open calendar</Link>
          </div>
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-2 border-t border-white/15 pt-5 sm:grid-cols-4">
          <div><p className="text-[10px] uppercase tracking-[.14em] text-white/50">Meeting records · loaded</p><p className="mt-1 font-serif text-2xl tabular-nums">{flags.token && flags.meetings && !meetingsError ? meetings.length : "—"}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-white/50">Awaiting review · loaded</p><p className="mt-1 font-serif text-2xl tabular-nums">{flags.token && flags.meetings && !meetingsError ? meetingReview.length : "—"}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-white/50">Open actions · loaded</p><p className="mt-1 font-serif text-2xl tabular-nums">{actions.configured && !actions.error ? openActions.length : "—"}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-white/50">Upcoming council sessions</p><p className="mt-1 font-serif text-2xl tabular-nums">{chamber.configured && !chamber.error ? upcomingSessions.length : "—"}</p></div>
        </div>
      </header>

      <section aria-label="Executive coordination functions" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {number:"01",symbol:"✳",title:"Institutional direction",office:"National President",detail:"Strategic priorities, council leadership and institutional integrity.",tone:"border-t-[#b18c4b]"},
          {number:"02",symbol:"⌘",title:"Executive coordination",office:"Chief of Staff",detail:"Presidential priorities, executive calendar and cross-office follow-through.",tone:"border-t-[#315b45]"},
          {number:"03",symbol:"▤",title:"Institutional records",office:"Secretary-General",detail:"Governance records, draft minutes, correspondence and decision history.",tone:"border-t-[#4d6972]"},
          {number:"04",symbol:"◫",title:"Operational delivery",office:"COO · CFO",detail:"Department coordination, delivery oversight and financial stewardship.",tone:"border-t-[#806b8c]"}
        ].map((item) => <article key={item.number} className={`relative overflow-hidden rounded-2xl border border-[#e1e5dc] border-t-[3px] bg-white p-4 shadow-[0_4px_16px_rgba(20,49,38,.035)] ${item.tone}`}>
          <div className="flex items-start justify-between"><span className="text-[9px] font-bold tracking-[.18em] text-[#a7833f]">{item.number} / OFFICE</span><span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1f3ed] font-serif text-xl text-[#315b45]">{item.symbol}</span></div>
          <h2 className="mt-4 font-serif text-lg leading-tight text-[#173c30]">{item.title}</h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#8a6b34]">{item.office}</p>
          <p className="mt-2 text-xs leading-5 text-[#68736b]">{item.detail}</p>
        </article>)}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e1e5dc] bg-[#f4f3ed] px-4 py-3">
        <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Council reference</p><p className="mt-1 text-xs text-[#526157]">See the complete role architecture, operating expectations and authority boundaries.</p></div>
        <Link href="/ops/council" className="inline-flex min-h-10 items-center rounded-full bg-[#173f32] px-4 text-xs font-bold text-white hover:bg-[#285b47]">Open council architecture ↗</Link>
      </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-[#e1e5dc] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Executive schedule</p><h2 className="mt-1 font-serif text-2xl text-[#173c30]">Upcoming meetings</h2></div>
            <Link href="/ops/calendar" className="text-xs font-bold text-[#194b3b] hover:underline">Full calendar →</Link>
          </div>
          <SourceState configured={Boolean(flags.token && flags.meetings)} error={meetingsError} />
          {upcomingMeetings.length ? <ul className="mt-4 divide-y divide-[#edf0ea]">{upcomingMeetings.map((meeting) => (
            <li key={meeting.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="font-semibold text-[#173c30]">{meeting.title}</p><p className="mt-1 text-xs text-[#68736b]">{meeting.meetingDate} · {meeting.conveningBody || "Convening body not supplied"}</p></div>
              <div className="flex items-center gap-3"><span className="text-[10px] font-semibold text-[#8a6b34]">{meeting.status}</span><Link href={`/ops/review/${encodeURIComponent(meeting.id)}`} className="inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Open brief →</Link></div>
            </li>
          ))}</ul> : <p className="mt-4 rounded-xl border border-dashed border-[#d9dfd7] bg-[#fafbf8] p-4 text-sm leading-5 text-[#68736b]">{meetingsError || !(flags.token && flags.meetings) ? "Connect the approved Meetings source to display the executive schedule." : "No upcoming dated meetings appear in the first loaded page. This is not a statement that no meetings exist in later pages."}</p>}
        </article>

        <article className="rounded-2xl border border-[#e1e5dc] bg-[#f3f4ee] p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Work requiring follow-through</p>
          <h2 className="mt-1 font-serif text-2xl text-[#173c30]">Action register</h2>
          <div className="mt-2"><SourceState configured={actions.configured} error={actions.error} /></div>
          <p className="mt-4 font-serif text-4xl tabular-nums text-[#173c30]">{actions.configured && !actions.error ? openActions.length : "—"}</p>
          <p className="mt-1 text-xs text-[#68736b]">Open items in the first loaded page</p>
          {actions.error ? <p role="alert" className="mt-3 text-xs text-amber-900">{actions.error}</p> : null}
          <Link href="/ops/actions" className="mt-5 inline-flex min-h-10 items-center rounded-full bg-[#173f32] px-4 text-xs font-bold text-white hover:bg-[#245540]">Open action register ↗</Link>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#e1e5dc] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6b34]">Council and formal sessions</p>
          <h2 className="mt-2 font-serif text-xl text-[#173c30]">Digital Chamber</h2>
          <SourceState configured={chamber.configured} error={chamber.error} />
          <p className="mt-3 text-xs leading-5 text-[#68736b]">{chamber.configured && !chamber.error ? `${upcomingSessions.length} upcoming dated sessions in the loaded register page.` : "Session scheduling is unavailable until the approved source is connected."}</p>
          <Link href="/ops/chamber" className="mt-4 inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Open Chamber →</Link>
        </article>
        <article className="rounded-2xl border border-[#e1e5dc] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6b34]">Department delivery</p>
          <h2 className="mt-2 font-serif text-xl text-[#173c30]">Four departments</h2>
          <p className="mt-2 text-xs leading-5 text-[#68736b]">Programme planning, deliverables and reports stay owned by the relevant department, with cross-institutional coordination here.</p>
          <Link href="/ops#departments" className="mt-4 inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Go to departments →</Link>
        </article>
        <article className="rounded-2xl border border-[#e1e5dc] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6b34]">Institutional communication</p>
          <h2 className="mt-2 font-serif text-xl text-[#173c30]">Communications</h2>
          <SourceState configured={media.configured} error={media.error} />
          <p className="mt-2 text-xs leading-5 text-[#68736b]">Editorial drafts, factual review and communications coordination. Publication remains a separate authorised step.</p>
          <Link href="/ops/media" className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Open communications →</Link>
        </article>
      </section>

      <section className="rounded-2xl border border-[#e7d9b8] bg-[#fbf8ef] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Source connection status</p><h2 className="mt-1 font-serif text-xl text-[#173c30]">Institutional registers</h2></div>
          <Link href="/ops/readiness" className="text-xs font-bold text-[#194b3b] hover:underline">Full readiness →</Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((source) => <div key={source.label} className="rounded-xl border border-[#e5dfd0] bg-white p-3"><p className="text-xs font-semibold text-[#173c30]">{source.label}</p><p className={`mt-1 text-[10px] ${source.connected ? "text-[#28664a]" : "text-[#8a6b34]"}`}>{source.error || (source.connected ? "Connected for this request" : "Not connected")}</p></div>)}
        </div>
        <p className="mt-4 text-[10px] leading-4 text-[#756c58]">All summaries are limited to the first loaded page. A missing connection or failed read is shown explicitly. This workspace does not confer executive appointment, decision, dispatch or publication authority.</p>
      </section>
    </main>
  );
}
