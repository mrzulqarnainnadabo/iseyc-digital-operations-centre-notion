import Link from "next/link";
import { notFound } from "next/navigation";

const departments = {
  education: "Education & Capacity Building",
  health: "Health & Well-being",
  "digital-systems": "Digital Systems & Technology",
  "civic-affairs": "Civic Affairs",
} as const;

export default async function DepartmentDeskPage({ params }: { params: Promise<{ department: string }> }) {
  const { department } = await params;
  const name = departments[department as keyof typeof departments];
  if (!name) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">{name}</h1>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-ink-700" data-status="not-operational">Not operational</span>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-card border border-line bg-white p-4">
          <h2 className="text-sm font-semibold text-forest-950">Open tasks</h2>
          <span className="mt-2 inline-flex rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs text-ink-600" data-source-state="not-connected" aria-label="Task register not connected">Not connected</span>
        </section>
        <section className="rounded-card border border-line bg-white p-4">
          <h2 className="text-sm font-semibold text-forest-950">Drafts</h2>
          <span className="mt-2 inline-flex rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs text-ink-600" data-source-state="not-connected">Not connected</span>
        </section>
      </div>

      <section className="rounded-card border border-line bg-white p-4">
        <h2 className="text-sm font-semibold text-forest-950">Published systems</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="https://2027-street-mandate.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800">Civic Mandate ↗</a>
          <a href="https://iseyc-civic-brain.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800">Civic Brain ↗</a>
        </div>
      </section>
      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">Readiness</Link>
    </div>
  );
}
