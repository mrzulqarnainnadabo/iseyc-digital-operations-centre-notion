/**
 * Hosting portability inventory for IDCC.
 * Classifies modules for Cloudflare Workers / Netlify / Vercel readiness.
 * Does not claim a platform is production-ready without staging proof.
 */

export type PortabilityClass =
  | "A_portable_logic"
  | "B_node_dependent"
  | "C_hosting_dependent"
  | "D_external_integration"
  | "E_static_public";

export type ModuleInventoryItem = {
  path: string;
  classification: PortabilityClass;
  notes: string;
};

/**
 * Known inventory at the time of the quality programme.
 * Keep in sync when adding modules that change runtime assumptions.
 */
export const MODULE_INVENTORY: readonly ModuleInventoryItem[] = [
  { path: "lib/session-capabilities.ts", classification: "A_portable_logic", notes: "Pure capability matrix; no Node APIs." },
  { path: "lib/access-control.ts", classification: "A_portable_logic", notes: "Appointment RBAC pure functions; not yet bound to live sessions." },
  { path: "lib/department-operations.ts", classification: "A_portable_logic", notes: "Domain models and validation; env checks only at edges." },
  { path: "lib/departments.ts", classification: "A_portable_logic", notes: "Public department metadata." },
  { path: "lib/department-evidence-briefs.ts", classification: "A_portable_logic", notes: "Interpretation copy boundaries." },
  { path: "lib/council-roles.ts", classification: "A_portable_logic", notes: "Role templates only." },
  { path: "lib/mandate-records.ts", classification: "A_portable_logic", notes: "Public record mapping helpers." },
  { path: "lib/public-evidence.ts", classification: "A_portable_logic", notes: "Evidence presentation rules." },
  { path: "lib/legacy-session-boundary.ts", classification: "A_portable_logic", notes: "Visibility filters for legacy records." },
  { path: "lib/login-input.ts", classification: "A_portable_logic", notes: "Input validation." },
  { path: "lib/doc-permissions.ts", classification: "A_portable_logic", notes: "Permission string catalogue." },
  { path: "lib/private-response.ts", classification: "A_portable_logic", notes: "Cache-Control helpers for private JSON." },
  { path: "lib/nav.ts", classification: "A_portable_logic", notes: "Navigation constants." },
  { path: "lib/auth.ts", classification: "B_node_dependent", notes: "node:crypto HMAC + next/headers cookies." },
  { path: "lib/oidc-primitives.ts", classification: "B_node_dependent", notes: "node:crypto HMAC for identity proofs." },
  { path: "lib/pin-crypto.ts", classification: "B_node_dependent", notes: "scrypt PIN hashing; reserved for future individual PIN flow." },
  { path: "lib/google-oidc.ts", classification: "B_node_dependent", notes: "OIDC config + token exchange helpers." },
  { path: "lib/login-rate-limit.ts", classification: "B_node_dependent", notes: "In-memory rate limit; not multi-instance safe." },
  { path: "lib/request-security.ts", classification: "B_node_dependent", notes: "Request origin/security helpers." },
  { path: "lib/notion.ts", classification: "D_external_integration", notes: "Notion SDK; network-bound." },
  { path: "lib/notion-department-programmes.ts", classification: "D_external_integration", notes: "Programme register adapter." },
  { path: "lib/notion-department-workplans.ts", classification: "D_external_integration", notes: "Work-plan register adapter." },
  { path: "lib/notion-department-reports.ts", classification: "D_external_integration", notes: "Report register adapter." },
  { path: "lib/notion-registers.ts", classification: "D_external_integration", notes: "Shared operational registers." },
  { path: "lib/external-engagement.ts", classification: "D_external_integration", notes: "Partner/contact/invitation Notion paths." },
  { path: "lib/department-snapshots.ts", classification: "D_external_integration", notes: "Observatory snapshot fetch/validation." },
  { path: "public/iseyc-seal.svg", classification: "E_static_public", notes: "Frozen official seal asset." },
  { path: "components/PublicShell.tsx", classification: "E_static_public", notes: "Public chrome; no secrets." },
] as const;

export function inventoryByClass(classification: PortabilityClass): ModuleInventoryItem[] {
  return MODULE_INVENTORY.filter((item) => item.classification === classification);
}

export function nodeDependentModuleCount(): number {
  return inventoryByClass("B_node_dependent").length;
}
