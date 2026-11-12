import type { OpsDepartmentId } from "@/lib/department-operations";

const OBSERVATORY_URL = "https://iseyc-civic-intelligence-observatory.vercel.app";
const SNAPSHOT_SOURCE = "iseyc-observatory-curated-source-snapshots-v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;
const MAX_RECORDS = 20;
const MAX_OBSERVATIONS = 200;
const DEPARTMENT_TO_OBSERVATORY = {
  education: "education",
  health: "health",
  "digital-systems": "software-technology",
  "civic-affairs": "civic",
} as const;
const OBSERVATORY_TO_DEPARTMENT = {
  education: "education",
  health: "health",
  "software-technology": "digital-systems",
  civic: "civic-affairs",
} as const;
const DEPARTMENTS = Object.keys(DEPARTMENT_TO_OBSERVATORY) as OpsDepartmentId[];

export type DepartmentSnapshotMetric = {
  label: string;
  value: string;
  unit: string;
  period: string;
  measurementType: string;
};

export type DepartmentSnapshot = {
  id: string;
  departmentId: OpsDepartmentId;
  departmentIds: OpsDepartmentId[];
  title: string;
  publisher: string;
  sourceId: string;
  sourceUrl: string;
  referencePeriod: string;
  retrievedAt: string;
  sourceCheckedAt: string;
  sourceUpdateDate?: string;
  geography: { level: string; label: string };
  evidenceType: string;
  metrics: DepartmentSnapshotMetric[];
  limitations: string[];
  interpretation: string;
  recordStatus: "current" | "superseded";
  supersededBy?: string;
};

export type DepartmentSnapshotCatalogueEntry = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  status: "catalogue" | "partial" | "under_review";
  note: string;
};

export type DepartmentSnapshotReconciliationNote = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  action: string;
};

export type DepartmentSnapshotResult = {
  status: "ready" | "stale" | "empty" | "unavailable" | "invalid";
  records: DepartmentSnapshot[];
  totalRecords?: number;
  retrievedAt?: string;
  sourceCheckedAt?: string;
  note?: string;
  limitations?: string[];
  catalogue?: DepartmentSnapshotCatalogueEntry[];
  reconciliationNotes?: DepartmentSnapshotReconciliationNote[];
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

function isoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validObservation(value: unknown, departmentId: OpsDepartmentId): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const observatoryDepartment = DEPARTMENT_TO_OBSERVATORY[departmentId];
  const departments = value.departments;
  const status = value.recordStatus === undefined ? "current" : value.recordStatus;
  return nonEmpty(value.id) &&
    nonEmpty(value.title) &&
    typeof value.value === "number" && Number.isFinite(value.value) &&
    nonEmpty(value.unit) &&
    nonEmpty(value.referencePeriod) &&
    nonEmpty(value.measurementType) &&
    nonEmpty(value.sourceId) &&
    nonEmpty(value.sourcePublisher) &&
    httpsUrl(value.sourceUrl) &&
    ["national", "state", "varies"].includes(String(value.geoLevel)) &&
    nonEmpty(value.geographicCoverage) &&
    ["official_source", "published_research"].includes(String(value.sourceType)) &&
    Array.isArray(departments) && departments.length > 0 && departments.length <= 4 &&
    departments.every((item) => typeof item === "string" && item in OBSERVATORY_TO_DEPARTMENT) &&
    departments.includes(observatoryDepartment) &&
    Array.isArray(value.limitations) && value.limitations.length > 0 &&
    value.limitations.length <= 30 && value.limitations.every(nonEmpty) &&
    nonEmpty(value.interpretation) &&
    ["current", "superseded"].includes(String(status)) &&
    (value.supersededBy === undefined || nonEmpty(value.supersededBy)) &&
    (value.sourceUpdateDate === undefined || isoDate(value.sourceUpdateDate));
}

function validCatalogueEntry(value: unknown, departmentId: OpsDepartmentId): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return nonEmpty(value.id) &&
    nonEmpty(value.title) &&
    nonEmpty(value.publisher) &&
    httpsUrl(value.url) &&
    ["catalogue", "partial", "under_review"].includes(String(value.status)) &&
    nonEmpty(value.note) &&
    Array.isArray(value.departments) && value.departments.length > 0 &&
    value.departments.every((item) => typeof item === "string" && item in OBSERVATORY_TO_DEPARTMENT) &&
    value.departments.includes(DEPARTMENT_TO_OBSERVATORY[departmentId]);
}

function validReconciliationNote(value: unknown): value is DepartmentSnapshotReconciliationNote {
  return isRecord(value) &&
    nonEmpty(value.id) &&
    ["high", "medium", "low"].includes(String(value.severity)) &&
    nonEmpty(value.title) &&
    nonEmpty(value.detail) &&
    nonEmpty(value.action);
}

