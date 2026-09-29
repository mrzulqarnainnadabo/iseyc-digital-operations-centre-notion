import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Module</p>
      <h2 className="font-serif text-2xl text-slate-950">Digital Chamber</h2>
      <p className="text-sm text-slate-600">
        Session records will use NOTION_CHAMBER_DATABASE_ID (same human-approval pattern as meetings).
      </p>
      <Link href="/ops" className="text-sm font-semibold text-emerald-800">← Command Brief</Link>
    </div>
  );
}
