import { PublicShell } from "@/components/PublicShell";

export default function SubmitPage() {
  return (
    <PublicShell>
      <section className="max-w-3xl py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-600">Community participation</p>
        <h1 className="mt-3 font-serif text-3xl text-forest-950 sm:text-4xl">Submit a community demand</h1>
        <p className="mt-4 text-sm leading-6 text-ink-700">Civic Mandate Nigeria is the system of record for community demands and published civic records. Share a specific issue and its location there. A submission is not automatically public: it must pass the established human-review process.</p>
        <div className="mt-7 rounded-card border border-line bg-white p-5">
          <h2 className="font-semibold text-forest-950">Before you submit</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-700">
            <li>Describe the issue clearly and identify the relevant state and LGA where known.</li>
            <li>Do not include passwords, bank details or unnecessary sensitive personal information.</li>
            <li>Only published records appear in the public civic systems.</li>
            <li>Publication does not mean that an institution has received or resolved the demand.</li>
          </ul>
          <a href="https://2027-street-mandate.vercel.app" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-[48px] items-center rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800">Continue to Civic Mandate ↗</a>
        </div>
      </section>
    </PublicShell>
  );
}
