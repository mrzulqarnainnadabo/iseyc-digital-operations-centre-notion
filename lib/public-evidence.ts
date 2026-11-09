import type { Department } from "@/lib/departments";

export const evidenceClassifications = [
  { id: "published-public-data", label: "Published public data", note: "A public dataset or record. Publication alone does not establish that a figure is current or independently verified." },
  { id: "institutional-announcement", label: "Institutional announcement", note: "An announced plan or activity. An announcement is not proof of implementation." },
  { id: "community-report", label: "Community report", note: "An attributed local observation. A report does not establish population prevalence." },
  { id: "verified-implementation", label: "Verified implementation", note: "Use only when a documented verification method supports the specific implementation claim." },
] as const;

export type EvidenceClassification = (typeof evidenceClassifications)[number]["id"];

export const observatoryConnection = {
  status: "limited" as const,
  label: "Limited public Observatory data connected",
  endpoint: "GET /api/evidence/observations?indicatorId={allowlisted-indicator}",
  detail: "The live World Bank indicator endpoint is a two-series national pilot. A separate curated snapshot endpoint now supplies dated publisher records to all four department workspaces. These are distinct evidence types, not a broad live feed or state/LGA coverage.",
};

const OBSERVATORY_BASE_URL = "https://iseyc-civic-intelligence-observatory.vercel.app";
const WORLD_BANK_DATA_URLS = {
  "wb-nga-se-prm-enrr": "https://data.worldbank.org/indicator/SE.PRM.ENRR?locations=NG",
  "wb-nga-sh-dyn-mort": "https://data.worldbank.org/indicator/SH.DYN.MORT?locations=NG",
} as const;
const WORLD_BANK_API_URLS = {
  "wb-nga-se-prm-enrr": "https://api.worldbank.org/v2/country/NGA/indicator/SE.PRM.ENRR?format=json&per_page=30&date=2015%3A2024",
  "wb-nga-sh-dyn-mort": "https://api.worldbank.org/v2/country/NGA/indicator/SH.DYN.MORT?format=json&per_page=30&date=2015%3A2024",
} as const;
const WORLD_BANK_METHODOLOGY_REFS = {
  "wb-nga-se-prm-enrr": "WDI series typically draws on UNESCO UIS / national education data. Gross ratios can exceed 100%.",
  "wb-nga-sh-dyn-mort": "Often based on UN IGME modelled estimates underlying WDI.",
} as const;
const WORLD_BANK_DATASET_ID = "world-bank-wdi";
const CACHE_TTL_MS = 60 * 60 * 1000;
const FAILURE_CACHE_TTL_MS = 60 * 1000;
const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;

type IndicatorId = keyof typeof WORLD_BANK_DATA_URLS;
type ObservatoryObservation = {
  observationId: string;
  indicatorId: IndicatorId;
  datasetId: typeof WORLD_BANK_DATASET_ID;
  geoCode: "NGA";
  geoLevel: "national";
  referencePeriod: string;
  value: number;
  unit: string;
  sourceAttribution: string;
  sourceUrl: string;
  retrievedAt: string;
  publicationDate: string | null;
  qualityFlags: string[];
  methodologyRef: string;
  contractVersion: "1.0.0";
};

type ObservatoryResult = {
  status: "ready" | "stale" | "empty" | "unavailable" | "invalid" | "not-integrated";
  indicator?: { id: IndicatorId; title: string; unit: string; measurementType: string; sourcePublisher: string; sourceUrl: string; methodologyNotes: string; limitations: string[] };
  observations?: ObservatoryObservation[];
  retrievedAt?: string;
};
type CacheEntry = { checkedAt: number; expiresAt: number; result: ObservatoryResult };

declare global {
  // Bounded, per-runtime cache only. It is deliberately not persisted between serverless instances.
  var __idccPublicEvidenceCache: Map<IndicatorId, CacheEntry> | undefined;
  var __idccPublicEvidencePending: Map<IndicatorId, Promise<ObservatoryResult>> | undefined;
}

const evidenceCache = globalThis.__idccPublicEvidenceCache ?? (globalThis.__idccPublicEvidenceCache = new Map());
const pendingRefreshes = globalThis.__idccPublicEvidencePending ?? (globalThis.__idccPublicEvidencePending = new Map());

