import { PublicShell } from "@/components/PublicShell";

const principles = [
  ["Community submissions", "Show what a person or community reported. They do not establish how common an issue is and are not a representative survey."],
  ["Official records and datasets", "Retain the publisher, source link, reference date, geographic scope and known limitations. Administrative data is not automatically independent verification."],
  ["Research and media", "Remain attributed to their publishers and are not silently upgraded into official records or verified outcomes."],
  ["Independent verification", "Is only claimed where a documented verification process and its scope, date and evidence are available."],
];

export default function MethodPage() {
  return (
    <PublicShell>
      <section className="max-w-3xl py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Method and limitations</p>
        <h1 className="mt-3 font-serif text-3xl text-forest-950 sm:text-4xl">How to read the public record</h1>
        <p className="mt-4 text-sm leading-6 text-ink-700">ISEYC connects community information with public evidence. The system must preserve where information came from, what it can establish and what remains unknown.</p>
      </section>
      <section className="grid gap-3 pb-10 sm:grid-cols-2">
        {principles.map(([title, description]) => (
          <article key={title} className="rounded-card border border-line bg-white p-5">
            <h2 className="font-semibold text-forest-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">{description}</p>
          </article>
        ))}
      </section>
      <section className="mb-12 rounded-card border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-forest-950">Important distinctions</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-700">
          <li>Published does not mean independently verified.</li>
          <li>An announcement does not prove implementation.</li>
          <li>A budget allocation does not prove expenditure or delivery.</li>
          <li>An empty feed means no records were returned; it does not mean zero need.</li>
          <li>A pilot does not establish national prevalence or representativeness.</li>
          <li>Disputed figures remain visible until an authoritative reconciliation is available.</li>
          <li>AI-generated explanations are not institutional decisions or approved findings.</li>
        </ul>
        <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-600">The Observatory is an early-stage national pilot, not a national statistics office, a representative survey or a complete national evidence system.</p>
      </section>
    </PublicShell>
  );
}
