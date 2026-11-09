import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/departments", label: "Departments" },
  { href: "/explore", label: "Explore" },
  { href: "/submit", label: "Submit" },
  { href: "/explain", label: "Explain" },
  { href: "/method", label: "Method" },
  { href: "/contact", label: "Contact" },
];

const products = [
  { href: "https://2027-street-mandate.vercel.app", label: "Civic Mandate" },
  { href: "https://iseyc-civic-brain.vercel.app", label: "Civic Brain" },
  { href: "https://iseyc-civic-intelligence-observatory.vercel.app", label: "Civic Intelligence Observatory" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 text-ink-950">
      <a href="#main-content" className="sr-only z-50 rounded-control bg-white px-4 py-3 font-semibold text-forest-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img src="/iseyc-seal.svg" alt="" width="42" height="42" className="shrink-0 rounded-full border border-gold-600 bg-white object-contain" />
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-gold-700">ISEYC</span>
              <span className="block max-w-[250px] text-sm font-semibold leading-5 text-forest-950 sm:max-w-none">Public Information & Civic Intelligence</span>
            </span>
          </Link>
          <nav aria-label="Public navigation" className="public-nav hidden w-auto max-w-full gap-1 sm:flex sm:flex-wrap">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex min-h-[44px] shrink-0 items-center rounded-control px-3 text-sm font-medium text-ink-700 hover:bg-forest-100 hover:text-forest-950">
                {item.label}
              </Link>
            ))}
          </nav>
          <details className="public-mobile-menu relative sm:hidden">
            <summary aria-label="Menu: open public navigation" className="inline-flex min-h-[44px] min-w-[84px] cursor-pointer list-none items-center justify-center gap-2 border border-line px-3 text-sm font-semibold text-forest-950 hover:bg-forest-100">
              Menu <span aria-hidden="true" className="text-gold-700">+</span>
            </summary>
            <nav aria-label="Mobile public navigation" className="public-mobile-menu__links absolute right-0 top-[calc(100%+0.5rem)] z-20 flex w-[min(18rem,calc(100vw-2rem))] flex-col border border-line bg-white p-2 shadow-lg">
              {links.map((item) => (
                <Link key={item.href} href={item.href} className="inline-flex min-h-[44px] items-center px-3 text-sm font-medium text-ink-700 hover:bg-forest-100 hover:text-forest-950">
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </header>
      <main id="main-content" className="mx-auto min-h-[65vh] max-w-7xl px-4 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-600">ISEYC · Non-partisan</p>
            <nav aria-label="Verified public products" className="flex flex-wrap gap-x-5 gap-y-2">
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
