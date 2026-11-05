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

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f3e9] lg:flex-row">
      <aside className="w-full border-b border-[#c4a35a]/30 bg-[#072a20] text-[#f7f3e9] lg:w-72 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-800 px-5 py-5">
          <div className="flex items-center gap-3"><img src="/iseyc-seal.svg" alt="ISEYC official seal" width="42" height="42" className="rounded-full border border-[#c4a35a] bg-white object-contain" /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d4bc7a]">ISEYC</p></div></div>
          <p className="mt-1 font-serif text-lg text-white">Digital Operations Centre</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#d4bc7a]/70">
            Notion · human approval
          </p>
        </div>
        <nav className="space-y-5 px-3 py-5">
          {GROUPS.map((group) => {
            const items = DOC_NAV.filter((m) => m.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {group}
                </p>
                <ul className="space-y-1">
                  {items.map((m) => {
                    const active =
                      !m.external &&
                      (pathname === m.href ||
                        (m.href !== "/ops" && pathname.startsWith(m.href)));
                    const className = `block rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-[#c4a35a] font-medium text-[#072a20]"
                        : "text-[#f7f3e9]/80 hover:bg-[#0f4d34] hover:text-white"
                    }`;
                    if (m.external) {
                      return (
                        <li key={m.href}>
                          <a href={m.href} target="_blank" rel="noopener noreferrer" className={className}>
                            {m.label} ↗
                          </a>
                        </li>
                      );
                    }
                    return (
                      <li key={m.href}>
                        <Link href={m.href} className={className}>
                          {m.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-[#c4a35a]/25 px-5 py-4">
          <button type="button" onClick={logout} className="text-xs font-medium text-[#d4bc7a] hover:text-white">
            Sign out
          </button>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Human authority remains final for records and external communication.
          </p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[#c4a35a]/40 bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#80621f]">
            Institutional operations
          </p>
          <h1 className="font-serif text-xl text-[#072a20] sm:text-2xl">Digital Operations Centre</h1>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
        <footer className="border-t border-[#c4a35a]/40 px-4 py-4 text-center text-xs text-[#49584f]">
          Empowering Youth, Shaping Communities · Non-partisan · Not a campaign tool
        </footer>
      </div>
    </div>
  );
}
