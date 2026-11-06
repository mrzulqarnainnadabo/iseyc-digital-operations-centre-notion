import Link from "next/link";

export default function GatePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream-50 px-4 py-10">
      <section className="w-full max-w-md rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <img src="/iseyc-seal.svg" alt="ISEYC seal" width="44" height="44" className="rounded-full border border-gold-600 bg-white object-contain" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-600">ISEYC</p>
            <p className="text-sm font-semibold text-forest-950">Private institutional workspace</p>
          </div>
        </div>
        <h1 className="mt-6 font-serif text-2xl text-forest-950">Digital Operations Centre</h1>
        <p className="mt-2 text-sm leading-6 text-ink-600">Authorised access is required. This workspace supports internal coordination, meeting records and human review.</p>
        <Link href="/login" className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">Officer sign-in</Link>
        <div className="mt-6 border-t border-line pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Public civic systems</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-forest-800">
            <a href="https://2027-street-mandate.vercel.app" target="_blank" rel="noopener noreferrer" className="min-h-[40px] inline-flex items-center hover:underline">Civic Mandate ↗</a>
            <a href="https://iseyc-civic-brain.vercel.app" target="_blank" rel="noopener noreferrer" className="min-h-[40px] inline-flex items-center hover:underline">Civic Brain ↗</a>
          </div>
        </div>
      </section>
    </main>
  );
}