const departmentIndicators: Partial<Record<Department["slug"], IndicatorId>> = {
  education: "wb-nga-se-prm-enrr",
  health: "wb-nga-sh-dyn-mort",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function withReceiptFreshness(result: ObservatoryResult, now: number): ObservatoryResult {
  if ((result.status === "ready" || result.status === "empty") && result.retrievedAt &&
      now - Date.parse(result.retrievedAt) > MAX_RECEIPT_AGE_MS) {
    return { ...result, status: "stale" };
  }
  return result;
}

function invalidResponse(indicatorId: IndicatorId): ObservatoryResult {
  console.warn("[IDCC public evidence] Observatory v1 contract validation failed", { indicatorId });
  return { status: "invalid" };
}

async function refreshIndicator(indicatorId: IndicatorId): Promise<ObservatoryResult> {
  try {
    const endpoint = new URL("/api/evidence/observations", OBSERVATORY_BASE_URL);
    endpoint.searchParams.set("indicatorId", indicatorId);
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.warn("[IDCC public evidence] Observatory returned a non-success status", { indicatorId, status: response.status });
      return { status: "unavailable" };
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload) || payload.contractVersion !== "1.0.0" ||
        (payload.status !== "ok" && payload.status !== "empty") ||
        !isRecord(payload.indicator) || !Array.isArray(payload.observations) ||
        !isRecord(payload.receipt)) return invalidResponse(indicatorId);

    const indicator = payload.indicator;
    const expectedSource = WORLD_BANK_DATA_URLS[indicatorId];
    const expectedMethodologyRef = WORLD_BANK_METHODOLOGY_REFS[indicatorId];
    if (indicator.id !== indicatorId || indicator.sourceUrl !== expectedSource ||
        indicator.geoLevel !== "national" || indicator.geoCode !== "NGA" ||
        indicator.datasetId !== WORLD_BANK_DATASET_ID ||
        typeof indicator.title !== "string" || typeof indicator.unit !== "string" ||
        indicator.measurementType !== "estimated" || indicator.sourcePublisher !== "World Bank — World Development Indicators" ||
        indicator.methodologyNotes !== expectedMethodologyRef || !Array.isArray(indicator.limitations) ||
        !indicator.limitations.every((item) => typeof item === "string")) {
      return invalidResponse(indicatorId);
    }

    if (payload.observations.length > 30) return invalidResponse(indicatorId);
    const observations: ObservatoryObservation[] = [];
    const observationIds = new Set<string>();
    for (const candidate of payload.observations) {
      if (!isRecord(candidate) || candidate.indicatorId !== indicatorId ||
          typeof candidate.observationId !== "string" || candidate.observationId.length === 0 ||
          observationIds.has(candidate.observationId) || candidate.datasetId !== WORLD_BANK_DATASET_ID ||
          candidate.geoCode !== "NGA" || candidate.geoLevel !== "national" ||
          typeof candidate.referencePeriod !== "string" || !/^\d{4}$/.test(candidate.referencePeriod) ||
          typeof candidate.value !== "number" || !Number.isFinite(candidate.value) ||
          typeof candidate.unit !== "string" || candidate.unit !== indicator.unit ||
          candidate.sourceAttribution !== indicator.sourcePublisher || candidate.sourceUrl !== expectedSource ||
          !isDate(candidate.retrievedAt) || (candidate.publicationDate !== null && !isDate(candidate.publicationDate)) ||
          !Array.isArray(candidate.qualityFlags) || !candidate.qualityFlags.every((flag) => typeof flag === "string") ||
          !candidate.qualityFlags.includes("estimated") || !candidate.qualityFlags.includes("national-only") ||
          candidate.methodologyRef !== expectedMethodologyRef || candidate.contractVersion !== "1.0.0") {
        return invalidResponse(indicatorId);
      }
      observationIds.add(candidate.observationId);
      observations.push(candidate as ObservatoryObservation);
    }

    const expectedStatus = observations.length ? "ok" : "empty";
    const expectedOutcome = observations.length ? "success" : "empty";
    if (payload.status !== expectedStatus || payload.receipt.indicatorId !== indicatorId ||
        payload.receipt.datasetId !== WORLD_BANK_DATASET_ID ||
        payload.receipt.sourceUrl !== WORLD_BANK_API_URLS[indicatorId] ||
        payload.receipt.observationCount !== observations.length || payload.receipt.outcome !== expectedOutcome ||
        payload.receipt.httpStatus !== 200 || payload.receipt.errorClass !== null ||
        payload.receipt.contractVersion !== "1.0.0" || !isDate(payload.receipt.retrievedAt)) {
      return invalidResponse(indicatorId);
    }

    const result: ObservatoryResult = {
      status: observations.length ? "ready" : "empty",
      indicator: indicator as ObservatoryResult["indicator"],
      observations: observations.sort((a, b) => a.referencePeriod.localeCompare(b.referencePeriod)),
      retrievedAt: payload.receipt.retrievedAt,
    };
    return withReceiptFreshness(result, Date.now());
  } catch {
    console.warn("[IDCC public evidence] Observatory refresh failed", { indicatorId, reason: "timeout-or-network-error" });
    return { status: "unavailable" };
  }
}

