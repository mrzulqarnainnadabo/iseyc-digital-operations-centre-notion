import Link from "next/link";

export default function GatePage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#ecfdf5,transparent_45%),#f8fafc] p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">ISEYC</p>
        <h1 className="mt-2 font-serif text-3xl text-slate-950">Digital Operations Centre</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Institutional command surface for authorised ISEYC officers. Same DOC product vision —
          data on Notion, not Supabase.
        </p>
        <ul className="mt-4 list-inside list-disc text-sm text-slate-600">
          <li>Command Brief</li>
          <li>Meeting intake → queue → human approval</li>
          <li>Chamber, Media, Actions (Notion-backed)</li>
          <li>Links to Civic Mandate &amp; Civic Brain</li>
        </ul>
        <Link
          href="/login"
          className="mt-7 flex min-h-[52px] items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white"
        >
          Officer sign-in
        </Link>
        <a
          href="https://2027-street-mandate.vercel.app"
          className="mt-3 flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Public Civic Mandate ↗
        </a>
      </div>
    </div>
  );
}
