"type SnapshotMetric = { label: string; value: string; unit: string; period: string; interval?: string; measurementType?: string };
type SnapshotRecord = {
  id: string;
  title: string;
  publisher: string;
  sourceId: string;
  sourceUrl: string;
  referencePeriod: string;
  retrievedAt: string;
  geography: { level: string; label: string };
  evidenceType: string;
  metrics: SnapshotMetric[];
  additionalMetrics?: SnapshotMetric[];
  interpretation: string;
  limitations: string[];
};
type SnapshotResponse = {
  contractVersion: string;
  status: "ok" | "empty" | "error";
  source: string;
  retrievedAt: string;
  recordCount: number;
  records: SnapshotRecord[];
  note: string;
  limitations: string[];
};

const OBSERVATORY_ORIGIN = "https://iseyc-civic-intelligence-observatory.vercel.app";

function isSnapshotRecord(value: unknown): value is SnapshotRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.title !== "string" ||
    typeof record.publisher !== "string" ||
    typeof record.sourceId !== "string" ||
    typeof record.sourceUrl !== "string" ||
    typeof record.referencePeriod !== "string" ||
    typeof record.retrievedAt !== "string" ||
    typeof record.evidenceType !== "string" ||
    typeof record.interpretation !== "string" ||
    !Array.isArray(record.metrics) ||
    !Array.isArray(record.limitations) ||
    !record.limitations.every((item) => typeof item === "string")
  ) return false;
  const geography = record.geography as Record<string, unknown> | null;
  if (!geography || typeof geography.level !== "string" || typeof geography.label !== "string") return false;
  try {
    if (new URL(record.sourceUrl).protocol !== "https:") return false;
  } catch {
    return false;
  }
  return record.metrics.every((metric) => {
    if (!metric || typeof metric !== "object") return false;
    const item = metric as Record<string, unknown>;
    return typeof item.label === "string" && typeof item.value === "string" &&
      typeof item.unit === "string" && typeof item.period === "string";
  });
}

async function getDepartmentSnapshots(departmentId: OpsDepartmentId): Promise<SnapshotResponse | null> {
  const configuredOrigin = process.env.INTELLIGENCE_OBSERVATORY_URL?.trim() || OBSERVATORY_ORIGIN;
  let origin: URL;
  try {
    origin = new URL(configuredOrigin);
  } catch {
    return null;
  }
  if (origin.protocol !== "https:" || origin.hostname !== new URL(OBSERVATORY_ORIGIN).hostname) return null;

  const url = new URL("/api/evidence/snapshots", origin);
  url.searchParams.set("departmentId", departmentId);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    const payload = await response.json() as Partial<SnapshotResponse>;
    if (
      payload.contractVersion !== "1.0.0" ||
      (payload.status !== "ok" && payload.status !== "empty") ||
      !Array.isArray(payload.records) ||
      !payload.records.every(isSnapshotRecord) ||
      typeof payload.retrievedAt !== "string" ||
      typeof payload.note !== "string"
    ) return null;
    return payload as SnapshotResponse;
  } catch {
    return null;
  }
}

function EvidenceCard({ record }: { record: SnapshotRecord }) {
  const metrics = [...record.metrics, ...(record.additionalMetrics || [])];
  return (
    <article className="rounded-xl border border-[#e1e5dc] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#8a6b34]">{record.evidenceType}</span>
        <span className="text-[10px] text-[#7a837c]">{record.referencePeriod}</span>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-[#173c30]">{record.title}</h3>
      <p className="mt-1 text-[11px] text-[#68736b]">{record.publisher} · {record.geography.label}</p>
      {metrics.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg bg-[#f5f6f2] p-3">
              <p className="text-lg font-semibold tabular-nums text-[#173c30]">{metric.value}</p>
              <p className="text-[11px] font-medium text-[#405449]">{metric.label}</p>
              <p className="mt-1 text-[10px] text-[#7a837c]">{metric.unit} · {metric.period}{metric.interval ? ` · ${metric.interval}` : ""}</p>
              {metric.measurementType ? <p className="mt-1 text-[10px] text-[#7a837c]">{metric.measurementType}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-[#59665d]">{record.interpretation}</p>
      <details className="mt-3 border-t border-[#edf0ea] pt-3">
        <summary className="min-h-9 cursor-pointer text-xs font-semibold text-[#194b3b]">Source limits and methodology</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[10px] leading-4 text-[#68736b]">
          {record.limitations.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
      <a className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]" href={record.sourceUrl} target="_blank" rel="noopener noreferrer">Open original source ↗</a>
    </article>
  );
}

export default async function DepartmentEvidencePanel({ departmentId }: { departmentId: OpsDepartmentId }) {
  const payload = await getDepartmentSnapshots(departmentId);
  return (
    <section id="evidence" className="scroll-mt-5 rounded-2xl border border-[#dce4dc] bg-[#f3f5f0] p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6b34]">Intelligence Observatory</p>
          <h2 className="mt-1 font-serif text-2xl text-[#173c30]">Evidence for this department</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#68736b]">Source-linked evidence to inform questions, priorities and programme design. It does not approve work or prove local delivery.</p>
        </div>
        <a href={OBSERVATORY_ORIGIN} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center text-xs font-bold text-[#194b3b]">Open Observatory ↗</a>
      </div>
      {!payload ? (
        <p role="status" className="mt-4 rounded-xl border border-dashed border-[#d7ddd4] bg-white p-4 text-xs leading-5 text-[#68736b]">Evidence service is unavailable or returned an invalid response. No figures are shown. Department planning can continue, but must not treat missing evidence as zero.</p>
      ) : payload.records.length === 0 ? (
        <p role="status" className="mt-4 rounded-xl border border-dashed border-[#d7ddd4] bg-white p-4 text-xs leading-5 text-[#68736b]">The Observatory responded successfully, but no snapshots are currently mapped to this department.</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">{payload.records.map((record) => <EvidenceCard key={record.id} record={record} />)}</div>
          <p className="mt-3 text-[10px] leading-4 text-[#68736b]">Observatory catalogue retrieved {payload.retrievedAt}. These are dated publisher-source transcriptions, not continuously refreshed feeds. {payload.note}</p>
        </>
      )}
    </section>
  );
}
