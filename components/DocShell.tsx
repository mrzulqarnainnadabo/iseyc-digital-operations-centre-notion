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
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <aside className="w-full border-b border-slate-800 bg-slate-950 text-slate-200 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-800 px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">ISEYC</p>
          <p className="mt-1 font-serif text-lg text-white">Digital Operations Centre</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">
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
                        ? "bg-emerald-400 font-medium text-slate-950"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
        <div className="border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={logout} className="text-xs font-medium text-slate-400 hover:text-white">
            Sign out
          </button>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Human authority remains final for records and external communication.
          </p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            Institutional operations
          </p>
          <h1 className="font-serif text-xl text-slate-950 sm:text-2xl">Digital Operations Centre</h1>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
        <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
          Empowering Youth, Shaping Communities · Non-partisan · Not a campaign tool
        </footer>
      </div>
    </div>
  );
}
