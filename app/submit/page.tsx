import { PublicShell } from "@/components/PublicShell";

const submissionPaths = [
  {
    title: "Report a community observation",
    description: "Share a specific service condition or issue you personally observed. Reports remain private until a human reviewer approves a redacted public version. A report is not automatically verified.",
    href: "https://2027-street-mandate.vercel.app/report",
    action: "Report an observation",
  },
  {
    title: "Submit a civic demand",
    description: "Tell public office what your community wants delivered. A demand is reviewed before publication and does not imply government acceptance or action.",
    href: "https://2027-street-mandate.vercel.app/#mandate-form",
    action: "Submit a civic demand",
  },
];

export default function SubmitPage() {
  return (
    <PublicShell>
      <section className="max-w-3xl py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-600">Community participation</p>
        <h1 className="mt-3 font-serif text-3xl text-forest-950 sm:text-4xl">Contribute community information</h1>
        <p className="mt-4 text-sm leading-6 text-ink-700">Choose the right process. A community observation records what someone reports seeing; a civic demand records what a community asks public office to deliver. Civic Mandate Nigeria owns both submission workflows and their review states.</p>
      </section>
      <section className="grid gap-4 pb-12 md:grid-cols-2">
        {submissionPaths.map((item) => (
          <article key={item.title} className="rounded-card border border-line bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-forest-950">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-700">{item.description}</p>
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-[48px] items-center rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800">{item.action} ↗</a>
          </article>
        ))}
      </section>
      <p className="mb-12 max-w-3xl border-t border-line pt-5 text-xs leading-5 text-ink-600">Do not submit passwords, bank details or unnecessary personal information. Do not use these forms for emergencies. Publication is not independent verification, a representative survey or proof of institutional response.</p>
    </PublicShell>
  );
}
