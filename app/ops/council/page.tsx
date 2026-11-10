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

      <section aria-labelledby="council-map-title" className="relative overflow-hidden rounded-[26px] border border-[#dfe5dc] bg-[#f1f2eb] p-5 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#bda879]/30" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-[#bda879]/25" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6b34]">Institutional architecture · 01</p><h2 id="council-map-title" className="mt-1 font-serif text-2xl text-[#173c30] sm:text-3xl">The leadership system</h2><p className="mt-2 max-w-xl text-xs leading-5 text-[#68736b]">A functional map of the proposed council roles. Grouping shows each office's institutional function; it does not create a reporting line or grant authority.</p></div>
          <span className="rounded-full border border-[#d7ddcf] bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-[#526457]">14 role templates · no appointments</span>
          <Link href="/docs/PRESIDENTIAL-COUNCIL-OPERATING-COMPACT.md" className="inline-flex min-h-9 items-center rounded-full border border-[#d7ddcf] bg-white px-3 text-[10px] font-bold text-[#315b45] hover:bg-[#f7f8f3]">Read operating compact ↗</Link>
        </div>
        <div className="relative mt-7 flex flex-col items-center">
          <div className="relative z-10 flex w-full max-w-sm items-center gap-4 rounded-2xl border border-[#c5b184] bg-[#173f32] px-5 py-4 text-white shadow-[0_12px_28px_rgba(18,59,47,.14)]">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#d9c59b]/60 bg-white/5 font-serif text-xl text-[#e7d7b4]">P</div>
            <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d9c59b]">Presidential leadership</p><p className="mt-1 text-sm font-semibold leading-5">National President</p><p className="text-[10px] text-white/60">Council chair · institutional direction</p></div>
            <span className="ml-auto text-xl text-[#d9c59b]" aria-hidden="true">✳</span>
          </div>
          <div className="h-7 w-px bg-[#b59b65]" />
          <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ROLE_GROUPS.filter((group) => group !== "Presidential leadership").map((group, index) => {
              const roles = COUNCIL_ROLES.filter((role) => role.group === group);
              const accents = ["#285b47", "#8b713e", "#4d6972", "#77604b", "#6d6382"];
              const symbols = ["↔", "◈", "◎", "⚖", "✧"];
              return <article key={group} className="relative overflow-hidden rounded-2xl border border-[#dfe5dc] bg-white p-4 shadow-[0_3px_12px_rgba(25,54,39,.035)]">
                <div className="absolute inset-x-0 top-0 h-1" style={{backgroundColor:accents[index]}} />
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8a6b34]">Function {String(index+2).padStart(2,"0")}</p><h3 className="mt-1 text-sm font-bold text-[#173c30]">{group}</h3></div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f2f3ed] font-serif text-xl" style={{color:accents[index]}} aria-hidden="true">{symbols[index]}</span>
                </div>
                <p className="mt-1 text-[10px] text-[#778078]">{roles.length} role {roles.length===1?"template":"templates"}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {roles.map((role) => <a key={role.id} href={"#"+role.id} className="rounded-full border border-[#e4e8e1] bg-[#fafbf8] px-2.5 py-1.5 text-[10px] font-semibold text-[#405b49] transition hover:border-[#bca574] hover:bg-[#f7f2e7]">{role.title}</a>)}
                </div>
              </article>;
            })}
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#d9dfd5] pt-4">
          <p className="text-[10px] leading-4 text-[#68736b]">Independent governance and advisory roles retain their separate procedural boundaries.</p>
          <a href="#role-guides" className="inline-flex min-h-9 items-center rounded-full bg-[#173f32] px-4 text-[10px] font-bold text-white hover:bg-[#285b47]">Explore role guides ↓</a>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["01","Mandate","Purpose, responsibilities and reporting context."],
          ["02","Practice","Weekly rhythm and expected working habits."],
          ["03","Boundary","Development pathway and limits of authority."]
        ].map(([number,title,detail]) => <article key={number} className="flex gap-3 rounded-xl border border-[#e1e5dc] bg-white p-4"><span className="font-serif text-2xl text-[#b18c4b]">{number}</span><div><h3 className="text-xs font-bold text-[#173c30]">{title}</h3><p className="mt-1 text-[10px] leading-4 text-[#68736b]">{detail}</p></div></article>)}
      </section>

      <section id="role-guides" className="rounded-2xl border border-[#dfe5dc] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Leadership field guide</p><h2 className="mt-1 font-serif text-2xl text-[#173c30]">The operating rhythm</h2></div>
          <span className="text-[10px] text-[#68736b]">Proposed · subject to governance approval</span>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {[
            ["01","Prepare","Department leads surface evidence, proposals and delivery needs."],
            ["02","Coordinate","Executive roles clarify dependencies, ownership and timing."],
            ["03","Deliberate","The council reviews matters within its verified mandate."],
            ["04","Record","Decisions, owners and follow-up are captured for review."]
          ].map(([number,title,detail],index) => <div key={number} className="relative rounded-xl bg-[#f4f5ef] p-4">
            <div className="flex items-center justify-between"><span className="font-serif text-2xl text-[#b18c4b]">{number}</span>{index<3?<span className="hidden text-lg text-[#b18c4b] sm:block" aria-hidden="true">→</span>:null}</div>
            <h3 className="mt-3 text-xs font-bold text-[#173c30]">{title}</h3><p className="mt-1 text-[10px] leading-4 text-[#68736b]">{detail}</p>
          </div>)}
        </div>
        <p className="mt-4 border-l-2 border-[#b18c4b] pl-3 text-[10px] leading-5 text-[#68736b]">This is a proposed working rhythm—not proof of an adopted constitution, an authorised delegation or a completed decision.</p>
      </section>

            {ROLE_GROUPS.map((group) => (
        <section key={group} className="space-y-3">
          <div className="flex items-center gap-3"><span className="h-px w-7 bg-[#b18c4b]" /><h2 className="font-serif text-xl text-[#173c30]">{group}</h2></div>
          <div className="grid gap-3 lg:grid-cols-2">
            {COUNCIL_ROLES.filter((role) => role.group === group).map((role) => (
              <article id={role.id} key={role.id} className="scroll-mt-24 rounded-2xl border border-[#e1e5dc] border-l-[3px] border-l-[#b18c4b] bg-white p-5 shadow-[0_4px_18px_rgba(20,49,38,.035)] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="max-w-xl font-serif text-xl leading-tight text-[#173c30]">{role.title}</h3>
                  <span className="rounded-full border border-[#e5dfd0] bg-[#fbf8ef] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-[#806638]">Template</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#5f6c63]">{role.purpose}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    [role.responsibilities.length,"Core duties"],
                    [role.weeklyPractice.length,"Weekly practices"],
                    [role.development.length,"Growth areas"]
                  ].map(([count,label]) => <div key={label} className="rounded-xl bg-[#f3f5ef] px-3 py-2.5"><p className="font-serif text-xl tabular-nums text-[#173c30]">{count}</p><p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.1em] text-[#788177]">{label}</p></div>)}
                </div>
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
