import { PublicShell } from "@/components/PublicShell";

const destinations = [
  {
    name: "Civic Mandate Nigeria",
    role: "Community voice",
    description: "Published community demands and reviewed civic records. Submissions remain subject to human review; publication does not imply government acceptance or delivery.",
    href: "https://2027-street-mandate.vercel.app/explore",
    action: "Open Civic Mandate",
    status: "Public system",
  },
  {
    name: "ISEYC Civic Brain",
    role: "Evidence explanation",
    description: "Understand published community records, identify evidence gaps and explore which public institution may have responsibility for human review. AI explanations are not institutional decisions.",
    href: "https://iseyc-civic-brain.vercel.app",
    action: "Open Civic Brain",
    status: "Public system",
  },
  {
    name: "Civic Intelligence Observatory",
    role: "Public evidence and geography",
    description: "The public v1 evidence API responds for a small pilot allowlist. The complete user interface still needs release alignment, and its national-level indicators do not establish state, LGA or facility coverage.",
    action: "Release alignment in progress",
    status: "Not yet release-verified",
  },
];

export default function ExplorePage() {
  return (
    <PublicShell>
      <section className="max-w-3xl py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Public systems</p>
        <h1 className="mt-3 font-serif text-3xl text-forest-950 sm:text-4xl">Explore the ISEYC civic infrastructure</h1>
        <p className="mt-4 text-sm leading-6 text-ink-700">The three systems have different responsibilities and release states. Open a verified public system, or review the method used to interpret information. A system being listed here does not imply national coverage or operational completeness.</p>
      </section>
      <section className="grid gap-4 pb-12 md:grid-cols-2 lg:grid-cols-3">
        {destinations.map((item, index) => (
          <article key={item.name} className="flex flex-col rounded-card border border-line bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-gold-700">0{index + 1}</span>
              <span className="rounded-full bg-forest-100 px-2.5 py-1 text-[11px] font-semibold text-forest-900">{item.status}</span>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-ink-600">{item.role}</p>
            <h2 className="mt-2 text-xl font-semibold text-forest-950">{item.name}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-ink-700">{item.description}</p>
            {item.href ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-[44px] items-center font-semibold text-forest-800 hover:underline">{item.action} ↗</a>
            ) : (
              <span className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-ink-600">{item.action}</span>
            )}
          </article>
        ))}
      </section>
      <p className="mb-12 max-w-3xl border-t border-line pt-5 text-xs leading-5 text-ink-600">The public systems show only their own available records. Community submissions are not representative surveys; announcements are not proof of implementation; and missing data must not be interpreted as zero need.</p>
    </PublicShell>
  );
}
