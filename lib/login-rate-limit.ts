/**
 * Best-effort per-runtime sign-in failure throttling.
 *
 * This protects a warm application instance from repeated password guessing.
 * Serverless instances do not share memory: production must ALSO enforce a
 * distributed edge/WAF limit on POST /api/auth/login (Vercel Firewall,
 * Cloudflare WAF, or equivalent). Durable in-app limiting is not configured
 * in this module and must not be assumed across instances.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_CLIENTS = 5000;
const failures = new Map<string, { startedAt: number; count: number }>();

function prune(now: number) {
  for (const [key, entry] of failures) {
    if (now - entry.startedAt >= WINDOW_MS) failures.delete(key);
  }
}

export function isLoginRateLimited(clientIp: string): boolean {
  const entry = failures.get(clientIp);
  if (!entry) return false;
  if (Date.now() - entry.startedAt >= WINDOW_MS) {
    failures.delete(clientIp);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordLoginFailure(clientIp: string): void {
  const now = Date.now();
  let entry = failures.get(clientIp);
  if (!entry || now - entry.startedAt >= WINDOW_MS) {
    if (failures.size >= MAX_CLIENTS) {
      prune(now);
      if (failures.size >= MAX_CLIENTS) {
        const oldest = failures.keys().next().value;
        if (oldest) failures.delete(oldest);
      }
    }
    entry = { startedAt: now, count: 0 };
    failures.set(clientIp, entry);
  }
  entry.count += 1;
}

export function clearLoginFailures(clientIp: string): void {
  failures.delete(clientIp);
}
