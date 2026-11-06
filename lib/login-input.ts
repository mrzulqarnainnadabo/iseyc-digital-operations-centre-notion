/**
 * Parse untrusted login JSON without assuming its shape or field types.
 * The shared staff key remains a transitional credential, not user identity.
 */
export function readStaffKeyInput(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const key = (body as Record<string, unknown>).key;
  if (typeof key !== "string") return null;
  const normalized = key.trim();
  if (normalized.length < 1 || normalized.length > 512) return null;
  return normalized;
}