/** Fetches a single public pilot series; the host and IDs are allowlisted, with no Next.js stale cache. */
export async function getDepartmentEvidence(departmentSlug: Department["slug"]): Promise<ObservatoryResult> {
  const indicatorId = departmentIndicators[departmentSlug];
  if (!indicatorId) return { status: "not-integrated" };

  const now = Date.now();
  const cached = evidenceCache.get(indicatorId);
  if (cached && now < cached.expiresAt) return withReceiptFreshness(cached.result, now);

  const pending = pendingRefreshes.get(indicatorId);
  if (pending) return pending;

  const refresh = refreshIndicator(indicatorId);
  pendingRefreshes.set(indicatorId, refresh);
  try {
    const result = await refresh;
    const checkedAt = Date.now();
    const failure = result.status === "unavailable" || result.status === "invalid";
    evidenceCache.set(indicatorId, {
      checkedAt,
      expiresAt: checkedAt + (failure ? FAILURE_CACHE_TTL_MS : CACHE_TTL_MS),
      result,
    });
    // Once a cache entry expires, a failed refresh returns an explicit error state, never expired data.
    return result;
  } finally {
    pendingRefreshes.delete(indicatorId);
  }
}


export type DepartmentSnapshotMetric = {
  label: string;
  value: string;
  unit: string;
  period: string;
  measurementType?: string | null;
};
export type DepartmentSnapshotRecord = {
  id: string;
  title: string;
  publisher: string;
  sourceId: string;
  sourceUrl: string;
  referencePeriod: string;
  retrievedAt: string;
  geography: { level: string; label: string };
  evidenceType: string;
  metrics: DepartmentSnapshotMetric[];
  limitations: string[];
  interpretation: string;
};
export type DepartmentSnapshotFeed = {
  status: "ready" | "empty" | "unavailable" | "invalid" | "not-integrated";
  records: DepartmentSnapshotRecord[];
  retrievedAt?: string;
  note?: string;
};

const SNAPSHOT_API = "https://iseyc-civic-intelligence-observatory.vercel.app/api/evidence/snapshots";
const SNAPSHOT_DEPARTMENTS: Partial<Record<Department["slug"], string>> = {
  education: "education",
  health: "health",
  technology: "software-technology",
  civic: "civic",
};
const SNAPSHOT_SOURCE_HOSTS: Record<string, string> = {
  "who-gho-nigeria": "www.who.int",
  "nimc-enrolment-oct-2025": "nimc.gov.ng",
  "nitda-dl4all-dashboard": "dashboard.digitalliteracy.nitda.gov.ng",
  "naseni-innovation-hub": "innovation.naseni.gov.ng",
  "nbs-gdp-quarterly": "microdata.nigerianstat.gov.ng",
  "isn-hub-assessment-2026": "isnhubs.org.ng",
  "fme-annual-school-census": "emis.education.gov.ng",
  "worldbank-ndu-2026-10": "www.worldbank.org",
};
const SNAPSHOT_CACHE_MS = 15 * 60 * 1000;
const SNAPSHOT_FAILURE_CACHE_MS = 60 * 1000;
type SnapshotCacheEntry = { expiresAt: number; result: DepartmentSnapshotFeed };
declare global {
  var __idccDepartmentSnapshotCache: Map<string, SnapshotCacheEntry> | undefined;
  var __idccDepartmentSnapshotPending: Map<string, Promise<DepartmentSnapshotFeed>> | undefined;
}
const departmentSnapshotCache = globalThis.__idccDepartmentSnapshotCache ?? (globalThis.__idccDepartmentSnapshotCache = new Map());
const departmentSnapshotPending = globalThis.__idccDepartmentSnapshotPending ?? (globalThis.__idccDepartmentSnapshotPending = new Map());

