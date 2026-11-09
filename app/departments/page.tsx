import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { departments } from "@/lib/departments";
import { observatoryConnection } from "@/lib/public-evidence";

export const metadata = {
  title: "Departments | ISEYC Public Information",
  description: "Explore ISEYC's four departments and how public evidence should be understood.",
};

export default function DepartmentsPage() {
  return (
    <PublicShell>
      <section className="department-intro py-10 sm:py-14">
        <p className="eyebrow">ISEYC · Four areas of work</p>
        <h1 className="editorial-title mt-4 max-w-4xl">Understand the work. Follow the evidence.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">Each department approaches a different part of community life. Explore its priorities, the questions public information can help answer and the evidence that is still missing.</p>
      </section>

      <section className="department-list pb-12" aria-label="ISEYC departments">
        {departments.map((department) => (
          <Link key={department.slug} href={`/departments/${department.slug}`} className="department-index-row group">
            <span className="font-mono text-xs text-gold-700">{department.number}</span>
            <div>
              <h2 className="font-serif text-2xl text-forest-950 group-hover:underline">{department.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">{department.summary}</p>
            </div>
            <span className="department-open" aria-hidden="true">Explore <span>→</span></span>
          </Link>
        ))}
      </section>

      <section className="evidence-connection mb-12" aria-labelledby="connection-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Shared evidence foundation</p>
            <h2 id="connection-title" className="mt-2 font-serif text-2xl text-forest-950">{observatoryConnection.label}</h2>
          </div>
          <span className="status-outline">Limited pilot · not national coverage</span>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-700">{observatoryConnection.detail}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <a href="https://iseyc-civic-intelligence-observatory.vercel.app/api/evidence/observations?catalog=1" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center font-semibold text-forest-800 underline">Open the verified public indicator catalog <span aria-hidden="true" className="ml-2">↗</span></a>
          <Link href="/method" className="inline-flex min-h-[44px] items-center font-semibold text-forest-800 hover:underline">Read how to interpret evidence <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>
    </PublicShell>
  );
}
