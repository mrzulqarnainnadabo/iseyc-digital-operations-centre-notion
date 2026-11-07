import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

export default function PublicHomePage() {
  return (
    <PublicShell>
      <section className="grid gap-10 border-b border-line py-12 sm:py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-600">Initiative for Sustainable Evolution for Youth and Community</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-forest-950 sm:text-5xl">Understand what is happening in Nigeria.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">ISEYC is a non-partisan, youth-led institution working across education, health, skills, enterprise and civic accountability. This public platform connects community information with public evidence and explains what the available record can — and cannot — establish.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/explore" className="inline-flex min-h-[48px] items-center rounded-control bg-forest-900 px-5 text-sm font-semibold text-white hover:bg-forest-800">Explore public information</Link>
            <Link href="/method" className="inline-flex min-h-[48px] items-center rounded-control border border-line bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-forest-100">How information is handled</Link>
          </div>
        </div>
        <aside className="rounded-card border border-line bg-white p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-600">Public access</p>
          <h2 className="mt-2 text-xl font-semibold text-forest-950">Information should be understandable and traceable.</h2>
          <p className="mt-3 text-sm leading-6 text-ink-700">Explore published community records, public-source evidence and explanations. Each item should make its source, date, scope and limitations clear.</p>
          <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-ink-600">Published does not automatically mean independently verified. Community submissions are not national statistics or representative surveys.</p>
        </aside>
      </section>
      <section className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4" aria-label="Public services">
        {[
          { href: "/explore", number: "01", title: "Explore", copy: "Browse available civic records, public evidence and geographic context." },
          { href: "/submit", number: "02", title: "Submit", copy: "Share a community demand through Civic Mandate's reviewed intake." },
          { href: "/explain", number: "03", title: "Explain", copy: "Ask Civic Brain to explain published information and evidence gaps." },
          { href: "/method", number: "04", title: "Method", copy: "Understand source types, review boundaries and known limitations." },
        ].map((item) => (
          <Link key={item.number} href={item.href} className="group rounded-card border border-line bg-white p-5 transition-colors hover:border-forest-800">
            <span className="font-mono text-xs text-gold-600">{item.number}</span>
            <h2 className="mt-5 text-lg font-semibold text-forest-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">{item.copy}</p>
            <span className="mt-5 inline-flex min-h-[32px] items-center text-sm font-semibold text-forest-800 group-hover:underline">Open section →</span>
          </Link>
        ))}
      </section>
      <section className="grid gap-6 border-t border-line py-9 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-forest-950">Institutional access</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">ISEYC officials use a separate restricted workspace. Public visitors do not need an account or an institutional appointment to explore public information.</p>
        </div>
        <Link href="/login" className="inline-flex min-h-[46px] items-center justify-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-900 hover:bg-forest-100">Official sign-in</Link>
      </section>
    </PublicShell>
  );
}
