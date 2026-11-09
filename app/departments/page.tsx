import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { departments, getDepartmentRouteSlug } from "@/lib/departments";
import { observatoryConnection } from "@/lib/public-evidence";

export const metadata = {
  title: "Departments | ISEYC Public Information",
  description: "Explore ISEYC's four departments and how public evidence should be understood.",
};

const pathways = [
  {
    title: "Contribute",
    detail: "Share a community observation or demand for human review.",
    href: "/submit",
    external: false,
  },
  {
    title: "Published records",
    detail: "Browse Civic Mandate’s published-only community register.",
    href: "https://2027-street-mandate.vercel.app/explore",
    external: true,
  },
  {
    title: "Explain evidence",
    detail: "Use Civic Brain on published records — not institutional decisions.",
    href: "https://iseyc-civic-brain.vercel.app",
    external: true,
  },
  {
    title: "Method",
    detail: "How sources, review and limitations are handled.",
    href: "/method",
    external: false,
  },
] as const;

export default function DepartmentsPage() {
  return (
    <PublicShell>
      <section className="department-intro py-10 sm:py-14">
        <p className="eyebrow">ISEYC · Four areas of work</p>
        <h1 className="editorial-title mt-4 max-w-4xl">Understand the work. Follow the evidence.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">
          Each department focuses on a different part of community life. Open a department for priorities, published community records where they match, and public evidence — including clear gaps.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/submit"
            className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Contribute information
          </Link>
          <Link
            href="/method"
            className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-900 hover:bg-forest-100"
          >
            Evidence method
          </Link>
        </div>
      </section>

      <section className="department-list pb-10" aria-label="ISEYC departments">
        {departments.map((department) => (
          <Link key={department.slug} href={`/departments/${getDepartmentRouteSlug(department.slug)}`} className="department-index-row group">
            <span className="font-mono text-xs text-gold-700">{department.number}</span>
            <div>
              <h2 className="font-serif text-2xl text-forest-950 group-hover:underline">{department.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">{department.summary}</p>
              <p className="mt-2 text-xs text-ink-600">{department.priorities.length} priority themes · public evidence where connected</p>
            </div>
            <span className="department-open" aria-hidden="true">
              Explore <span>→</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="mb-10 border-t border-line pt-8" aria-labelledby="pathways-title">
        <p className="eyebrow">How to engage</p>
        <h2 id="pathways-title" className="mt-2 font-serif text-2xl text-forest-950">
          Participation and supporting systems
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pathways.map((item) =>
            item.external ? (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-card border border-line bg-white p-4 hover:border-forest-800"
              >
                <h3 className="text-base font-semibold text-forest-950">{item.title} ↗</h3>
                <p className="mt-2 text-sm leading-6 text-ink-700">{item.detail}</p>
              </a>
            ) : (
              <Link key={item.title} href={item.href} className="rounded-card border border-line bg-white p-4 hover:border-forest-800">
                <h3 className="text-base font-semibold text-forest-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-700">{item.detail}</p>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="evidence-connection mb-12" aria-labelledby="connection-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Shared evidence foundation</p>
            <h2 id="connection-title" className="mt-2 font-serif text-2xl text-forest-950">
              {observatoryConnection.label}
            </h2>
          </div>
          <span className="status-outline">Limited pilot · not national coverage</span>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-700">{observatoryConnection.detail}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <a
            href="https://iseyc-civic-intelligence-observatory.vercel.app/api/evidence/observations?catalog=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center font-semibold text-forest-800 underline"
          >
            Open the verified public indicator catalog <span aria-hidden="true" className="ml-2">↗</span>
          </a>
          <Link href="/method" className="inline-flex min-h-[44px] items-center font-semibold text-forest-800 hover:underline">
            Read how to interpret evidence <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
