import { PublicShell } from "@/components/PublicShell";

const destinations = [
  {
    name: "Civic Mandate Nigeria",
    description: "Published community demands and public civic records. Submissions remain subject to human review.",
    href: "https://2027-street-mandate.vercel.app/explore",
    status: "Published public system",
  },
  {
    name: "Civic Intelligence Observatory",
    description: "Public evidence catalogue, source provenance and geographic exploration. The current production deployment is behind the reviewed main branch.",
    href: "https://iseyc-civic-intelligence-observatory-p5rb607x3.vercel.app",
    status: "Production deployment · source alignment pending",
  },
];

export default function ExplorePage() {
  return (
    <PublicShell>
      <section className="max-w-3xl py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-600">Public systems</p>
        <h1 className="mt-3 font-serif text-3xl text-forest-950 sm:text-4xl">Explore public information</h1>
        <p className="mt-4 text-sm leading-6 text-ink-700">ISEYC's civic systems have distinct responsibilities. Open the source system relevant to your task. Availability and source coverage vary; a geographic selector does not mean evidence exists for every location.</p>
      </section>
      <section className="grid gap-4 pb-12 md:grid-cols-2">
        {destinations.map((item) => (
          <article key={item.name} className="rounded-card border border-line bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold text-gold-600">{item.status}</p>
            <h2 className="mt-3 text-xl font-semibold text-forest-950">{item.name}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-700">{item.description}</p>
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-[44px] items-center font-semibold text-forest-800 hover:underline">Open public system ↗</a>
          </article>
        ))}
      </section>
    </PublicShell>
  );
}
