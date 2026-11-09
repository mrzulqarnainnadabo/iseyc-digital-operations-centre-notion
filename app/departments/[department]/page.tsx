import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { departments, getDepartment } from "@/lib/departments";
import { getDepartmentMandateRecords } from "@/lib/mandate-records";
import { evidenceClassifications, getDepartmentEvidence, observatoryConnection } from "@/lib/public-evidence";

type Props = { params: Promise<{ department: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return departments.map(({ slug }) => ({ department: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { department: slug } = await params;
  const department = getDepartment(slug);
  return department
    ? {
        title: `${department.name} | ISEYC`,
        description: department.summary,
      }
    : {};
}

export default async function DepartmentPage({ params }: Props) {
  const { department: slug } = await params;
  const department = getDepartment(slug);
  if (!department) notFound();
  const [evidence, mandate] = await Promise.all([
    getDepartmentEvidence(department.slug),
    getDepartmentMandateRecords(department.slug),
  ]);

  return (
    <PublicShell>
      <section className="department-hero py-10 sm:py-14">
        <Link href="/departments" className="back-link">
          ← All departments
        </Link>
        <p className="eyebrow mt-8">Department {department.number} · ISEYC</p>
        <h1 className="editorial-title mt-4 max-w-4xl">{department.name}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">{department.introduction}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/submit"
            className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Contribute information
          </Link>
          <a
            href="https://iseyc-civic-brain.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-900 hover:bg-forest-100"
          >
            Explain with Civic Brain ↗
          </a>
        </div>
      </section>

      <section className="department-content-grid pb-12" aria-label={`${department.shortName} information`}>
        <div className="department-main">
          <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="eyebrow">Areas to understand</p>
              <h2 className="mt-2 font-serif text-2xl text-forest-950">Questions worth exploring</h2>
            </div>
            <span className="hidden font-mono text-xs text-ink-600 sm:block">{department.priorities.length} themes</span>
          </div>
          <div className="priority-list">
            {department.priorities.map((priority, index) => (
              <article key={priority.title} className="priority-row">
                <span className="priority-index">0{index + 1}</span>
                <div>
                  <h3 className="font-semibold text-forest-950">{priority.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-700">{priority.detail}</p>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-10" aria-labelledby="mandate-title">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="eyebrow">Community voice · Civic Mandate</p>
                <h2 id="mandate-title" className="mt-2 font-serif text-2xl text-forest-950">
                  Published community records
                </h2>
              </div>
              <a
                href="https://2027-street-mandate.vercel.app/explore"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline"
              >
                Open Mandate ↗
              </a>
            </div>

            <p className="mt-3 text-xs leading-5 text-ink-600">{mandate.classificationNote}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-gold-700">Matching: provisional keyword · not institutional taxonomy</p>

            {mandate.status === "ready" ? (
              <>
                <p className="mt-3 text-xs leading-5 text-ink-600">{mandate.prevalenceNote}</p>
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {mandate.records.map((record) => (
                    <li key={record.id} className="py-4">
                      <p className="text-sm leading-6 text-forest-950">{record.text}</p>
                      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
                        {record.duty ? <span>{record.duty}</span> : null}
                        {record.state ? (
                          <span>
                            {record.state}
                            {record.lga ? ` · ${record.lga}` : ""}
                          </span>
                        ) : null}
                        <span className="font-semibold text-ink-700">{record.verificationStatus}</span>
                      </p>
                    </li>
                  ))}
                </ul>
                {mandate.truncatedUpstream ? (
                  <p className="mt-3 text-xs text-ink-600">
                    Upstream published list may be truncated. Open Mandate for the full public register.
                  </p>
                ) : null}
              </>
            ) : mandate.status === "empty" ? (
              <p className="mt-4 text-sm leading-6 text-ink-700">
                No published Mandate records currently matched this department as a provisional primary keyword match. That is an absence of matching published text — not zero need.
              </p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-ink-700">
                {mandate.status === "invalid"
                  ? "The Mandate public contract response was not accepted. IDCC withheld the list."
                  : "Published community records are temporarily unavailable. Retry later or open Civic Mandate directly."}
              </p>
            )}
          </section>
        </div>

        <aside className="department-aside">
          <section className="evidence-panel" aria-labelledby="evidence-title">
            <p className="eyebrow">Evidence feed</p>
            {(evidence.status === "ready" || evidence.status === "stale") && evidence.indicator ? (
              <>
                <span className="mt-3 inline-flex min-h-[28px] items-center border border-line bg-cream-50 px-2 text-[11px] font-semibold text-forest-900">
                  {evidence.status === "stale"
                    ? "Stale published data · receipt over 24 hours old"
                    : `Published public data · ${evidence.indicator.measurementType}`}
                </span>
                {evidence.status === "stale" && (
                  <p className="mt-3 border-l-4 border-warning bg-cream-50 p-3 text-sm leading-6 text-forest-950">
                    The last successful Observatory receipt is more than 24 hours old. These observations may not reflect the latest available source; review the linked original before relying on them.
                  </p>
                )}
                <h2 id="evidence-title" className="mt-3 font-serif text-xl text-forest-950">
                  {evidence.indicator.title}
                </h2>
                <p className="mt-2 text-xs leading-5 text-ink-600">
                  National estimate · Nigeria (NGA) · {evidence.observations?.length} observations · values retain the source unit:{" "}
                  {evidence.indicator.unit}.
                </p>
                <ol className="evidence-data-list mt-4" aria-label={`${evidence.indicator.title} by reference year`}>
                  {evidence.observations?.map((observation) => (
                    <li key={observation.observationId} className="evidence-data-point">
                      <span className="font-mono text-xs text-ink-600">{observation.referencePeriod}</span>
                      <span className="mt-1 block font-semibold tabular-nums text-forest-950">
                        {new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(observation.value)}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs leading-5 text-ink-600">
                  Reference years shown in ascending order. Missing years are not zero. The endpoint does not provide a publication date for these observations.
                </p>
                <dl className="mt-4 space-y-3 border-t border-line pt-4 text-xs leading-5">
                  <div>
                    <dt className="font-semibold text-forest-950">Publisher</dt>
                    <dd className="text-ink-700">{evidence.indicator.sourcePublisher}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-forest-950">Method</dt>
                    <dd className="text-ink-700">{evidence.indicator.methodologyNotes}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-forest-950">Last retrieved from Observatory</dt>
                    <dd className="text-ink-700">
                      <time dateTime={evidence.retrievedAt}>
                        {evidence.retrievedAt
                          ? new Date(evidence.retrievedAt).toLocaleString("en", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "UTC",
                            })
                          : "Not available"}{" "}
                        UTC
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-forest-950">Known limitations</dt>
                    <dd>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-700">
                        {evidence.indicator.limitations.map((limitation) => (
                          <li key={limitation}>{limitation}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
                <a
                  className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-forest-800 underline"
                  href={evidence.indicator.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open original source <span aria-hidden="true" className="ml-2">↗</span>
                </a>
              </>
            ) : evidence.status === "empty" ? (
              <>
                <h2 id="evidence-title" className="mt-2 font-serif text-xl text-forest-950">No observations returned</h2>
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  The verified source returned a valid empty result for this indicator. This does not mean zero need or zero activity.
                </p>
              </>
            ) : evidence.status === "not-integrated" ? (
              <>
                <h2 id="evidence-title" className="mt-2 font-serif text-xl text-forest-950">No matching pilot indicator</h2>
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  The current Observatory pilot catalog does not provide a department-matched indicator for this area. No proxy statistic is substituted. This is an evidence gap, not an empty result or a measure of need.
                </p>
              </>
            ) : (
              <>
                <h2 id="evidence-title" className="mt-2 font-serif text-xl text-forest-950">
                  {evidence.status === "invalid" ? "Evidence response not accepted" : "Evidence source temporarily unavailable"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  {evidence.status === "invalid"
                    ? "The Observatory response did not match the verified v1 contract. IDCC withheld the data."
                    : "The public Observatory feed could not be refreshed. IDCC does not show expired cached data or substitute zero. Please retry after the source is restored."}
                </p>
                <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-ink-600">{observatoryConnection.detail}</p>
              </>
            )}
          </section>

          <section className="evidence-panel" aria-labelledby="questions-title">
            <p className="eyebrow">Reading checklist</p>
            <h2 id="questions-title" className="mt-2 font-serif text-xl text-forest-950">Before drawing a conclusion</h2>
            <ul className="mt-4 space-y-3">
              {department.evidenceQuestions.map((question) => (
                <li key={question} className="flex gap-3 text-sm leading-6 text-ink-700">
                  <span className="text-gold-700" aria-hidden="true">—</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>

      <section className="classification-section mb-12" aria-labelledby="classification-title">
        <div className="max-w-2xl">
          <p className="eyebrow">Shared civic intelligence framework</p>
          <h2 id="classification-title" className="mt-2 font-serif text-2xl text-forest-950">Four evidence labels. Four different meanings.</h2>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            These are the classifications IDCC will use when records are connected. They are not claims that evidence of each type is currently available.
          </p>
        </div>
        <div className="classification-list mt-6">
          {evidenceClassifications.map((classification, index) => (
            <article key={classification.id} className="classification-row">
              <span className="font-mono text-xs text-gold-700">0{index + 1}</span>
              <div>
                <h3 className="font-semibold text-forest-950">{classification.label}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-700">{classification.note}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-600">
          Community reports do not establish prevalence. Announcements do not prove implementation. Published statistics do not automatically describe current conditions. See the{" "}
          <Link className="font-semibold text-forest-800 underline" href="/method">
            evidence method
          </Link>
          .
        </p>
      </section>
    </PublicShell>
  );
}
