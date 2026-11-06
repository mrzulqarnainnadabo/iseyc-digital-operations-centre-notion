const styles: Record<string, string> = {
  Operational: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Partial: "border-amber-200 bg-amber-50 text-amber-900",
  "Not operational": "border-slate-200 bg-slate-50 text-slate-700",
  Published: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Draft: "border-slate-200 bg-slate-50 text-slate-700",
  "Awaiting human review": "border-amber-200 bg-amber-50 text-amber-900",
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-900",
  New: "border-sky-200 bg-sky-50 text-sky-900",
  "In review": "border-amber-200 bg-amber-50 text-amber-900",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Archived: "border-slate-200 bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex min-h-[25px] items-center rounded-full border px-2.5 text-[11px] font-semibold ${styles[status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>
      {status}
    </span>
  );
}
