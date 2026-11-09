import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { departments } from "@/lib/departments";

const systems = [
  {
    number: "01",
    name: "Civic Mandate Nigeria",
    role: "Community voice",
    description: "Reviewed public records of community demands and service observations.",
    href: "https://2027-street-mandate.vercel.app",
    action: "Open Civic Mandate",
  },
  {
    number: "02",
    name: "ISEYC Civic Brain",
    role: "Evidence explanation",
    description: "Explains published civic records and evidence gaps — not institutional decisions.",
    href: "https://iseyc-civic-brain.vercel.app",
    action: "Open Civic Brain",
  },
  {
    number: "03",
    name: "Civic Intelligence Observatory",
    role: "Public evidence",
    description: "Early pilot for source provenance and geography. National indicators are not local proof.",
    href: "https://iseyc-civic-intelligence-observatory.vercel.app",
    action: "Open Observatory",
  },
];

const departmentAccent: Record<string, string> = {
  education: "dept-card--education",
  health: "dept-card--health",
  technology: "dept-card--technology",
  civic: "dept-card--civic",
};

export default function PublicHomePage() {
  return (
    <PublicShell>
      <section className="home-hero border-b border-line py-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">
          Initiative for Sustainable Evolution for Youth and Community
        </p>
        <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-[1.05] tracking-tight text-forest-950 sm:text-5xl lg:text-[3.4rem]">
          Four departments. One institution. Clear public information.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">
          ISEYC is a non-partisan, youth-led institution. Our work is organised around education, health, technology and civic affairs — supported by public evidence systems that show what is known and what is not.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/departments"
            className="inline-flex min-h-[48px] items-center rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Explore departments
          </Link>
          <Link
            href="/submit"
            className="inline-flex min-h-[48px] items-center rounded-control border border-line bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-forest-100"
          >
            Contribute information
          </Link>
        </div>
      </section>

      <section className="py-12 sm:py-14" aria-labelledby="departments-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Areas of work</p>
            <h2 id="departments-heading" className="mt-2 font-serif text-2xl text-forest-950 sm:text-3xl">
              The institution, by department
            </h2>
          </div>
          <Link href="/departments" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">
            All departments <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {departments.map((department) => (
            <Link
              key={department.slug}
              href={`/departments/${department.slug}`}
              className={`dept-card group ${departmentAccent[department.slug] ?? ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs text-gold-700">{department.number}</span>
                <span className="dept-card__open" aria-hidden="true">Open →</span>
              </div>
              <h3 className="mt-6 font-serif text-2xl leading-snug text-forest-950 group-hover:underline">
                {department.name}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-ink-700">{department.summary}</p>
              <ul className="mt-5 space-y-1.5 border-t border-line pt-4">
                {department.priorities.slice(0, 3).map((priority) => (
                  <li key={priority.title} className="flex gap-2 text-xs leading-5 text-ink-600">
                    <span className="text-gold-700" aria-hidden="true">—</span>
                    <span>{priority.title}</span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        <p className="mt-5 text-xs leading-5 text-ink-600">
          Department pages describe areas of work and how public evidence should be read. They do not invent programmes, staffing or verified outcomes.
        </p>
      </section>

      <section className="border-t border-line py-10 sm:py-12" aria-labelledby="systems-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Supporting systems</p>
            <h2 id="systems-heading" className="mt-2 font-serif text-xl text-forest-950 sm:text-2xl">
              Digital infrastructure behind the departments
            </h2>
          </div>
          <Link href="/explore" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">
            Explore systems <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {systems.map((system) => (
            <article key={system.number} className="flex flex-col rounded-card border border-line bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-600">{system.role}</p>
              <h3 className="mt-2 text-base font-semibold text-forest-950">{system.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-ink-700">{system.description}</p>
              <a
                href={system.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline"
              >
                {system.action} <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 border-t border-line py-9 sm:grid-cols-2 sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Public participation</p>
          <h2 className="mt-2 text-xl font-semibold text-forest-950">Share a community observation or demand</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
            Submissions go through human review before any public record is published. No institutional account is required.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 sm:justify-end">
          <Link href="/submit" className="inline-flex min-h-[46px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">
            Contribute
          </Link>
          <Link href="/method" className="inline-flex min-h-[46px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-900 hover:bg-forest-100">
            Method
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-card border border-line bg-forest-950 p-5 text-white sm:mb-12 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d8c49a]">Institutional workspace</p>
            <h2 className="mt-2 text-xl font-semibold">Authorised ISEYC officials</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Operations are organised by department and separated from public information. Access does not follow from public use or Google sign-in alone.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-[46px] items-center justify-center rounded-control border border-white/40 px-4 text-sm font-semibold text-white hover:bg-white/10"
          >
            Official sign-in
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
