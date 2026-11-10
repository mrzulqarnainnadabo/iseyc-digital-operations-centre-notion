import Link from "next/link";
import { COUNCIL_ROLES, ROLE_GROUPS } from "@/lib/council-roles";

export const dynamic = "force-dynamic";

export default function CouncilRolesPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-7 pb-10">
      <header className="relative isolate overflow-hidden rounded-[22px] bg-[#10392e] px-5 py-7 text-white shadow-[0_18px_48px_rgba(12,43,34,.12)] sm:px-8 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <Link href="/ops/executive" className="inline-flex min-h-9 items-center text-xs font-semibold text-white/65 hover:text-white">← Executive desk</Link>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.22em] text-[#d9c59b]">ISEYC · Institutional leadership</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight tracking-[-.025em] sm:text-4xl">Council roles & leadership guide</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Understand the purpose of each office, what good work looks like, how to develop in the role and where authority stops.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 px-3 py-1.5 text-[11px]">Role templates only</span>
            <span className="rounded-full border border-[#d9c59b]/40 bg-[#d9c59b]/10 px-3 py-1.5 text-[11px] text-[#ead9b5]">No appointments or permissions created</span>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-[#e1e5dc] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6b34]">Operating principle</p><h2 className="mt-2 font-serif text-xl text-[#173c30]">Clear ownership</h2><p className="mt-1 text-xs leading-5 text-[#68736b]">Every role has a defined purpose, recurring practice and escalation path.</p></article>
        <article className="rounded-xl border border-[#e1e5dc] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6b34]">Development principle</p><h2 className="mt-2 font-serif text-xl text-[#173c30]">Learn while serving</h2><p className="mt-1 text-xs leading-5 text-[#68736b]">Each office has a practical development focus, not just a title.</p></article>
        <article className="rounded-xl border border-[#e1e5dc] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6b34]">Governance principle</p><h2 className="mt-2 font-serif text-xl text-[#173c30]">Authority is explicit</h2><p className="mt-1 text-xs leading-5 text-[#68736b]">A role description is not an appointment, identity check or system permission.</p></article>
      </section>

      <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">How the council works</p>
            <h2 className="mt-1 font-serif text-xl text-[#173c30]">A clear operating rhythm, not another layer of meetings</h2>
            <p className="mt-2 text-xs leading-5 text-[#68736b]">See the proposed weekly coordination, monthly council review, decision gates, financial controls and department approval pathway. This is a governance proposal for review, not a substitute for ISEYC's constitution or approved delegations.</p>
          </div>
          <Link href="https://github.com/mrzulqarnainnadabo/iseyc-digital-operations-centre-notion/blob/feat/council-role-guides/docs/PRESIDENTIAL-COUNCIL-OPERATING-COMPACT.md" className="inline-flex min-h-10 items-center rounded-lg border border-[#d9dfd7] px-3 py-2 text-xs font-semibold text-[#194b3b] hover:bg-[#f4f6f2]">Read operating compact on GitHub <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e1e5dc] bg-[#f4f3ed] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Proposed lean structure</p><h2 className="mt-1 font-serif text-2xl text-[#173c30]">One council · clear operating lanes</h2></div>
          <span className="text-xs text-[#68736b]">{COUNCIL_ROLES.length} role templates</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_GROUPS.map((group) => {
            const roles = COUNCIL_ROLES.filter((role) => role.group === group);
            return <article key={group} className="rounded-xl border border-[#e0e4db] bg-white p-4">
              <h3 className="text-xs font-bold text-[#173c30]">{group}</h3>
              <p className="mt-1 text-[10px] text-[#7a837c]">{roles.length} role templates</p>
              <ul className="mt-3 space-y-2">{roles.map((role) => <li key={role.id}><a href={"#"+role.id} className="text-xs font-medium leading-5 text-[#315b45] underline-offset-2 hover:underline">{role.title}</a></li>)}</ul>
            </article>;
          })}
        </div>
      </section>

      {ROLE_GROUPS.map((group) => (
        <section key={group} className="space-y-3">
          <div className="flex items-center gap-3"><span className="h-px w-7 bg-[#b18c4b]" /><h2 className="font-serif text-xl text-[#173c30]">{group}</h2></div>
          <div className="grid gap-3 lg:grid-cols-2">
            {COUNCIL_ROLES.filter((role) => role.group === group).map((role) => (
              <article id={role.id} key={role.id} className="scroll-mt-24 rounded-2xl border border-[#e1e5dc] bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="max-w-xl font-serif text-xl leading-tight text-[#173c30]">{role.title}</h3>
                  <span className="rounded-full border border-[#e5dfd0] bg-[#fbf8ef] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-[#806638]">Template</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#5f6c63]">{role.purpose}</p>
                <div className="mt-4 rounded-xl bg-[#f4f6f2] p-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">Reports to / works within</p><p className="mt-1 text-xs leading-5 text-[#405348]">{role.reportsTo}</p></div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><h4 className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">Core responsibilities</h4><ul className="mt-2 space-y-2">{role.responsibilities.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-[#5f6c63]"><span className="text-[#a7833f]">•</span>{item}</li>)}</ul></div>
                  <div><h4 className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">Weekly operating rhythm</h4><ul className="mt-2 space-y-2">{role.weeklyPractice.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-[#5f6c63]"><span className="text-[#a7833f]">•</span>{item}</li>)}</ul></div>
                </div>
                <details className="mt-4 border-t border-[#edf0ea] pt-3">
                  <summary className="min-h-10 cursor-pointer text-xs font-bold text-[#194b3b]">Personal development and authority limits <span aria-hidden="true">＋</span></summary>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div><h4 className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">Development pathway</h4><ul className="mt-2 space-y-1.5">{role.development.map((item) => <li key={item} className="text-xs leading-5 text-[#5f6c63]">• {item}</li>)}</ul></div>
                    <div><h4 className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">Authority boundary</h4><p className="mt-2 text-xs leading-5 text-[#5f6c63]">{role.authorityBoundary}</p></div>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-[#e7d9b8] bg-[#fbf8ef] p-5 sm:p-6">
        <h2 className="font-serif text-xl text-[#173c30]">How role-based development should work</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-[#6f654e]">The future member communication service should send each verified appointee a short, useful message based on their active role—not generic mass motivation. Messages can include a welcome to the office, role purpose, one practical leadership lesson, a weekly operating reminder, a relevant learning resource and recognition of service. Delivery should require verified individual email, consent and an unsubscribe or frequency control.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e5dfd0] bg-white p-3"><p className="text-[10px] font-bold text-[#806638]">On appointment</p><p className="mt-1 text-xs leading-5 text-[#5f6c63]">Welcome, mandate, first 30-day expectations and support contact.</p></div>
          <div className="rounded-xl border border-[#e5dfd0] bg-white p-3"><p className="text-[10px] font-bold text-[#806638]">Weekly</p><p className="mt-1 text-xs leading-5 text-[#5f6c63]">One role-specific prompt, a practical action and a learning resource.</p></div>
          <div className="rounded-xl border border-[#e5dfd0] bg-white p-3"><p className="text-[10px] font-bold text-[#806638]">Monthly</p><p className="mt-1 text-xs leading-5 text-[#5f6c63]">Reflection, progress recognition and a personal development check-in.</p></div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e5dc] pt-4 text-xs text-[#68736b]">
        <span>ISEYC · Empowering Youth, Shaping Communities</span>
        <a href="mailto:iseycglobal@gmail.com" className="font-semibold text-[#194b3b] hover:underline">Contact ISEYC</a>
      </footer>
    </main>
  );
}
