import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { DepartmentArtwork } from "@/components/DepartmentArtwork";
import { departments } from "@/lib/departments";
import { getDepartmentMandateRecords } from "@/lib/mandate-records";
import { getDepartmentEvidence } from "@/lib/public-evidence";

const departmentLabels: Record<string, string> = {
  education: "Education",
  health: "Health",
  technology: "Software & Technology",
  civic: "Civic Affairs",
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
    .sort((a, b) => (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0))
    .slice(0, 3);
  const mandateUnavailable = feeds.some((feed) => feed.status === "unavailable" || feed.status === "invalid");
  const prevalenceNote = feeds.find((feed) => feed.prevalenceNote)?.prevalenceNote ??
    "Published community reports are not a measure of national need, prevalence or public opinion.";
  const evidenceItems = [
    { key: "education", label: "Education", result: educationEvidence },
    { key: "health", label: "Health", result: healthEvidence },
  ];

  return (
    <PublicShell>
      <section className="institution-hero" aria-labelledby="home-title">
        <div className="institution-hero__copy">
          <p className="eyebrow">Initiative for Sustainable Evolution for Youth and Community</p>
          <p className="institution-hero__overline">A youth-led public institution · Nigeria</p>
          <h1 id="home-title" className="editorial-title">Building capable people. Stronger communities.</h1>
          <p className="institution-hero__lead">ISEYC works through four departments to expand opportunity, strengthen community capacity and support informed public participation.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/departments" className="inline-flex min-h-[48px] items-center rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800">Explore our departments <span className="ml-3" aria-hidden="true">→</span></Link>
            <Link href="/method" className="inline-flex min-h-[48px] items-center rounded-control border border-line bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-forest-100">How we work</Link>
          </div>
        </div>
        <div className="institution-hero__seal" aria-hidden="true">
          <div className="institution-hero__orbit institution-hero__orbit--one" />
          <div className="institution-hero__orbit institution-hero__orbit--two" />
          <img src="/iseyc-seal.svg" alt="" width="150" height="150" />
          <span>PEOPLE · CAPACITY · COMMUNITY</span>
        </div>
      </section>

      <section className="department-showcase" aria-labelledby="departments-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Our institutional structure</p>
            <h2 id="departments-heading" className="mt-2 font-serif text-3xl text-forest-950">Four departments. One shared purpose.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-700">Each department leads a distinct area of work, with its own priorities and pathways for public engagement.</p>
          </div>
          <Link href="/departments" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">View department directory →</Link>
        </div>
        <div className="department-showcase__grid">
          {departments.map((department) => (
            <Link key={department.slug} href={`/departments/${department.slug}`} className={`department-tile department-tile--${department.slug} group`}>
              <div className="department-tile__art">
                <span className="department-tile__number">{department.number}</span>
                <DepartmentArtwork slug={department.slug} />
                <span className="department-tile__open" aria-hidden="true">Explore <span>↗</span></span>
              </div>
              <div className="department-tile__body">
                <p className="department-tile__kicker">ISEYC department</p>
                <h3 className="font-serif text-xl leading-snug text-forest-950">{department.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-700">{department.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="institution-principles" aria-label="How ISEYC works">
        <div><span className="principle-index">01</span><h2>Build capacity</h2><p>Practical learning, skills and opportunity.</p></div>
        <div><span className="principle-index">02</span><h2>Serve communities</h2><p>Work grounded in local priorities and context.</p></div>
        <div><span className="principle-index">03</span><h2>Act with integrity</h2><p>Non-partisan engagement and responsible evidence.</p></div>
      </section>

      <section className="public-intelligence-section" aria-labelledby="intelligence-title">
        <div className="public-intelligence-section__intro">
          <p className="eyebrow">Supporting public intelligence</p>
          <h2 id="intelligence-title" className="mt-2 font-serif text-2xl text-forest-950">Listen carefully. Understand the evidence.</h2>
          <p className="mt-3 text-sm leading-6 text-ink-700">What communities report. What evidence supports. What is still unknown. Our public intelligence tools support the departments with published community observations and traceable evidence. They do not replace programme delivery or institutional judgement.</p>
          <p className="mt-2 text-xs leading-5 text-ink-600">No national coverage score is claimed. Institutional responsibility mapping remains incomplete in this public view.</p>
          <Link href="/method" className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 underline">Read our evidence principles →</Link>
        </div>
        <div className="public-intelligence-section__content">
          <div className="public-intelligence-section__columns">
            <div>
              <p className="eyebrow">Community voice · published records only</p>
              <h3 className="mt-2 font-serif text-xl text-forest-950">Recent published reports</h3>
              {records.length ? (
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {records.map((record) => (
                    <li key={record.id} className="py-3">
                      <p className="text-sm leading-6 text-forest-950">{record.text}</p>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
                        <span>{departmentLabels[record.department]}</span>
                        <span>{record.state ? `${record.state}${record.lga ? ` · ${record.lga}` : ""}` : "Place not stated"}</span>
                        <span>{record.verificationStatus}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 border-y border-line py-4">
                  <p className="text-sm font-semibold text-forest-950">{mandateUnavailable ? "Published reports are temporarily unavailable" : "No published reports returned"}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-700">{mandateUnavailable ? "The public Mandate feed could not be validated or reached. No substitute records are shown." : "No matching records were returned. This does not mean there is no need or no reporting."}</p>
                </div>
              )}
              <p className="mt-3 text-xs leading-5 text-ink-600">{prevalenceNote}</p>
              <p className="mt-1 text-[11px] font-semibold text-gold-700">Provisional keyword match · not institutional taxonomy.</p>
              <a href="https://2027-street-mandate.vercel.app/explore" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 underline">Explore Civic Mandate ↗</a>
            </div>
            <div>
              <p className="eyebrow">Published evidence</p>
              <h3 className="mt-2 font-serif text-xl text-forest-950">Evidence available in this pilot</h3>
              <div className="mt-3 space-y-3">
                {evidenceItems.map(({ key, label, result }) => (
                  <article key={key} className="evidence-mini">
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-forest-900">{label}</span><span className="status-outline">Nigeria · national only</span></div>
                    {(result.status === "ready" || result.status === "stale") && result.indicator && result.observations?.length ? (
                      <>
                        <h4 className="mt-3 text-sm font-semibold text-forest-950">{result.indicator.title}</h4>
                        <p className="mt-1 text-xs text-ink-600">{result.indicator.sourcePublisher} · {result.status === "stale" ? "Receipt stale" : "Published series"}</p>
                        <p className="mt-3 text-2xl font-semibold tabular-nums text-forest-950">{formatValue(result.observations[result.observations.length - 1].value)} <span className="text-xs font-medium text-ink-600">{result.indicator.unit}</span></p>
                        <p className="mt-1 text-xs text-ink-600">Reference year: {result.observations[result.observations.length - 1].referencePeriod}</p>
                        {result.indicator.limitations[0] ? <p className="mt-2 text-xs leading-5 text-ink-600">{result.indicator.limitations[0]}</p> : null}
                      </>
                    ) : <p className="mt-2 text-sm leading-6 text-ink-700">{result.status === "not-integrated" ? "No matched indicator in this pilot. No local estimate is inferred." : "Evidence is temporarily unavailable. No substitute value is shown."}</p>}
                  </article>
                ))}
              </div>
              <a href="https://iseyc-civic-intelligence-observatory.vercel.app" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 underline">Open evidence observatory ↗</a>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
