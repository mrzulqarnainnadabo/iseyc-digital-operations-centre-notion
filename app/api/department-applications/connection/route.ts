import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { verifyDepartmentApplicationsConnection } from "@/lib/notion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only integration diagnostic. It returns schema readiness only and
 * never reads or returns applicant records or personal information.
 */
export async function GET(_req: NextRequest) {
  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await verifyDepartmentApplicationsConnection();
    const ready = result.configured && result.accessible && result.schemaReady;
    return privateJson({ ok: ready, ...result }, {
      status: ready ? 200 : 503,
    });
  } catch {
    return privateJson({
      ok: false,
      configured: true,
      accessible: false,
      schemaReady: false,
      error: "The department applications source could not be verified. Check the server integration and database sharing.",
    }, { status: 503 });
  }
}
