import type { Department } from "@/lib/departments";

const MANDATE_BASE_URL = "https://2027-street-mandate.vercel.app";
const CONTRACT = "0.1.0";
const PAGE_SIZE = 20;
const CACHE_TTL_MS = 10 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;

/**
 * Provisional keyword hints for pilot routing only.
 * Not an institutional duty taxonomy. Prefer a reviewed duty field when available.
 */
const departmentHints: Record<Department["slug"], string[]> = {
  education: ["education", "school", "teacher", "literacy", "learning", "youth development", "apprenticeship", "skills", "training"],
  health: ["health", "hospital", "clinic", "medicine", "maternal", "medical", "well-being", "wellbeing"],
  technology: ["digital infrastructure", "digital", "technology", "software", "connectivity", "internet", "ict"],
  civic: ["civic", "security", "governance", "accountability", "road", "transport", "power", "water", "public service", "justice"],
};

const DEPARTMENT_ORDER: Department["slug"][] = ["education", "health", "technology", "civic"];

export type MandatePublicRecord = {
  id: string;
  text: string;
  duty: string | null;
  sector: string | null;
  state: string | null;
  lga: string | null;
  verificationStatus: string;
  publicationStatus: string;
  createdAt: string | null;
};

export type MandateDepartmentFeed = {
  status: "ready" | "empty" | "unavailable" | "invalid";
  records: MandatePublicRecord[];
  totalPublished: number | null;
  truncatedUpstream: boolean;
  retrievedAt: string | null;
  prevalenceNote: string;
  /** Always provisional until a reviewed Mandate duty taxonomy exists. */
  matchingMode: "provisional-keyword";
  classificationNote: string;
};

type CacheEntry = { expiresAt: number; feed: MandateDepartmentFeed };

declare global {
  var __idccMandateFeedCache: Map<string, CacheEntry> | undefined;
  var __idccMandateFeedPending: Map<string, Promise<MandateDepartmentFeed>> | undefined;
}

const cache = globalThis.__idccMandateFeedCache ?? (globalThis.__idccMandateFeedCache = new Map());
const pending = globalThis.__idccMandateFeedPending ?? (globalThis.__idccMandateFeedPending = new Map());

const CLASSIFICATION_NOTE =
  "Records are shown here using provisional keyword matching against published text and duty labels. This is not an official ISEYC department taxonomy. A record is listed under at most one primary department.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scoreDepartment(record: MandatePublicRecord, slug: Department["slug"]): number {
  const hints = departmentHints[slug];
  const duty = (record.duty ?? "").toLowerCase();
  const sector = (record.sector ?? "").toLowerCase();
  const text = record.text.toLowerCase();
  let score = 0;
  for (const hint of hints) {
    if (duty.includes(hint)) score += 4;
    if (sector.includes(hint)) score += 3;
    if (text.includes(hint)) score += 1;
  }
  return score;
}

/** Exclusive primary department: highest score wins; ties break by department order. */
function primaryDepartment(record: MandatePublicRecord): Department["slug"] | null {
  let best: Department["slug"] | null = null;
  let bestScore = 0;
  for (const slug of DEPARTMENT_ORDER) {
    const score = scoreDepartment(record, slug);
    if (score > bestScore) {
      bestScore = score;
      best = slug;
    }
  }
  return bestScore > 0 ? best : null;
}

function parseRecord(candidate: unknown): MandatePublicRecord | null {
  if (!isRecord(candidate)) return null;
  if (candidate.publicationStatus !== "published") return null;
  if (typeof candidate.id !== "string" || !candidate.id) return null;
  if (typeof candidate.text !== "string" || !candidate.text.trim()) return null;
  return {
    id: candidate.id,
    text: candidate.text.trim().slice(0, 500),
    duty: typeof candidate.duty === "string" ? candidate.duty : null,
    sector: typeof candidate.sector === "string" ? candidate.sector : null,
    state: typeof candidate.state === "string" ? candidate.state : null,
    lga: typeof candidate.lga === "string" ? candidate.lga : null,
    verificationStatus: typeof candidate.verificationStatus === "string" ? candidate.verificationStatus : "unverified",
    publicationStatus: "published",
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : null,
  };
}

function emptyFeed(
  status: MandateDepartmentFeed["status"],
  prevalenceNote: string,
): MandateDepartmentFeed {
  return {
    status,
    records: [],
    totalPublished: null,
    truncatedUpstream: false,
    retrievedAt: null,
    prevalenceNote,
    matchingMode: "provisional-keyword",
    classificationNote: CLASSIFICATION_NOTE,
  };
}

async function refreshDepartmentRecords(slug: Department["slug"]): Promise<MandateDepartmentFeed> {
  const prevalenceNote =
    "These are published Civic Mandate records only. They are not a measure of national need, prevalence or public opinion.";
  try {
    const endpoint = new URL("/api/v1/community-records", MANDATE_BASE_URL);
    endpoint.searchParams.set("page", "1");
    endpoint.searchParams.set("pageSize", String(PAGE_SIZE));
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return emptyFeed("unavailable", prevalenceNote);

    const payload: unknown = await response.json();
    if (!isRecord(payload) || payload.contractVersion !== CONTRACT || payload.publicationBoundary !== "published-only") {
      return emptyFeed("invalid", prevalenceNote);
    }
    if (!Array.isArray(payload.records)) return emptyFeed("invalid", prevalenceNote);

    const parsed: MandatePublicRecord[] = [];
    for (const item of payload.records) {
      const record = parseRecord(item);
      if (record) parsed.push(record);
    }

    const matched = parsed.filter((record) => primaryDepartment(record) === slug).slice(0, 6);
    const totalPublished = typeof payload.total === "number" && Number.isFinite(payload.total) ? payload.total : null;
    const truncatedUpstream = payload.truncatedUpstream === true;

    return {
      status: matched.length ? "ready" : "empty",
      records: matched,
      totalPublished,
      truncatedUpstream,
      retrievedAt: new Date().toISOString(),
      prevalenceNote: typeof payload.prevalenceNote === "string" ? payload.prevalenceNote : prevalenceNote,
      matchingMode: "provisional-keyword",
      classificationNote: CLASSIFICATION_NOTE,
    };
  } catch {
    return emptyFeed("unavailable", prevalenceNote);
  }
}

/** Published-only Mandate records with provisional exclusive keyword routing. Fail-closed on contract mismatch. */
export async function getDepartmentMandateRecords(slug: Department["slug"]): Promise<MandateDepartmentFeed> {
  const now = Date.now();
  const cached = cache.get(slug);
  if (cached && now < cached.expiresAt) return cached.feed;

  const inflight = pending.get(slug);
  if (inflight) return inflight;

  const work = refreshDepartmentRecords(slug);
  pending.set(slug, work);
  try {
    const feed = await work;
    const failure = feed.status === "unavailable" || feed.status === "invalid";
    cache.set(slug, { expiresAt: Date.now() + (failure ? FAILURE_TTL_MS : CACHE_TTL_MS), feed });
    return feed;
  } finally {
    pending.delete(slug);
  }
}
