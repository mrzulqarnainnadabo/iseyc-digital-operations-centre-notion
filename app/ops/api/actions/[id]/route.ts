import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireCapability } from "@/lib/require-capability";
import { isSameOriginRequest } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Progress writes are deliberately paused until the authenticated session
 * identifies an individual officer and the action is assigned to that
 * verified identity. A shared staff key cannot establish either fact.
 */
export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const access = await requireCapability("ops.action.progress");
  if (!access.ok) return access.response;

  return privateJson(
    {
      ok: false,
      code: "ACTION_AUTHORITY_UNAVAILABLE",
      error: "Individual officer identity and verified action assignment are not connected. Shared staff access cannot attribute progress to a responsible person. No action record was changed.",
    },
    { status: 503 }
  );
}
