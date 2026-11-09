import Link from "next/link";
import { notFound } from "next/navigation";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";

const departments = {
  education: { name: "Education & Capacity Building", publicSlug: "education", terms: ["education", "capacity", "learning"] },
  health: { name: "Health & Well-being", publicSlug: "health", terms: ["health", "well-being", "wellbeing"] },
  "digital-systems": { name: "Digital Systems & Technology", publicSlug: "technology", terms: ["digital", "technology", "systems"] },
  "civic-affairs": { name: "Civic Affairs", publicSlug: "civic", terms: ["civic", "affairs", "governance"] },
} as const;

export const dynamic = "force-dynamic";

export default async function DepartmentDeskPage({ params }: { params: Promise<{ department: string }> }) {
  const { department } = await params;
  const config = departments[department as keyof typeof departments];
  if (!config) notFound();

  const flags = configFlags();
  let meetings: Awaited<ReturnType<typeof listMeetings>>["meetings"] = [];
  let sourceMessage = "The approved Meetings register is not configured. No meeting records are shown.";
  if (flags.token && flags.meetings) {
    try {
      const result = await listMeetings({ pageSize: 50 });
      const visible = filterLegacyVisibleMeetings(result.meetings);
      meetings = visible.filter((meeting) => {
        const haystack = `${meeting.conveningBody} ${meeting.title}`.toLowerCase();
        return config.terms.some((term) => haystack.includes(term));
      });
      sourceMessage = "Filtered from the connected internal Meetings register · Standard records only.";
    } catch {
      sourceMessage = "The Meetings register could not be reached. No cached or estimated records are displayed.";
    }
  }

  const upcoming = meetings.filter((meeting) => meeting.meetingDate && meeting.meetingDate >= new Date().toISOString().slice(0,10)).sort((a,b) => a.meetingDate.localeCompare(b.meetingDate));
  const recent = [...meetings].sort((a,b) => b.meetingDate.localeCompare(a.meetingDate)).slice(0,6);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="overflow-hidden rounded-card border border-forest-900 bg-forest-950 p-5 text-white shadow-card sm:p-7">
        <Link href="/ops/readiness" className="inline-flex min-h-[36px] items-center text-sm text-white/75 hover:text-white">← Department overview</Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[.16em] text-[#d7c18f]">ISEYC · Department workspace</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="font-serif text-3xl sm:text-4xl">{config.name}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Department coordination, meeting activity and access to the public department brief.</p></div>
          <Link href={`/departments/${config.publicSlug}`} className="inline-flex min-h-[44px] items-center rounded-control border border-white/25 px-4 text-sm font-semibold text-white hover:bg-white/10">Public department page ↗</Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Department meeting summary">
        <article className="rounded-card border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-600">Meetings found</p><p className="mt-2 font-serif text-3xl tabular-nums">{meetings.length}</p><p className="mt-1 text-xs text-ink-600">Matching department terms in loaded records</p></article>
        <article className="rounded-card border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-600">Upcoming dated meetings</p><p className="mt-2 font-serif text-3xl tabular-nums">{upcoming.length}</p><p className="mt-1 text-xs text-ink-600">Within the loaded register page</p></article>
        <article className="rounded-card border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-600">Task register</p><p className="mt-2 text-lg font-semibold text-amber-800">Not connected</p><p className="mt-1 text-xs text-ink-600">No task count or assignments are fabricated</p></article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">Department activity</p><h2 className="mt-1 font-serif text-2xl text-forest-950">Meeting records</h2></div><Link href="/ops/calendar" className="text-sm font-semibold text-forest-800 hover:underline">Open calendar →</Link></div>
          <p className="mt-2 text-xs text-ink-600">{sourceMessage}</p>
          {recent.length ? <ul className="mt-4 divide-y divide-line">{recent.map((meeting) => <li key={meeting.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-forest-950">{meeting.title}</p><span className="rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs text-ink-700">{meeting.status}</span></div><p className="mt-1 text-xs text-ink-600">{meeting.meetingDate || "Date not supplied"} · {meeting.conveningBody}</p><Link href={`/ops/review/${encodeURIComponent(meeting.id)}`} className="mt-2 inline-flex min-h-[36px] items-center text-sm font-semibold text-forest-800 hover:underline">Open meeting record →</Link></li>)}</ul> : <p className="mt-4 rounded-control bg-cream-50 p-4 text-sm text-ink-600">No matching department meetings were found in the loaded records. This is not evidence that no department activity exists.</p>}
          <Link href="/ops/intake" className="mt-4 inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">Schedule a department meeting</Link>
        </div>
        <aside className="space-y-4">
          <section className="rounded-card border border-line bg-white p-4 shadow-card"><p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">Work management</p><h2 className="mt-1 font-serif text-xl text-forest-950">Tasks & deliverables</h2><p className="mt-2 text-sm leading-6 text-ink-600">A department task register is not yet connected. Assignments, deadlines and completion status are intentionally withheld rather than simulated.</p><span className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">Not connected</span></section>
          <section className="rounded-card border border-line bg-white p-4 shadow-card"><p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">Governance</p><h2 className="mt-1 font-serif text-xl text-forest-950">Department reporting</h2><p className="mt-2 text-sm leading-6 text-ink-600">Reporting and approval workflows require an approved department register and verified staff roles. They are not inferred from login identity.</p><Link href="/ops/access" className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline">Review access controls →</Link></section>
        </aside>
      </section>
    </div>
  );
}
