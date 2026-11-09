import { PublicShell } from "@/components/PublicShell";

export default function ExplainPage() {
  return (
    <PublicShell>
      <section className="max-w-3xl py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Evidence-grounded explanation</p>
        <h1 className="mt-3 font-serif text-3xl text-forest-950 sm:text-4xl">Understand what the record means</h1>
        <p className="mt-4 text-sm leading-6 text-ink-700">Civic Brain explains published community records and available public evidence. It can identify evidence gaps and suggest which institution may have responsibility for human review. It cannot contact government, approve a finding, independently verify a claim without evidence or declare an issue resolved.</p>
        <div className="mt-7 rounded-card border border-line bg-white p-5">
          <p className="text-sm leading-6 text-ink-700">AI explanations are limited by the sources available to the system. If evidence is missing, partial, disputed or unavailable, the explanation must say so.</p>
          <a href="https://iseyc-civic-brain.vercel.app" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-[48px] items-center rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800">Open Civic Brain ↗</a>
        </div>
      </section>
    </PublicShell>
  );
}
