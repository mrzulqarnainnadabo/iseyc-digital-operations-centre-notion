import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/departments", label: "Departments" },
  { href: "/explore", label: "Explore" },
  { href: "/submit", label: "Report" },
  { href: "/method", label: "Method" },
];

const products = [
  { href: "https://2027-street-mandate.vercel.app", label: "Civic Mandate" },
  { href: "https://iseyc-civic-brain.vercel.app", label: "Civic Brain" },
  { href: "https://iseyc-civic-intelligence-observatory.vercel.app", label: "Observatory" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 text-ink-950">
      <a href="#main-content" className="sr-only z-50 rounded-control bg-white px-4 py-3 font-semibold text-forest-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex min-w-0 flex-col gap-1">
              <img src="/iseyc-wordmark.svg" alt="ISEYC — Initiative for Sustainable Evolution for Youth and Community. Empowering Youth, Shaping Communities." width="286" height="60" className="h-auto w-[230px] sm:w-[286px]" />
              <span className="pl-1 text-[9px] font-bold uppercase tracking-[0.18em] text-forest-800">Digital Operations Centre</span>
            </span>
          </Link>
          <nav aria-label="Public navigation" className="public-nav flex w-full max-w-full gap-1 overflow-x-auto pb-1 lg:w-auto lg:flex-wrap lg:overflow-visible lg:pb-0">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex min-h-[44px] shrink-0 items-center rounded-control px-3 text-sm font-semibold text-ink-700 hover:bg-forest-100 hover:text-forest-950">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto min-h-[65vh] max-w-7xl px-4 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold text-forest-900">ISEYC · Non-partisan civic intelligence institution</p><p className="mt-1 text-[10px] tracking-wide text-ink-600">UNDERSTANDING PUBLIC NEEDS · INTERPRETING EVIDENCE · STRENGTHENING ACCOUNTABILITY</p></div>
            <nav aria-label="Public intelligence systems" className="flex flex-wrap gap-x-5 gap-y-2">
              {products.map((product) => (
                <a key={product.label} href={product.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-forest-800 hover:underline">
                  {product.label}<span aria-hidden="true">↗</span>
                </a>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-xs text-ink-600">
            <a className="inline-flex min-h-[44px] items-center hover:text-forest-900 hover:underline" href="mailto:iseycglobal@gmail.com">iseycglobal@gmail.com</a>
            <Link className="inline-flex min-h-[44px] items-center hover:text-forest-900 hover:underline" href="/login">Official sign-in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
