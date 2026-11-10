import Link from "next/link";
import { notFound } from "next/navigation";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";
import { getDepartment } from "@/lib/departments";

const opsDepartments = {
  education: {
    name: "Education & Capacity Building",
    publicSlug: "education",
    terms: ["education", "capacity", "learning", "school", "teacher", "literacy"],
    accountableFocus:
      "Learning access, teaching capacity, infrastructure conditions and lifelong skills programmes.",
    operationalPath: [
      "Record department meetings and link them to the institutional Meetings register.",
      "Create accountable follow-up actions with an owner role and due date.",
      "Prepare communications drafts for editorial review before any public release.",
      "Use external engagement only for verified organisations and approved meetings.",
    ],
  },
  health: {
    name: "Health & Well-being",
    publicSlug: "health",
    terms: ["health", "well-being", "wellbeing", "care", "facility", "clinic"],
    accountableFocus:
      "Primary care access, facility conditions, essential services and community well-being evidence.",
    operationalPath: [
      "Schedule and review health-related institutional meetings under the standard sensitivity boundary.",
      "Open actions for service follow-up with clear ownership and evidence requirements.",
      "Draft departmental communications for human editorial review; publication remains disabled under shared-key sessions.",
      "Engage partners only through verified organisation and contact records.",
    ],
  },
  "digital-systems": {
    name: "Digital Systems & Technology",
    publicSlug: "technology",
    terms: ["digital", "technology", "systems", "software", "connectivity", "infrastructure"],
    accountableFocus:
      "Digital public infrastructure, inclusion, skills and responsible technology use.",
    operationalPath: [
      "Keep technology programme meetings in the approved Meetings register.",
      "Track delivery actions with accountable roles and due dates.",
      "Coordinate communications through the editorial draft workflow.",
      "Maintain clear separation between draft technical notes and any authorised public statement.",
    ],
  },
  "civic-affairs": {
    name: "Civic Affairs",
    publicSlug: "civic",
    terms: ["civic", "affairs", "governance", "mandate", "participation", "responsibility"],
    accountableFocus:
      "Civic learning, institutional mandates, public-service conditions and evidence-based participation.",
    operationalPath: [
      "Document civic and governance meetings without treating shared-key login as decision authority.",
      "Create actions that capture follow-up ownership after meetings or programme reviews.",
      "Route public-facing material through Communications for review.",
      "Use external engagement for formal invitations only after meeting approval and organisation verification.",
    ],
  },
} as const;

export const dynamic = "force-dynamic";

