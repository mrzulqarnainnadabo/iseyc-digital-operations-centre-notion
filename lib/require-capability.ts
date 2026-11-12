import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import {
  denialReason,
  modeFromStaffSession,
  sessionAllows,
  type SessionCapability,
  type SessionMode,
} from "@/lib/session-capabilities";

export type CapabilityOk = { ok: true; mode: SessionMode };
export type CapabilityDenied = { ok: false; response: ReturnType<typeof privateJson> };

/**
 * Authenticate first, then authorize against the session capability matrix.
 * Shared staff never receives appointment-required capabilities.
 */
export async function requireCapability(
  capability: SessionCapability
): Promise<CapabilityOk | CapabilityDenied> {
  const verified = await requireStaffSession();
  const mode = modeFromStaffSession(verified);

  if (mode === "none") {
    return {
      ok: false,
      response: privateJson({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!sessionAllows(mode, capability)) {
    return {
      ok: false,
      response: privateJson(
        {
          ok: false,
          code: "CAPABILITY_DENIED",
          capability,
          error: denialReason(capability),
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, mode };
}
