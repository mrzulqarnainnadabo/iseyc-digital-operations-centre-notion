import Link from "next/link";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/submit", label: "Submit" },
  { href: "/explain", label: "Explain" },
  { href: "/method", label: "Method" },
  { href: "/contact", label: "Contact" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 text-ink-950">
      <a href="#main-content" className="sr-only z-50 rounded-control bg-white px-4 py-3 font-semibold text-forest-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="ISEYC public home">
            <img src="/iseyc-seal.svg" alt="ISEYC official seal" width="42" height="42" className="shrink-0 rounded-full border border-gold-600 bg-white object-contain" />
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-gold-600">ISEYC</span>
              <span className="block max-w-[250px] text-sm font-semibold leading-5 text-forest-950 sm:max-w-none">Public Information & Civic Intelligence</span>
            </span>
          </Link>
          <nav aria-label="Public navigation" className="flex w-full gap-1 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap sm:pb-0">
            {links.map((item) => {
              return <Link key={item.href} href={item.href} className="inline-flex min-h-[40px] shrink-0 items-center rounded-control px-3 text-sm font-medium text-ink-700 hover:bg-forest-100 hover:text-forest-950">{item.label}</Link>;
            })}
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto min-h-[65vh] max-w-7xl px-4 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Initiative for Sustainable Evolution for Youth and Community · Non-partisan</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a className="min-h-[32px] inline-flex items-center hover:text-forest-900 hover:underline" href="mailto:iseycglobal@gmail.com">iseycglobal@gmail.com</a>
            <Link className="min-h-[32px] inline-flex items-center hover:text-forest-900 hover:underline" href="/login">Official sign-in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
