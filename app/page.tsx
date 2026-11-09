import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { departments } from "@/lib/departments";

const systems = [
  {
    number: "01",
    name: "Civic Mandate Nigeria",
    role: "Community voice",
    description: "A reviewed public record of community demands, service observations and the responsibilities citizens are asking public institutions to meet.",
    href: "https://2027-street-mandate.vercel.app",
    action: "Open Civic Mandate",
    state: "Public system",
  },
  {
    number: "02",
    name: "ISEYC Civic Brain",
    role: "Evidence explanation",
    description: "An explanation layer for published civic records. It helps people understand what a record says, which institution may be responsible and where evidence is still missing.",
    href: "https://iseyc-civic-brain.vercel.app",
    action: "Open Civic Brain",
    state: "Public system",
  },
  {
    number: "03",
    name: "Civic Intelligence Observatory",
    role: "Public evidence",
    description: "A public evidence workspace for published community records, source provenance, geography and documented accountability. It is an early national pilot: listed sources are not proof that data has been ingested, and national indicators must not be read as local evidence.",
    href: "https://iseyc-civic-intelligence-observatory.vercel.app",
    action: "Open the Observatory",
    state: "Limited public pilot",
  },
];

export default function PublicHomePage() {
  return (
    <PublicShell>
      <section className="grid gap-8 border-b border-line py-12 sm:py-16 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Initiative for Sustainable Evolution for Youth and Community</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-forest-950 sm:text-5xl lg:text-[3.5rem]">Public information. Clear evidence. Stronger accountability.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">ISEYC is a non-partisan, youth-led institution working across education, health, skills, enterprise and civic accountability. We connect community information with public evidence and make the limits of that information clear.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/explore" className="inline-flex min-h-[48px] items-center rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800">Explore the civic systems</Link>
            <Link href="/method" className="inline-flex min-h-[48px] items-center rounded-control border border-line bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-forest-100">Read our method</Link>
          </div>
        </div>
        <aside className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Our operating principle</p>
          <h2 className="mt-3 text-xl font-semibold leading-7 text-forest-950">A public record should show what is known — and what is not.</h2>
          <div className="mt-5 space-y-3 border-t border-line pt-4 text-sm leading-6 text-ink-700">
            <p><span className="font-semibold text-forest-900">Source first.</span> Keep the origin and date of information visible.</p>
            <p><span className="font-semibold text-forest-900">Human review.</span> Submissions are not published automatically.</p>
            <p><span className="font-semibold text-forest-900">No false certainty.</span> Published does not automatically mean verified.</p>
          </div>
        </aside>
      </section>

      <section className="py-10 sm:py-12" aria-labelledby="systems-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">The public infrastructure</p>
            <h2 id="systems-heading" className="mt-2 font-serif text-2xl text-forest-950 sm:text-3xl">Three systems. One evidence chain.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink-700">Each system has a distinct role. They are connected without duplicating ownership of the underlying records.</p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {systems.map((system) => (
            <article key={system.number} className="flex min-h-full flex-col rounded-card border border-line bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-gold-700">{system.number}</span>
                <span className="rounded-full bg-forest-100 px-2.5 py-1 text-[11px] font-semibold text-forest-900">{system.state}</span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-ink-600">{system.role}</p>
              <h3 className="mt-2 text-xl font-semibold leading-6 text-forest-950">{system.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-ink-700">{system.description}</p>
              {system.href ? (
                <a href={system.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-[44px] items-center font-semibold text-forest-800 hover:underline">{system.action} ↗</a>
              ) : (
                <span className="mt-6 inline-flex min-h-[44px] items-center text-sm font-semibold text-ink-600">{system.action}</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-10 sm:py-12" aria-labelledby="departments-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Four departments · one public institution</p>
            <h2 id="departments-heading" className="mt-2 font-serif text-2xl text-forest-950 sm:text-3xl">Explore ISEYC’s areas of work</h2>
          </div>
          <Link href="/departments" className="inline-flex min-h-[44px] items-center font-semibold text-forest-800 hover:underline">View all departments <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
        <div className="mt-5 grid gap-0 border-y border-line sm:grid-cols-2 sm:gap-x-8">
          {departments.map((department) => (
            <Link key={department.slug} href={`/departments/${department.slug}`} className="group grid min-h-[132px] grid-cols-[2.5rem_1fr] gap-3 border-b border-line py-5 last:border-b-0 sm:odd:border-r sm:odd:pr-5 sm:even:pl-5">
              <span className="pt-1 font-mono text-xs text-gold-700">{department.number}</span>
              <span>
                <span className="block font-serif text-xl text-forest-950 group-hover:underline">{department.name}</span>
                <span className="mt-2 block text-sm leading-6 text-ink-700">{department.summary}</span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-ink-600">Department pages describe areas of work and questions for public evidence. They do not imply operational activity, verified outcomes or connected departmental records.</p>
      </section>

      <nav className="grid gap-3 border-t border-line py-8 sm:grid-cols-4" aria-label="Public pathways">
        {[
          { href: "/explore", title: "Explore", copy: "Civic systems and release states" },
          { href: "/submit", title: "Submit", copy: "Reviewed community intake" },
          { href: "/explain", title: "Explain", copy: "Evidence-grounded clarification" },
          { href: "/method", title: "Method", copy: "Sources and limitations" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-card border border-line bg-white p-4 hover:border-forest-800">
            <h2 className="text-base font-semibold text-forest-950">{item.title}</h2>
            <p className="mt-1 text-sm leading-5 text-ink-700">{item.copy}</p>
          </Link>
        ))}
      </nav>

      <section className="grid gap-5 border-t border-line py-9 sm:grid-cols-2 sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Public participation</p>
          <h2 className="mt-2 text-xl font-semibold text-forest-950">Make a community issue easier to understand.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">Share a specific observation or submit a civic demand through the reviewed Civic Mandate process. Public visitors do not need an institutional account.</p>
        </div>
        <div className="flex flex-wrap gap-3 sm:justify-end">
          <Link href="/submit" className="inline-flex min-h-[46px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">Contribute information</Link>
          <Link href="/method" className="inline-flex min-h-[46px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-900 hover:bg-forest-100">Understand the safeguards</Link>
        </div>
      </section>
      <section className="mb-10 rounded-card border border-line bg-forest-950 p-5 text-white sm:mb-12 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d8c49a]">Institutional workspace</p>
            <h2 className="mt-2 text-xl font-semibold">For authorised ISEYC officials</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Operational tools are separated from public information. Access is restricted and does not follow from public participation or Google identity verification alone.</p>
          </div>
          <Link href="/login" className="inline-flex min-h-[46px] items-center justify-center rounded-control border border-white/40 px-4 text-sm font-semibold text-white hover:bg-white/10">Official sign-in</Link>
        </div>
      </section>
    </PublicShell>
  );
}
