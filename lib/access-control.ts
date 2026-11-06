import { isDocPermission } from "./doc-permissions";

/**
 * Server-side DOC authorization policy primitives.
 *
 * Callers must build this context only from trusted server-side records
 * (verified OIDC claims, restricted membership, appointment and delegation
 * sources). Never accept it from a browser request or infer authority from UI.
 */
export type MembershipStatus = "Pending" | "Approved" | "Rejected" | "Suspended" | "Expired";
export type MembershipRecord = {
  status: MembershipStatus;
  googleSubject: string;
  emailVerified: boolean;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
};
export type AppointmentRecord = {
  status: "Active" | "Inactive" | "Expired" | "Revoked";
  role: string;
  permissions: string[];
  scope: { type: "global" } | { type: "department"; departmentId: string };
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
};
export type MembershipDecision = "approve" | "reject" | "suspend" | "reinstate";
export type MembershipDelegation = {
  delegateGoogleSubject: string;
  grantedByGoogleSubject: string;
  decisionScopes: MembershipDecision[];
  effectiveFrom: string;
  effectiveUntil: string;
  revokedAt?: string | null;
};
export type AuthorizationContext = {
  googleSubject: string;
  membership: MembershipRecord | null;
  appointments: AppointmentRecord[];
  delegations: MembershipDelegation[];
  nationalPresidentGoogleSubject: string | null;
};
export type MembershipAccessResult =
  | { allowed: true }
  | { allowed: false; reason: "identity_unavailable" | "membership_missing" | "membership_not_active" | "identity_not_linked" | "email_not_verified" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dateIsActive(now: Date, startsAt?: string | null, endsAt?: string | null): boolean {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return false;
  for (const value of [startsAt, endsAt]) {
    if (value !== undefined && value !== null && typeof value !== "string") return false;
  }
  const nowMs = now.getTime();
  if (startsAt !== undefined && startsAt !== null) {
    const start = Date.parse(startsAt);
    if (!Number.isFinite(start) || nowMs < start) return false;
  }
  if (endsAt !== undefined && endsAt !== null) {
    const end = Date.parse(endsAt);
    if (!Number.isFinite(end) || nowMs > end) return false;
  }
  return true;
}

export function checkMemberAccess(context: AuthorizationContext, now = new Date()): MembershipAccessResult {
  if (!isRecord(context) || typeof context.googleSubject !== "string" || !context.googleSubject.trim()) {
    return { allowed: false, reason: "identity_unavailable" };
  }
  if (!isRecord(context.membership)) return { allowed: false, reason: "membership_missing" };
  const member = context.membership;
  if (member.status !== "Approved") return { allowed: false, reason: "membership_not_active" };
  if (member.emailVerified !== true) return { allowed: false, reason: "email_not_verified" };
  if (typeof member.googleSubject !== "string" || !member.googleSubject ||
      member.googleSubject !== context.googleSubject) {
    return { allowed: false, reason: "identity_not_linked" };
  }
  if (!dateIsActive(now, member.effectiveFrom as string | null | undefined,
      member.effectiveUntil as string | null | undefined)) {
    return { allowed: false, reason: "membership_not_active" };
  }
  return { allowed: true };
}

export type AuthorizationResourceScope =
  | { type: "global" }
  | { type: "department"; departmentId: string };

/**
 * Department appointments are usable only against the exact department
 * requested by the server-side resource handler. A global appointment must
 * be explicit in the trusted appointment record; it is never inferred from
 * a role title or a missing department identifier.
 */
export function hasOfficerPermission(
  context: AuthorizationContext,
  permission: string,
  now = new Date(),
  resourceScope?: AuthorizationResourceScope
): boolean {
  if (!isDocPermission(permission) || !checkMemberAccess(context, now).allowed) return false;
  if (!Array.isArray(context.appointments) || !isRecord(resourceScope)) return false;

  const validResourceScope =
    resourceScope.type === "global" ||
    (resourceScope.type === "department" &&
      typeof resourceScope.departmentId === "string" &&
      resourceScope.departmentId.trim().length > 0);
  if (!validResourceScope) return false;

  return context.appointments.some((raw) => {
    if (!isRecord(raw) || raw.status !== "Active" || !Array.isArray(raw.permissions) ||
        !raw.permissions.every((item) => typeof item === "string") ||
        !isRecord(raw.scope)) return false;

    const scopeMatches =
      raw.scope.type === "global"
        ? resourceScope.type === "global" || resourceScope.type === "department"
        : raw.scope.type === "department" &&
          resourceScope.type === "department" &&
          typeof raw.scope.departmentId === "string" &&
          raw.scope.departmentId.trim().length > 0 &&
          raw.scope.departmentId === resourceScope.departmentId;

    return scopeMatches &&
      raw.permissions.includes(permission) &&
      dateIsActive(now, raw.effectiveFrom as string | null | undefined,
        raw.effectiveUntil as string | null | undefined);
  });
}

/** Record maintenance is operational access; it does not imply decision power. */
export function canAdministerMembershipRecords(context: AuthorizationContext, now = new Date()): boolean {
  if (!checkMemberAccess(context, now).allowed) return false;
  const isPresident = typeof context.nationalPresidentGoogleSubject === "string" &&
    context.nationalPresidentGoogleSubject.length > 0 &&
    context.googleSubject === context.nationalPresidentGoogleSubject;
  return isPresident || hasOfficerPermission(context, "membership.records.manage", now, { type: "global" });
}

/** Delegation provenance must be independently verified by the trusted data adapter. */
export function canDecideMembership(context: AuthorizationContext, decision: MembershipDecision, now = new Date()): boolean {
  if (!checkMemberAccess(context, now).allowed) return false;
  if (!["approve", "reject", "suspend", "reinstate"].includes(decision)) return false;
  if (typeof context.nationalPresidentGoogleSubject === "string" &&
      context.nationalPresidentGoogleSubject.length > 0 &&
      context.googleSubject === context.nationalPresidentGoogleSubject) return true;
  if (!Array.isArray(context.delegations)) return false;

  return context.delegations.some((raw) => {
    if (!isRecord(raw) ||
        typeof raw.delegateGoogleSubject !== "string" || !raw.delegateGoogleSubject ||
        typeof raw.grantedByGoogleSubject !== "string" || !raw.grantedByGoogleSubject ||
        typeof raw.effectiveFrom !== "string" || typeof raw.effectiveUntil !== "string" ||
        !Array.isArray(raw.decisionScopes) ||
        !raw.decisionScopes.every((scope) => ["approve", "reject", "suspend", "reinstate"].includes(String(scope))) ||
        (raw.revokedAt !== undefined && raw.revokedAt !== null)) return false;
    const start = Date.parse(raw.effectiveFrom);
    const end = Date.parse(raw.effectiveUntil);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return false;
    return raw.delegateGoogleSubject === context.googleSubject &&
      raw.grantedByGoogleSubject === context.nationalPresidentGoogleSubject &&
      raw.decisionScopes.includes(decision) && dateIsActive(now, raw.effectiveFrom, raw.effectiveUntil);
  });
}

/** Only the current National President may manage membership decision delegations. */
export function canManageMembershipDelegations(context: AuthorizationContext, now = new Date()): boolean {
  return checkMemberAccess(context, now).allowed &&
    typeof context.nationalPresidentGoogleSubject === "string" &&
    context.nationalPresidentGoogleSubject.length > 0 &&
    context.googleSubject === context.nationalPresidentGoogleSubject;
}

/** Members may read their own summary; authorised records handlers may read others. */
export function canReadMembershipRecord(context: AuthorizationContext, targetGoogleSubject: string, now = new Date()): boolean {
  if (typeof targetGoogleSubject !== "string" || !targetGoogleSubject.trim() || !isRecord(context)) return false;
  if (context.googleSubject === targetGoogleSubject && checkMemberAccess(context, now).allowed) return true;
  return canAdministerMembershipRecords(context, now);
}

/** Audit actors must match the authenticated server-side identity. */
export function canAttributeGovernanceAction(context: AuthorizationContext, authenticatedGoogleSubject: string): boolean {
  return Boolean(isRecord(context) &&
    typeof context.googleSubject === "string" && context.googleSubject &&
    typeof authenticatedGoogleSubject === "string" && authenticatedGoogleSubject &&
    context.googleSubject === authenticatedGoogleSubject);
}
