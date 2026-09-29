import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Module</p>
      <h2 className="font-serif text-2xl text-slate-950">Media &amp; Content Command</h2>
      <p className="text-sm text-slate-600">
        Draft → human approval → external use. Wire NOTION_MEDIA_DATABASE_ID next.
      </p>
      <Link href="/ops" className="text-sm font-semibold text-emerald-800">← Command Brief</Link>
    </div>
  );
}