function validSnapshotRecord(value: unknown, departmentId: string): value is DepartmentSnapshotRecord {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string" ||
      typeof value.publisher !== "string" || typeof value.sourceId !== "string" ||
      typeof value.sourceUrl !== "string" || typeof value.referencePeriod !== "string" ||
      typeof value.retrievedAt !== "string" || !isDate(value.retrievedAt) ||
      !isRecord(value.geography) || typeof value.geography.level !== "string" ||
      typeof value.geography.label !== "string" || typeof value.evidenceType !== "string" ||
      !Array.isArray(value.metrics) || value.metrics.length < 1 || value.metrics.length > 20 ||
      !Array.isArray(value.limitations) || value.limitations.length < 1 ||
      typeof value.interpretation !== "string") return false;
  const expectedHost = SNAPSHOT_SOURCE_HOSTS[value.sourceId];
  if (!expectedHost) return false;
  try {
    const source = new URL(value.sourceUrl);
    if (source.protocol !== "https:" || source.hostname !== expectedHost) return false;
  } catch { return false; }
  const assigned = typeof value.departmentId === "string"
    ? [value.departmentId]
    : Array.isArray(value.departmentIds) ? value.departmentIds : [];
  if (!assigned.includes(departmentId)) return false;
  return value.metrics.every((metric) => isRecord(metric) &&
    typeof metric.label === "string" && typeof metric.value === "string" &&
    typeof metric.unit === "string" && typeof metric.period === "string" &&
    (metric.measurementType === undefined || typeof metric.measurementType === "string")) &&
    value.limitations.every((item) => typeof item === "string" && item.length <= 2000);
}

async function refreshDepartmentSnapshots(departmentId: string, fetchImpl: typeof fetch): Promise<DepartmentSnapshotFeed> {
  try {
    const endpoint = new URL(SNAPSHOT_API);
    endpoint.searchParams.set("departmentId", departmentId);
    const response = await fetchImpl(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { status: "unavailable", records: [] };
    const payload: unknown = await response.json();
    if (!isRecord(payload) || payload.contractVersion !== "1.0.0" ||
        payload.source !== "iseyc-observatory-national-snapshots-v1" ||
        (payload.status !== "ok" && payload.status !== "empty") ||
        !Array.isArray(payload.records) || payload.records.length > 12) {
      return { status: "invalid", records: [] };
    }
    const records: DepartmentSnapshotRecord[] = [];
    const ids = new Set<string>();
    for (const item of payload.records) {
      if (!validSnapshotRecord(item, departmentId) || ids.has(item.id)) return { status: "invalid", records: [] };
      ids.add(item.id);
      records.push(item);
    }
    if (payload.status === "ok" && records.length === 0) return { status: "invalid", records: [] };
    if (payload.status === "empty" && records.length > 0) return { status: "invalid", records: [] };
    return {
      status: records.length ? "ready" : "empty",
      records,
      retrievedAt: typeof payload.retrievedAt === "string" && isDate(payload.retrievedAt) ? payload.retrievedAt : undefined,
      note: typeof payload.note === "string" ? payload.note : undefined,
    };
  } catch {
    return { status: "unavailable", records: [] };
  }
}

/** Dated publisher snapshots for the selected department; invalid or missing feeds never become zeroes or demo data. */
export async function getDepartmentSnapshots(
  departmentSlug: Department["slug"],
  fetchImpl: typeof fetch = fetch,
): Promise<DepartmentSnapshotFeed> {
  const departmentId = SNAPSHOT_DEPARTMENTS[departmentSlug];
  if (!departmentId) return { status: "not-integrated", records: [] };
  const now = Date.now();
  const cached = departmentSnapshotCache.get(departmentId);
  if (cached && now < cached.expiresAt) return cached.result;
  const inflight = departmentSnapshotPending.get(departmentId);
  if (inflight) return inflight;
  const work = refreshDepartmentSnapshots(departmentId, fetchImpl);
  departmentSnapshotPending.set(departmentId, work);
  try {
    const result = await work;
    const failure = result.status === "unavailable" || result.status === "invalid";
    departmentSnapshotCache.set(departmentId, {
      expiresAt: Date.now() + (failure ? SNAPSHOT_FAILURE_CACHE_MS : SNAPSHOT_CACHE_MS),
      result,
    });
    return result;
  } finally {
    departmentSnapshotPending.delete(departmentId);
  }
}
