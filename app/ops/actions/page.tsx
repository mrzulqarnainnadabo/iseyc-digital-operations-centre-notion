import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">Actions</h1>
        <StatusBadge status="Not operational" />
      </header>
      <p className="text-xs text-ink-600" role="status" data-status="not-operational">Not connected</p>
      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">Readiness</Link>
    </div>
  );
}
