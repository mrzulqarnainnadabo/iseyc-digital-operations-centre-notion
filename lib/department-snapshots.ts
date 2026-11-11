import type { OpsDepartmentId } from "@/lib/department-operations";

const OBSERVATORY_URL = "https://iseyc-civic-intelligence-observatory.vercel.app";
const SNAPSHOT_SOURCE = "iseyc-observatory-national-snapshots-v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;
const MAX_RECORDS = 20;
const DEPARTMENTS: OpsDepartmentId[] = [
  "education",
  "health",
  "digital-systems",
  "civic-affairs",
];

export type DepartmentSnapshotMetric = {
  label: string;
  value: string;
  unit: string;
  period: string;
  measurementType: string;
  interval?: string;
};

export type DepartmentSnapshot = {
  id: string;
  departmentId?: string | null;
  departmentIds?: string[];
  title: string;
  publisher: string;
  sourceId: string;
  sourceUrl: string;
  referencePeriod: string;
  retrievedAt: string;
  geography: { level: string; label: string; code?: string | null };
  evidenceType: string;
  metrics: DepartmentSnapshotMetric[];
  additionalMetrics?: DepartmentSnapshotMetric[];
  limitations: string[];
  interpretation?: string;
  relatedSources?: { title: string; url: string }[];
};

export type DepartmentSnapshotResult = {
  status: "ready" | "stale" | "empty" | "unavailable" | "invalid";
  records: DepartmentSnapshot[];
  retrievedAt?: string;
  note?: string;
  limitations?: string[];
};

type CacheEntry = { expiresAt: number; result: DepartmentSnapshotResult };
const cache = new Map<OpsDepartmentId, CacheEntry>();
const pending = new Map<OpsDepartmentId, Promise<DepartmentSnapshotResult>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function httpsUrl(value: unknown): value is string {
  if (!nonEmpty(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validMetric(value: unknown): value is DepartmentSnapshotMetric {
  if (!isRecord(value)) return false;
  return nonEmpty(value.label) &&
    typeof value.value === "string" &&
    nonEmpty(value.unit) &&
    nonEmpty(value.period) &&
    nonEmpty(value.measurementType) &&
    (value.interval === undefined || typeof value.interval === "string");
}

function validRecord(value: unknown, departmentId: OpsDepartmentId): value is DepartmentSnapshot {
  if (!isRecord(value)) return false;
  const geography = value.geography;
  const departmentIdValid = value.departmentId === undefined || value.departmentId === null || nonEmpty(value.departmentId);
  const departmentIdsValid = value.departmentIds === undefined || (Array.isArray(value.departmentIds) && value.departmentIds.length <= 4 && value.departmentIds.every(nonEmpty));
  const departments = [
    ...(nonEmpty(value.departmentId) ? [value.departmentId] : []),
    ...(Array.isArray(value.departmentIds) ? value.departmentIds : []),
  ];
  const matchesDepartment = departmentIdValid && departmentIdsValid && departments.includes(departmentId);
  const metricsValid = Array.isArray(value.metrics) &&
    value.metrics.length > 0 &&
    value.metrics.length <= 20 &&
    value.metrics.every(validMetric);
  const additionalValid = value.additionalMetrics === undefined ||
    (Array.isArray(value.additionalMetrics) &&
      value.additionalMetrics.length <= 20 &&
      value.additionalMetrics.every(validMetric));
  const relatedValid = value.relatedSources === undefined ||
    (Array.isArray(value.relatedSources) &&
      value.relatedSources.length <= 10 &&
      value.relatedSources.every((item) =>
        isRecord(item) && nonEmpty(item.title) && httpsUrl(item.url)
      ));
  return nonEmpty(value.id) &&
    matchesDepartment &&
    nonEmpty(value.title) &&
    nonEmpty(value.publisher) &&
    nonEmpty(value.sourceId) &&
    httpsUrl(value.sourceUrl) &&
    nonEmpty(value.referencePeriod) &&
    nonEmpty(value.retrievedAt) &&
    Number.isFinite(Date.parse(value.retrievedAt)) &&
    isRecord(geography) &&
    nonEmpty(geography.level) &&
    nonEmpty(geography.label) &&
    (geography.code === undefined || geography.code === null || typeof geography.code === "string") &&
    nonEmpty(value.evidenceType) &&
    metricsValid &&
    additionalValid &&
    Array.isArray(value.limitations) &&
    value.limitations.length > 0 &&
    value.limitations.length <= 30 &&
    value.limitations.every(nonEmpty) &&
    (value.interpretation === undefined || typeof value.interpretation === "string") &&
    relatedValid;
}

function invalid(): DepartmentSnapshotResult {
  return { status: "invalid", records: [] };
}

async function loadSnapshots(departmentId: OpsDepartmentId): Promise<DepartmentSnapshotResult> {
  try {
    const url = new URL("/api/evidence/snapshots", OBSERVATORY_URL);
    url.searchParams.set("departmentId", departmentId);
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { status: "unavailable", records: [] };

    const payload: unknown = await response.json();
    if (!isRecord(payload) ||
      payload.contractVersion !== "1.0.0" ||
      payload.source !== SNAPSHOT_SOURCE ||
      (payload.status !== "ok" && payload.status !== "empty") ||
      !Number.isInteger(payload.recordCount) ||
      !Array.isArray(payload.records) ||
      payload.records.length > MAX_RECORDS ||
      payload.recordCount !== payload.records.length ||
      !nonEmpty(payload.retrievedAt) ||
      !Number.isFinite(Date.parse(payload.retrievedAt)) ||
      !nonEmpty(payload.note) ||
      !Array.isArray(payload.limitations) ||
      payload.limitations.length > 10 ||
      !payload.limitations.every(nonEmpty)) return invalid();

    if (payload.status === "empty") {
      if (payload.records.length !== 0) return invalid();
      return {
        status: "empty",
        records: [],
        retrievedAt: payload.retrievedAt,
        note: payload.note,
        limitations: payload.limitations,
      };
    }

    if (payload.records.length === 0 ||
      !payload.records.every((record) => validRecord(record, departmentId))) return invalid();

    const retrievedAt = payload.retrievedAt;
    const stale = Date.now() - Date.parse(retrievedAt) > 7 * 24 * 60 * 60 * 1000;
    return {
      status: stale ? "stale" : "ready",
      records: payload.records as DepartmentSnapshot[],
      retrievedAt,
      note: payload.note,
      limitations: payload.limitations,
    };
  } catch {
    return { status: "unavailable", records: [] };
  }
}

/** Read-only, server-side retrieval from the Observatory's curated department snapshot contract. */
export async function getDepartmentSnapshots(
  departmentId: OpsDepartmentId,
): Promise<DepartmentSnapshotResult> {
  if (!DEPARTMENTS.includes(departmentId)) return invalid();
  const now = Date.now();
  const cached = cache.get(departmentId);
  if (cached && now < cached.expiresAt) return cached.result;
  const active = pending.get(departmentId);
  if (active) return active;

  const request = loadSnapshots(departmentId);
  pending.set(departmentId, request);
  try {
    const result = await request;
    cache.set(departmentId, {
      expiresAt: Date.now() + (
        result.status === "unavailable" || result.status === "invalid"
          ? FAILURE_TTL_MS
          : CACHE_TTL_MS
      ),
      result,
    });
    return result;
  } finally {
    pending.delete(departmentId);
  }
}
