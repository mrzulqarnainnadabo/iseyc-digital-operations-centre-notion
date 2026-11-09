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
      <section className="max-w-3xl py-8 sm:py-10">
        <p className="eyebrow">Method · Independence</p>
        <h1 className="mt-3 font-serif text-3xl text-forest-950 sm:text-4xl">How to read the public record</h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">Every finding keeps its source, geography, date and limitations attached. Missing evidence remains visible.</p>
      </section>
      <section className="mb-6 rounded-card border border-forest-900 bg-forest-950 p-5 text-white">
        <h2 className="text-base font-semibold">Editorial independence</h2>
        <p className="mt-2 text-sm leading-6 text-white/85">Funding does not buy favourable findings. Donors, partners, parties and public agencies cannot purchase featured conclusions or edit published records and evidence presentations. AI output never publishes itself; privileged decisions remain subject to human review.</p>
      </section>
      <section className="grid gap-3 pb-8 sm:grid-cols-2">
        {principles.map(([title, description]) => (
          <article key={title} className="rounded-card border border-line bg-white p-4">
            <h2 className="font-semibold text-forest-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">{description}</p>
          </article>
        ))}
      </section>
      <section className="mb-10 rounded-card border border-line bg-white p-5">
        <h2 className="text-base font-semibold text-forest-950">Evidence boundaries</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-700">
          <li>Published does not mean independently verified.</li>
          <li>An announcement does not prove implementation.</li>
          <li>A budget allocation does not prove expenditure or delivery.</li>
          <li>An empty feed means no records were returned; it does not mean zero need.</li>
          <li>A pilot does not establish national prevalence or representativeness.</li>
          <li>National indicators are not state, LGA or facility proof.</li>
          <li>AI-generated explanations are not institutional decisions or approved findings.</li>
        </ul>
        <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-ink-600">The Observatory remains an early-stage pilot, not a national statistics office, representative survey or complete national evidence system.</p>
      </section>
    </PublicShell>
  );
}
