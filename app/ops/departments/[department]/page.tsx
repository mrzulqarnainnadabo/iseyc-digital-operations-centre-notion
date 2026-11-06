import Link from "next/link";
import { notFound } from "next/navigation";

const departments = {
  education: {
    name: "Education & Capacity Building",
    remit: "Learning, skills development and institutional capacity.",
  },
  health: {
    name: "Health & Well-being",
    remit: "Health awareness, well-being and community health initiatives.",
  },
  "digital-systems": {
    name: "Digital Systems & Technology",
    remit: "Digital infrastructure, technology delivery and systems support.",
  },
  "civic-affairs": {
    name: "Civic Affairs",
    remit: "Civic participation, public evidence and accountability work.",
  },
} as const;

export default async function DepartmentDeskPage({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department } = await params;
  const record = departments[department as keyof typeof departments];
  if (!record) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <Link href="/ops" className="inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline">← Command home</Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Department desk</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">{record.name}</h1>
            
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-ink-700">Not operational</span>
        </div>
      </header>

      <section className="rounded-card border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">Department workflow is not connected</p>
        <p className="mt-1 text-sm leading-5 text-amber-900">No department task register, verified department appointment or scoped department permissions are connected. This desk does not imply that a department head or staff member has been appointed.</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-card border border-line bg-white p-4 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Work management</p>
          <h2 className="mt-1 text-base font-semibold text-forest-950">Open tasks</h2>
          <p className="mt-2 text-sm leading-5 text-ink-600">Task register not connected. No task count or owner is asserted.</p>
          <span className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-ink-700">Not connected</span>
        </section>
        <section className="rounded-card border border-line bg-white p-4 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Human review</p>
          <h2 className="mt-1 text-base font-semibold text-forest-950">Drafts awaiting review</h2>
          <p className="mt-2 text-sm leading-5 text-ink-600">Department draft register not connected. No unpublished work is exposed here.</p>
          <span className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-ink-700">Not connected</span>
        </section>
      </div>

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Published public references</p>
        <h2 className="mt-1 text-base font-semibold text-forest-950">External civic systems</h2>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="https://2027-street-mandate.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800">Civic Mandate ↗</a>
          <a href="https://iseyc-civic-brain.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800">Civic Brain ↗</a>
        </div>
      </section>

      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">Review department activation dependencies →</Link>
    </div>
  );
}