function relevantReconciliationNotes(
  notes: DepartmentSnapshotReconciliationNote[],
  departmentId: OpsDepartmentId,
): DepartmentSnapshotReconciliationNote[] {
  const terms: Record<OpsDepartmentId, RegExp> = {
    education: /education|school|teacher|learning|digital literacy/i,
    health: /health|phc|medicine|maternal|mortality|facility/i,
    "digital-systems": /digital|technology|broadband|internet|telecom|literacy/i,
    "civic-affairs": /budget|revenue|expenditure|fiscal|governance|transparency|accountability/i,
  };
  return notes.filter((note) => terms[departmentId].test(
    [note.id, note.title, note.detail].join(" "),
  ));
}

function mapObservation(
  value: Record<string, unknown>,
  departmentId: OpsDepartmentId,
  sourceCheckedAt: string,
  retrievedAt: string,
): DepartmentSnapshot {
  const departments = (value.departments as Array<keyof typeof OBSERVATORY_TO_DEPARTMENT>)
    .map((item) => OBSERVATORY_TO_DEPARTMENT[item]);
  return {
    id: String(value.id),
    departmentId,
    departmentIds: departments,
    title: String(value.title),
    publisher: String(value.sourcePublisher),
    sourceId: String(value.sourceId),
    sourceUrl: String(value.sourceUrl),
    referencePeriod: String(value.referencePeriod),
    retrievedAt,
    sourceCheckedAt,
    ...(isoDate(value.sourceUpdateDate) ? { sourceUpdateDate: value.sourceUpdateDate } : {}),
    geography: { level: String(value.geoLevel), label: String(value.geographicCoverage) },
    evidenceType: String(value.sourceType),
    metrics: [{
      label: "Reported value",
      value: String(value.value),
      unit: String(value.unit),
      period: String(value.referencePeriod),
      measurementType: String(value.measurementType),
    }],
    limitations: (value.limitations as string[]).slice(0, 12),
    interpretation: String(value.interpretation),
    recordStatus: value.recordStatus === "superseded" ? "superseded" : "current",
    ...(nonEmpty(value.supersededBy) ? { supersededBy: value.supersededBy } : {}),
  };
}

function invalid(): DepartmentSnapshotResult {
  return { status: "invalid", records: [] };
}

async function loadSnapshots(departmentId: OpsDepartmentId): Promise<DepartmentSnapshotResult> {
  try {
    const url = new URL("/api/evidence/source-snapshots", OBSERVATORY_URL);
    url.searchParams.set("departmentId", DEPARTMENT_TO_OBSERVATORY[departmentId]);
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
      (payload.status !== "curated" && payload.status !== "empty") ||
      !Number.isInteger(payload.recordCount) ||
      !Array.isArray(payload.observations) ||
      payload.observations.length > MAX_OBSERVATIONS ||
      payload.recordCount !== payload.observations.length ||
      !isoDate(payload.checkedAt) ||
      !Array.isArray(payload.catalogOnlySources) ||
      payload.catalogOnlySources.length > 100 ||
      !Array.isArray(payload.reconciliationNotes) ||
      payload.reconciliationNotes.length > 50 ||
      !Array.isArray(payload.limitations) ||
      payload.limitations.length === 0 ||
      payload.limitations.length > 20 ||
      !payload.limitations.every(nonEmpty)) return invalid();

    const retrievedAt = new Date().toISOString();
    const sourceCheckedAt = payload.checkedAt;
    const rawNotes = payload.reconciliationNotes;
    if (!rawNotes.every(validReconciliationNote)) return invalid();
    const rawCatalogue = payload.catalogOnlySources;
    if (!rawCatalogue.every((item) => validCatalogueEntry(item, departmentId))) return invalid();
    const rawObservations = payload.observations;
    if (!rawObservations.every((item) => validObservation(item, departmentId))) return invalid();

    const current = rawObservations
      .filter((item) => item.recordStatus !== "superseded")
      .map((item) => mapObservation(item, departmentId, sourceCheckedAt, retrievedAt));
    const records = current.slice(0, MAX_RECORDS);
    const notes = relevantReconciliationNotes(rawNotes, departmentId);
    const catalogue = rawCatalogue.map((item) => ({
      id: String(item.id),
      title: String(item.title),
      publisher: String(item.publisher),
      url: String(item.url),
      status: item.status as DepartmentSnapshotCatalogueEntry["status"],
      note: String(item.note),
    }));
    const stale = Date.now() - Date.parse(sourceCheckedAt + "T00:00:00Z") > 7 * 24 * 60 * 60 * 1000;
    const status = records.length ? (stale ? "stale" : "ready") : "empty";
    return {
      status,
      records,
      totalRecords: current.length,
      retrievedAt,
      sourceCheckedAt,
      note: "Curated, dated Observatory transcriptions. They are not live publisher feeds or proof of local service delivery.",
      limitations: (payload.limitations as string[]).slice(0, 8),
      catalogue,
      reconciliationNotes: notes,
    };
  } catch {
    return { status: "unavailable", records: [] };
  }
}

/** Read-only, server-side retrieval from the Observatory's source-attributed v1 snapshot contract. */
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
