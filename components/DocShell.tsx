"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DOC_NAV, GROUPS, MOBILE_NAV } from "@/lib/nav";

export function DocShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navGroups = GROUPS.map((group) => ({
    group,
    items: DOC_NAV.filter((item) => item.group === group),
  })).filter((group) => group.items.length > 0);

  function navLink(item: (typeof DOC_NAV)[number], compact = false) {
    const active = !item.external && (
      pathname === item.href ||
      (item.href !== "/ops" && pathname.startsWith(item.href))
    );
    const classes = [
      "flex min-h-[44px] items-center rounded-control px-3 text-sm font-medium transition-colors",
      compact ? "whitespace-nowrap" : "w-full",
      active
        ? "bg-forest-100 text-forest-950"
        : "text-ink-700 hover:bg-forest-100/70 hover:text-forest-950",
    ].join(" ");
    return item.external ? (
      <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={classes}>
        {item.label}<span className="ml-1 text-xs" aria-hidden="true">↗</span>
      </a>
    ) : (
      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={classes}>
        {item.label}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-ink-950 lg:flex">
      <a href="#main-content" className="sr-only z-50 rounded-control bg-white px-4 py-3 font-semibold text-forest-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <aside className="hidden w-[264px] shrink-0 border-r border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-line px-5 py-5">
          <div className="flex items-center gap-3">
            <img src="/iseyc-seal.svg" alt="ISEYC seal" width="38" height="38" className="rounded-full border border-gold-600 bg-white object-contain" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-700">ISEYC</p>
              <p className="text-sm font-semibold leading-5 text-forest-950">Initiative for Sustainable Evolution for Youth and Community</p>
            </div>
          </div>
          
        </div>
        <nav aria-label="Primary navigation" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navGroups.map(({ group, items }) => (
            <section key={group}>
              <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-600">{group}</h2>
              <div className="space-y-1">{items.map((item) => navLink(item))}</div>
            </section>
          ))}
        </nav>
        <div className="border-t border-line px-5 py-4">
          <button type="button" onClick={logout} className="min-h-[44px] text-sm font-semibold text-forest-800 hover:text-forest-950">Sign out</button>
          
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-cream-50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/iseyc-seal.svg" alt="" width="30" height="30" className="rounded-full border border-gold-600 bg-white object-contain lg:hidden" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">ISEYC</p>
                <p className="truncate text-sm font-semibold text-forest-950 sm:text-base">Digital Operations Centre</p>
                <p className="hidden text-[9px] leading-tight text-ink-600 sm:block">Initiative for Sustainable Evolution for Youth and Community</p>
              </div>
            </div>
            <button type="button" onClick={logout} className="min-h-[44px] shrink-0 rounded-control px-3 text-xs font-semibold text-ink-700 hover:bg-white lg:hidden">Sign out</button>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="w-full flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
          {children}
        </main>
        <footer className="border-t border-line bg-white/70 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
            <p>Initiative for Sustainable Evolution for Youth and Community</p>
            <nav aria-label="Institutional references" className="flex flex-wrap gap-x-4 gap-y-2">
              <a className="min-h-[32px] inline-flex items-center underline-offset-2 hover:text-forest-800 hover:underline" href="https://2027-street-mandate.vercel.app/methodology" target="_blank" rel="noopener noreferrer">Mandate methodology ↗</a>
              <a className="min-h-[32px] inline-flex items-center underline-offset-2 hover:text-forest-800 hover:underline" href="mailto:iseycglobal@gmail.com">Contact ISEYC</a>
            </nav>
          </div>
        </footer>
      </div>
      <nav aria-label="Primary mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/95 px-2 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(16,45,34,.08)] backdrop-blur lg:hidden">
        {MOBILE_NAV.map((item) => {
          const active = item.href === "/ops"
            ? pathname === "/ops"
            : item.href === "/ops#departments"
              ? pathname === "/ops"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold transition-colors ${active ? "bg-forest-50 text-forest-950" : "text-ink-600 hover:bg-cream-50 hover:text-forest-950"}`}>
              <span aria-hidden="true" className={`h-1 w-5 rounded-full ${active ? "bg-gold-600" : "bg-transparent"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
