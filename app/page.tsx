import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { departments } from "@/lib/departments";
import { getDepartmentMandateRecords } from "@/lib/mandate-records";
import { getDepartmentEvidence } from "@/lib/public-evidence";

const departmentAccent: Record<string, string> = {
  education: "dept-card--education",
  health: "dept-card--health",
  technology: "dept-card--technology",
  civic: "dept-card--civic",
};

const departmentLabels: Record<string, string> = {
  education: "Education",
  health: "Health",
  technology: "Software & Technology",
  civic: "Civic",
};

function formatValue(value: number): string {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 }).format(value);
}

export default async function PublicHomePage() {
  const [feeds, educationEvidence, healthEvidence] = await Promise.all([
    Promise.all(departments.map((department) => getDepartmentMandateRecords(department.slug))),
    getDepartmentEvidence("education"),
    getDepartmentEvidence("health"),
  ]);

  const records = feeds
    .flatMap((feed, index) => feed.records.map((record) => ({ ...record, department: departments[index].slug })))
    .filter((record, index, all) => all.findIndex((item) => item.id === record.id) === index)
    .sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    })
    .slice(0, 4);

  const mandateUnavailable = feeds.some((feed) => feed.status === "unavailable" || feed.status === "invalid");
  const prevalenceNote = feeds.find((feed) => feed.prevalenceNote)?.prevalenceNote ??
    "Published community reports are not a measure of national need, prevalence or public opinion.";

  const evidenceItems = [
    { key: "education", label: "Education", result: educationEvidence },
    { key: "health", label: "Health", result: healthEvidence },
  ];

  return (
    <PublicShell>
      <section className="home-pulse border-b border-line py-8 sm:py-10" aria-labelledby="home-title">
        <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="eyebrow">ISEYC · Public intelligence for Nigeria</p>
            <h1 id="home-title" className="editorial-title mt-3 max-w-3xl">What is happening across Nigeria?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-700">What communities report. What evidence supports. What is still unknown.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="https://2027-street-mandate.vercel.app/report" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[48px] items-center rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800">Report</a>
              <Link href="/explore" className="inline-flex min-h-[48px] items-center rounded-control border border-line bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-forest-100">Explore evidence</Link>
              <a href="https://iseyc-civic-brain.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[48px] items-center rounded-control border border-line bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-forest-100">Ask Brain ↗</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-line bg-white p-4">
              <p className="text-xs font-semibold text-ink-600">Community reports</p>
              <p className="mt-2 text-lg font-semibold text-forest-950">Published only</p>
              <p className="mt-1 text-xs leading-5 text-ink-600">Human-reviewed public records</p>
            </div>
            <div className="rounded-card border border-line bg-white p-4">
              <p className="text-xs font-semibold text-ink-600">Geographic coverage</p>
              <p className="mt-2 text-lg font-semibold text-forest-950">Not yet computed</p>
              <p className="mt-1 text-xs leading-5 text-ink-600">No national coverage score is claimed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-b border-line py-8 lg:grid-cols-[1.1fr_0.9fr]" aria-label="Reports and evidence">
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Community voice</p>
              <h2 className="mt-2 font-serif text-2xl text-forest-950">Recent published reports</h2>
            </div>
            <a href="https://2027-street-mandate.vercel.app/explore" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">All reports ↗</a>
          </div>
          {records.length ? (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {records.map((record) => (
                <li key={record.id} className="py-3">
                  <p className="text-sm leading-6 text-forest-950">{record.text}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
                    <span>{departmentLabels[record.department]}</span>
                    {record.state ? <span>{record.state}{record.lga ? ` · ${record.lga}` : ""}</span> : <span>Place not stated</span>}
                    <span>{record.verificationStatus}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 border-y border-line bg-white p-4">
              <p className="text-sm font-semibold text-forest-950">{mandateUnavailable ? "Published reports are temporarily unavailable" : "No published reports returned"}</p>
              <p className="mt-1 text-sm leading-6 text-ink-700">{mandateUnavailable ? "The public Mandate feed could not be validated or reached. No substitute records are shown." : "No matching records were returned from the connected department feeds. This does not mean there is no need or no reporting."}</p>
            </div>
          )}
          <p className="mt-3 text-xs leading-5 text-ink-600">{prevalenceNote}</p>
          <p className="mt-1 text-[11px] font-semibold text-gold-700">Department routing: provisional keyword match · not institutional taxonomy.</p>
        </div>

        <div>
          <div>
            <p className="eyebrow">Published evidence</p>
            <h2 className="mt-2 font-serif text-2xl text-forest-950">What available evidence shows</h2>
          </div>
          <div className="mt-4 space-y-3">
            {evidenceItems.map(({ key, label, result }) => (
              <article key={key} className="rounded-card border border-line bg-white p-4">
                {(result.status === "ready" || result.status === "stale") && result.indicator && result.observations?.length ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-forest-900">{label}</span>
                      <span className="status-outline">Nigeria · national only</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-forest-950">{result.indicator.title}</h3>
                    <p className="mt-1 text-xs text-ink-600">{result.indicator.sourcePublisher} · {result.status === "stale" ? "Receipt stale" : "Estimated series"}</p>
                    <p className="mt-3 text-2xl font-semibold tabular-nums text-forest-950">{formatValue(result.observations[result.observations.length - 1].value)} <span className="text-xs font-medium text-ink-600">{result.indicator.unit}</span></p>
                    <p className="mt-1 text-xs text-ink-600">Reference year: {result.observations[result.observations.length - 1].referencePeriod}</p>
                    {result.indicator.limitations[0] ? <p className="mt-2 text-xs leading-5 text-ink-600">{result.indicator.limitations[0]}</p> : null}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-forest-900">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-forest-950">{result.status === "not-integrated" ? "No matched indicator in this pilot" : "Evidence temporarily unavailable"}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-600">No local estimate is inferred from national data.</p>
                  </>
                )}
              </article>
            ))}
          </div>
          <a href="https://iseyc-civic-intelligence-observatory.vercel.app" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">Open Observatory ↗</a>
        </div>
      </section>

      <section className="border-b border-line py-8" aria-labelledby="departments-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Four departments</p>
            <h2 id="departments-heading" className="mt-2 font-serif text-2xl text-forest-950">Explore by public responsibility</h2>
          </div>
          <Link href="/departments" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">All departments →</Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {departments.map((department) => (
            <Link key={department.slug} href={`/departments/${department.slug}`} className={`dept-card group ${departmentAccent[department.slug] ?? ""}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs text-gold-700">{department.number}</span>
                <span className="dept-card__open" aria-hidden="true">Open →</span>
              </div>
              <h3 className="mt-3 font-serif text-xl leading-snug text-forest-950 group-hover:underline">{department.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-ink-700">{department.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-forest-950">How the public record is built</p>
          <p className="mt-1 text-xs text-ink-600">Sources, review, independence and limitations.</p>
        </div>
        <Link href="/method" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">Read the method →</Link>
      </section>
    </PublicShell>
  );
}
