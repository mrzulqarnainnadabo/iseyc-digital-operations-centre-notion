import Link from "next/link";

export default function GatePage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#e5f1eb,transparent_45%),#f7f3e9] p-6">
      <div className="w-full max-w-lg rounded-3xl border border-[#d7ddd8] bg-white p-8 shadow-xl">
        <img src="/iseyc-seal.svg" alt="ISEYC official seal" width="56" height="56" className="rounded-full border border-[#c4a35a] bg-white object-contain" />\n        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#80621f]">Initiative for Sustainable Evolution for Youth and Community</p>
        <h1 className="mt-2 font-serif text-3xl text-[#072a20]">Digital Operations Centre</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#49584f]">
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
          className="mt-7 flex min-h-[52px] items-center justify-center rounded-xl bg-[#072a20] text-sm font-semibold text-white"
        >
          Officer sign-in
        </Link>
        <a
          href="https://2027-street-mandate.vercel.app"
          className="mt-3 flex min-h-[48px] items-center justify-center rounded-xl border border-[#c4a35a] text-sm font-semibold text-[#072a20]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Public Civic Mandate ↗
        </a>
      </div>
    </div>
  );
}
