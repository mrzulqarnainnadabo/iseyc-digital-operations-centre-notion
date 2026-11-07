const styles: Record<string, string> = {
  Operational: "border-success-200 bg-success-50 text-success",
  Partial: "border-warning-200 bg-warning-50 text-warning",
  "Not operational": "border-line bg-cream-50 text-ink-700",
  Published: "border-success-200 bg-success-50 text-success",
  Draft: "border-line bg-cream-50 text-ink-700",
  "Awaiting human review": "border-warning-200 bg-warning-50 text-warning",
  Verified: "border-success-200 bg-success-50 text-success",
  New: "border-forest-100 bg-forest-100 text-forest-900",
  "In review": "border-warning-200 bg-warning-50 text-warning",
  Approved: "border-success-200 bg-success-50 text-success",
  Archived: "border-line bg-cream-50 text-ink-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex min-h-[25px] items-center rounded-full border px-2.5 text-[11px] font-semibold ${styles[status] || "border-line bg-cream-50 text-ink-700"}`}>
      {status}
    </span>
  );
}
