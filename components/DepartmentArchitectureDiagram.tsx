export default function DepartmentArchitectureDiagram() {
  return (
    <section
      aria-label="ISEYC departmental architecture"
      className="rounded-card border border-forest-900 bg-forest-950 p-4 text-white shadow-card sm:p-6"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-400">
        Institutional structure
      </p>
      <h2 className="mt-1 font-serif text-xl sm:text-2xl">Departmental operating system</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
        Code diagram of live versus unconfigured layers. No invented programmes or appointments.
      </p>

      <ol className="mt-5 space-y-3 text-sm">
        <li className="rounded-control border border-white/15 bg-white/5 px-3 py-2">
          <span className="font-semibold text-gold-400">1 · National coordination</span>
          <span className="mt-1 block text-white/80">ISEYC Digital Operations Centre</span>
        </li>
        <li className="rounded-control border border-white/15 bg-white/5 px-3 py-2">
          <span className="font-semibold text-gold-400">2 · Four departments</span>
          <span className="mt-1 block text-white/80">
            Education · Health · Digital Systems · Civic Affairs
          </span>
        </li>
        <li className="rounded-control border border-white/15 bg-white/5 px-3 py-2">
          <span className="font-semibold text-gold-400">3 · Department functions</span>
          <span className="mt-1 block text-white/80">
            Mandate, boundaries, activities, outputs, coordination partners
          </span>
        </li>
        <li className="rounded-control border border-amber-300/30 bg-amber-950/40 px-3 py-2">
          <span className="font-semibold text-amber-100">4 · Programmes · Work plans · Reports</span>
          <span className="mt-1 block text-amber-50/90">
            API implemented · Requires NOTION_DEPARTMENT_*_DATABASE_ID and integration share
          </span>
        </li>
        <li className="rounded-control border border-emerald-300/25 bg-emerald-950/30 px-3 py-2">
          <span className="font-semibold text-emerald-100">5 · Shared registers (live Partial)</span>
          <span className="mt-1 block text-emerald-50/90">
            Actions · Meetings · Communications · Chamber · External engagement
          </span>
        </li>
      </ol>

      <p className="mt-4 text-xs leading-5 text-white/60">
        Authority boundary: shared-key sessions may create Draft/Planning programme records and Planned
        work items only. Approval, publication, dispatch and formal closure remain disabled.
      </p>
    </section>
  );
}