export default async function DepartmentDeskPage({ params }: { params: Promise<{ department: string }> }) {
  const { department } = await params;
  const config = opsDepartments[department as keyof typeof opsDepartments];
  if (!config) notFound();

  const publicDef = getDepartment(config.publicSlug);
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
        return config.terms.some((term) => haystack.includes(term));
      });
      sourceMessage =
        "Filtered from the connected internal Meetings register · Standard-sensitivity records only.";
    } catch {
      sourceMessage =
        "The Meetings register could not be reached. No cached or estimated records are displayed.";
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = meetings
    .filter((meeting) => meeting.meetingDate && meeting.meetingDate >= today)
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  const recent = [...meetings]
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="overflow-hidden rounded-card border border-forest-900 bg-forest-950 p-5 text-white shadow-card sm:p-7">
        <Link
          href="/ops/readiness"
          className="inline-flex min-h-[36px] items-center text-sm text-white/75 hover:text-white"
        >
          ← Department overview
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-400">
              Department workspace
            </p>
            <h1 className="mt-1 font-serif text-2xl leading-tight sm:text-3xl">{config.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              {config.accountableFocus}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-[32px] items-center rounded-full border border-white/20 px-3 text-xs font-medium text-white/85">
              Institutional
            </span>
            <span className="inline-flex min-h-[32px] items-center rounded-full border border-amber-300/40 bg-amber-950/30 px-3 text-xs font-medium text-amber-100">
              Shared-key limits apply
            </span>
          </div>
        </div>
      </header>

      <section className="rounded-card border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-amber-950">Authority boundary</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          This workspace supports coordination and record-keeping. A staff login does not prove individual
          identity, appointment or decision authority. Formal approval, publication, official dispatch,
          decision authorisation and action closure remain disabled until verified appointments and
          scoped permissions are in place.
        </p>
      </section>

      {publicDef ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-card border border-line bg-white p-5 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
              Department purpose
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Responsibilities</h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">{publicDef.introduction}</p>
            <ul className="mt-4 space-y-3">
              {publicDef.priorities.map((item) => (
                <li key={item.title} className="rounded-control border border-line bg-cream-50 p-3">
                  <p className="text-sm font-semibold text-forest-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-600">{item.detail}</p>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-card border border-line bg-white p-5 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
              Operational path
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">How this department works today</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-700">
              {config.operationalPath.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Link
                href="/ops/actions"
                className="inline-flex min-h-[44px] items-center justify-center rounded-control border border-forest-900 bg-forest-900 px-3 text-sm font-semibold text-white hover:bg-forest-800"
              >
                Open Actions register
              </Link>
              <Link
                href="/ops/media"
                className="inline-flex min-h-[44px] items-center justify-center rounded-control border border-line bg-white px-3 text-sm font-semibold text-forest-950 hover:bg-cream-50"
              >
                Communications queue
              </Link>
              <Link
                href="/ops/chamber"
                className="inline-flex min-h-[44px] items-center justify-center rounded-control border border-line bg-white px-3 text-sm font-semibold text-forest-950 hover:bg-cream-50"
              >
                Chamber sessions
              </Link>
              <Link
                href="/ops/partners"
                className="inline-flex min-h-[44px] items-center justify-center rounded-control border border-line bg-white px-3 text-sm font-semibold text-forest-950 hover:bg-cream-50"
              >
                External engagement
              </Link>
            </div>
          </article>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
                Meetings & coordination
              </p>
              <h2 className="mt-1 font-serif text-xl text-forest-950">Department-linked meetings</h2>
            </div>
            <p className="text-xs text-ink-600">{sourceMessage}</p>
          </div>

          {upcoming.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Upcoming</p>
              <ul className="mt-2 divide-y divide-line">
                {upcoming.map((meeting) => (
                  <li key={meeting.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-forest-950">{meeting.title}</p>
                      <span className="rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs text-ink-700">
                        {meeting.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">
                      {meeting.meetingDate || "Date not supplied"} · {meeting.conveningBody}
                    </p>
                    <Link
                      href={`/ops/review/${encodeURIComponent(meeting.id)}`}
                      className="mt-2 inline-flex min-h-[36px] items-center text-sm font-semibold text-forest-800 hover:underline"
                    >
                      Open meeting record →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
              Recent (from loaded page)
            </p>
            {recent.length ? (
              <ul className="mt-2 divide-y divide-line">
                {recent.map((meeting) => (
                  <li key={meeting.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-forest-950">{meeting.title}</p>
                      <span className="rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs text-ink-700">
                        {meeting.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">
                      {meeting.meetingDate || "Date not supplied"} · {meeting.conveningBody}
                    </p>
                    <Link
                      href={`/ops/review/${encodeURIComponent(meeting.id)}`}
                      className="mt-2 inline-flex min-h-[36px] items-center text-sm font-semibold text-forest-800 hover:underline"
                    >
                      Open meeting record →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-control bg-cream-50 p-4 text-sm text-ink-600">
                No matching department meetings were found in the loaded records. This is not evidence
                that no department activity exists.
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/ops/intake"
              className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800"
            >
              Schedule a department meeting
            </Link>
            <Link
              href="/ops/queue"
              className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-950 hover:bg-cream-50"
            >
              Open full queue
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">
              Accountability
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Ownership & roles</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Department ownership, appointed officers and delegated scopes are not yet bound to
              verified individual identity. Until appointment records are connected and enforced
              server-side, this workspace does not assert that any logged-in staff member holds
              departmental authority.
            </p>
            <Link
              href="/ops/access"
              className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline"
            >
              Review access controls →
            </Link>
          </section>

          <section className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">
              Programmes & deliverables
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Work plans</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              A department task register is not yet connected. Assignments, deadlines and completion status are intentionally withheld rather than simulated. A dedicated department programme register is also not connected. Use the shared Actions register for accountable follow-ups and the Meetings register for formal coordination. Do not invent programme IDs, officer names or progress figures.
            </p>
            <span className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
              Not connected
            </span>
          </section>

          <section className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">
              Evidence & reporting
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Reports & follow-up</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Activity reports and evidence-backed progress require approved registers and verified staff roles. They are not inferred from login identity. Shared-key sessions may create draft records and actions, but cannot close actions or authorise official departmental reports.
            </p>
            <Link
              href="/ops/actions"
              className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline"
            >
              Create or review actions →
            </Link>
          </section>

          <section className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">Public face</p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Published department page</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              The public department page explains institutional purpose and evidence questions. It
              does not expose private operational registers.
            </p>
            <Link
              href={`/departments/${config.publicSlug}`}
              className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline"
            >
              View public department page →
            </Link>
          </section>
        </aside>
      </section>
    </div>
  );
}
