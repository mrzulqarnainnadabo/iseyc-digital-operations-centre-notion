"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DOC_NAV, GROUPS } from "@/lib/nav";

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
      <aside className="hidden w-[264px] shrink-0 border-r border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-line px-5 py-5">
          <div className="flex items-center gap-3">
            <img src="/iseyc-seal.svg" alt="ISEYC seal" width="38" height="38" className="rounded-full border border-gold-600 bg-white object-contain" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-600">ISEYC</p>
              <p className="text-sm font-semibold leading-5 text-forest-950">Digital Operations Centre</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-600">Private institutional workspace</p>
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
          <p className="mt-2 text-xs leading-5 text-ink-600">Seats are human. Institutional decisions require authorised human review.</p>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-cream-50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/iseyc-seal.svg" alt="" width="30" height="30" className="rounded-full border border-gold-600 bg-white object-contain lg:hidden" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">ISEYC · Private operations</p>
                <p className="truncate text-sm font-semibold text-forest-950 sm:text-base">Digital Operations Centre</p>
              </div>
            </div>
            <button type="button" onClick={logout} className="min-h-[44px] shrink-0 rounded-control px-3 text-xs font-semibold text-ink-700 hover:bg-white lg:hidden">Sign out</button>
          </div>
          <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden">
            {DOC_NAV.filter((item) => ["Command home", "Approval queue", "Meeting intake", "Day-1 seat briefing", "Civic Mandate", "Civic Brain"].includes(item.label)).map((item) => navLink(item, true))}
          </nav>
        </header>

        <main id="main-content" className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-line bg-white/70 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
            <p>Empowering Youth, Shaping Communities · Non-partisan institutional operations</p>
            <nav aria-label="Institutional references" className="flex flex-wrap gap-x-4 gap-y-2">
              <a className="min-h-[32px] inline-flex items-center underline-offset-2 hover:text-forest-800 hover:underline" href="https://2027-street-mandate.vercel.app/methodology" target="_blank" rel="noopener noreferrer">Mandate methodology ↗</a>
              <a className="min-h-[32px] inline-flex items-center underline-offset-2 hover:text-forest-800 hover:underline" href="mailto:iseycglobal@gmail.com">Contact ISEYC</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
