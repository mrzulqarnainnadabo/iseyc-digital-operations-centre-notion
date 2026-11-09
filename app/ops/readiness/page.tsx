import Link from "next/link";
import { configFlags } from "@/lib/notion";
import { StatusBadge } from "@/components/StatusBadge";

const departments = [
  {slug:"education",number:"01",name:"Education & Capacity Building",tag:"Learning that becomes capability",focus:"Programmes · skills · assessment · mentoring",tone:"border-l-[#28664a] bg-[#e8f0ea]"},
  {slug:"health",number:"02",name:"Health & Well-being",tag:"Health literacy and trusted pathways",focus:"Prevention · evidence · referrals · safeguarding",tone:"border-l-[#287a70] bg-[#e5f1ee]"},
  {slug:"digital-systems",number:"03",name:"Software & Technology",tag:"Reliable systems and responsible technology",focus:"Digital skills · software · data · AI governance",tone:"border-l-[#52776d] bg-[#e6eeeb]"},
  {slug:"civic-affairs",number:"04",name:"Civic Department",tag:"Civic understanding grounded in evidence",focus:"Rights · duties · community voice · accountability",tone:"border-l-[#8a7139] bg-[#f0eee6]"},
] as const;

const systems = [
  {name:"Meetings & review",state:"Partial",detail:"Intake and controlled review exist; full minutes, attendance and decision handoff remain outstanding.",href:"/ops/queue"},
  {name:"Communications",state:"Partial",detail:"Draft creation is connected; editorial approval and publication evidence remain outstanding.",href:"/ops/media"},
  {name:"Actions & follow-through",state:"Partial",detail:"Initial register creation exists; assignment updates, evidence, escalation and closure are not complete.",href:"/ops/actions"},
  {name:"Digital Chamber",state:"Partial",detail:"Session scheduling exists; attendance, chair controls, minutes and formal decisions remain outstanding.",href:"/ops/chamber"},
  {name:"Identity & access",state:"Not operational",detail:"Shared-key access is not verified individual identity or appointment-based authority.",href:"/ops/access"},
] as const;

export default function ReadinessPage(){
 const flags=configFlags();
 const registersConfigured=flags.token&&flags.programmes&&flags.departmentReports;
 return <div className="mx-auto max-w-7xl space-y-7">
  <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-gold-700">ISEYC · Institutional delivery</p><h1 className="mt-2 font-serif text-3xl text-forest-950 sm:text-4xl">Department workspaces</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">Four departments. One operating standard. Each desk connects programmes, meetings and evidence-backed reporting.</p></div><span className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700">Department-first operations</span></header>
  <section className="grid gap-3 sm:grid-cols-2" aria-label="ISEYC department workspaces">
   {departments.map(d=><Link key={d.slug} href={`/ops/departments/${d.slug}`} className={`group rounded-2xl border border-line border-l-4 ${d.tone} p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-800`}>
    <div className="flex items-start justify-between gap-3"><span className="font-mono text-xs font-bold text-gold-700">{d.number} / ISEYC</span><span className="text-lg font-semibold text-forest-900 group-hover:translate-x-1">↗</span></div>
    <h2 className="mt-5 font-serif text-2xl leading-tight text-forest-950">{d.name}</h2><p className="mt-2 text-sm font-semibold text-forest-800">{d.tag}</p><p className="mt-3 text-xs leading-5 text-ink-700">{d.focus}</p><span className="mt-5 inline-flex min-h-9 items-center rounded-lg bg-white/80 px-3 text-xs font-semibold text-forest-900">Open department desk →</span>
   </Link>)}
  </section>
  <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold-700">Shared operating foundation</p><h2 className="mt-1 font-serif text-xl text-forest-950">Department registers</h2></div><StatusBadge status={registersConfigured?"Configured · access unverified":"Not configured"}/></div>
   <p className="mt-2 text-sm leading-6 text-ink-600">{registersConfigured?"The application environment contains the programme and reporting database settings. Live access still requires a successful runtime check with the deployed integration.":"Programme and reporting registers are not fully configured in this application environment. No substitute records are shown."}</p>
   <div className="mt-4 grid gap-2 sm:grid-cols-2"><a href="https://app.notion.com/p/710e4831541243db8cc819e9671b13d5" target="_blank" rel="noreferrer" className="rounded-xl border border-line p-3 text-sm font-semibold text-forest-900 hover:bg-cream-50">Programmes & Work Register ↗</a><a href="https://app.notion.com/p/f36e2561072d4d05b9e056dc44fc1d8c" target="_blank" rel="noreferrer" className="rounded-xl border border-line p-3 text-sm font-semibold text-forest-900 hover:bg-cream-50">Department Reports & Scorecards ↗</a></div>
  </section>
  <section className="space-y-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold-700">Shared systems</p><h2 className="mt-1 font-serif text-xl text-forest-950">Operational readiness</h2></div>
   <div className="grid gap-3 md:grid-cols-2">{systems.map(x=><article key={x.name} className="rounded-2xl border border-line bg-white p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold text-forest-950">{x.name}</h3><StatusBadge status={x.state}/></div><p className="mt-2 text-xs leading-5 text-ink-600">{x.detail}</p><Link href={x.href} className="mt-3 inline-flex min-h-9 items-center text-xs font-semibold text-forest-800 underline">Open system →</Link></article>)}</div>
  </section>
  <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">Access and authority boundary</p><p className="mt-1 text-sm leading-6 text-amber-900">The current staff session is transitional shared-key access. Do not enter restricted personal, health, safeguarding, finance or disciplinary records. Creating a proposed programme or draft report does not approve it, release funds or authorise publication.</p></aside>
 </div>;
}
