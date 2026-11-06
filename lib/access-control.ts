/**
 * Server-side DOC authorization policy primitives.
 *
 * IMPORTANT: Callers must build this context from trusted server-side records
 * (verified OIDC claims, restricted Membership Register, Appointment & Role
 * Register and delegation records). Never accept this object from a browser
 * request or infer authority from an email address or UI role.
 */

export type MembershipStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Suspended"
  | "Expired";

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
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
};

export type MembershipDecision =
  | "approve"
  | "reject"
  | "suspend"
  | "reinstate";

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
  /** Subject of the currently authoritative National President record. */
  nationalPresidentGoogleSubject: string | null;
};

export type MembershipAccessResult =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "identity_unavailable"
        | "membership_missing"
        | "membership_not_active"
        | "identity_not_linked"
        | "email_not_verified";
    };

function dateIsActive(
  now: Date,
  startsAt?: string | null,
  endsAt?: string | null
): boolean {
  const nowMs = now.getTime();
  if (startsAt) {
    const start = Date.parse(startsAt);
    if (!Number.isFinite(start) || nowMs < start) return false;
  }
  if (endsAt) {
    const end = Date.parse(endsAt);
    if (!Number.isFinite(end) || nowMs > end) return false;
  }
  return true;
}

export function checkMemberAccess(
  context: AuthorizationContext,
  now = new Date()
): MembershipAccessResult {
  if (!context.googleSubject) {
    return { allowed: false, reason: "identity_unavailable" };
  }

  const member = context.membership;
  if (!member) return { allowed: false, reason: "membership_missing" };
  if (member.status !== "Approved") {
    return { allowed: false, reason: "membership_not_active" };
  }
  if (!member.emailVerified) {
    return { allowed: false, reason: "email_not_verified" };
  }
  if (
    !member.googleSubject ||
    member.googleSubject !== context.googleSubject
  ) {
    return { allowed: false, reason: "identity_not_linked" };
  }
  if (!dateIsActive(now, member.effectiveFrom, member.effectiveUntil)) {
    return { allowed: false, reason: "membership_not_active" };
  }
  return { allowed: true };
}

export function hasOfficerPermission(
  context: AuthorizationContext,
  permission: string,
  now = new Date()
): boolean {
  if (!checkMemberAccess(context, now).allowed) return false;

  return context.appointments.some(
    (appointment) =>
      appointment.status === "Active" &&
      appointment.permissions.includes(permission) &&
      dateIsActive(now, appointment.effectiveFrom, appointment.effectiveUntil)
  );
}

/**
 * Record maintenance is operational access. It does not imply decision power.
 */
export function canAdministerMembershipRecords(
  context: AuthorizationContext,
  now = new Date()
): boolean {
  if (!checkMemberAccess(context, now).allowed) return false;

  const isPresident =
    Boolean(context.nationalPresidentGoogleSubject) &&
    context.googleSubject === context.nationalPresidentGoogleSubject;

  return (
    isPresident ||
    hasOfficerPermission(context, "membership.records.manage", now)
  );
}

/**
 * The National President may decide directly. A delegate must have a valid,
 * unrevoked, time-bounded record explicitly covering the requested decision.
 * The caller must separately verify the delegation was created/approved by
 * the current National President and preserve its audit event.
 */
export function canDecideMembership(
  context: AuthorizationContext,
  decision: MembershipDecision,
  now = new Date()
): boolean {
  // Every decision-maker, including the President, must authenticate as an
  // approved, verified and currently active member.
  if (!checkMemberAccess(context, now).allowed) return false;

  if (
    context.nationalPresidentGoogleSubject &&
    context.googleSubject === context.nationalPresidentGoogleSubject
  ) {
    return true;
  }

  return context.delegations.some((delegation) => {
    // Fail closed on incomplete or malformed delegation records.
    if (
      !delegation.delegateGoogleSubject ||
      !delegation.grantedByGoogleSubject ||
      !delegation.effectiveFrom ||
      !delegation.effectiveUntil ||
      !Number.isFinite(Date.parse(delegation.effectiveFrom)) ||
      !Number.isFinite(Date.parse(delegation.effectiveUntil)) ||
      Date.parse(delegation.effectiveUntil) < Date.parse(delegation.effectiveFrom)
    ) {
      return false;
    }

    return (
      delegation.delegateGoogleSubject === context.googleSubject &&
      delegation.grantedByGoogleSubject ===
        context.nationalPresidentGoogleSubject &&
      delegation.decisionScopes.includes(decision) &&
      !delegation.revokedAt &&
      dateIsActive(now, delegation.effectiveFrom, delegation.effectiveUntil)
    );
  });
}


/**
 * Only the currently recorded National President may grant, change or revoke
 * membership decision delegations. A Membership Administrator cannot
 * delegate onward or expand their own authority.
 */
export function canManageMembershipDelegations(
  context: AuthorizationContext,
  now = new Date()
): boolean {
  return (
    checkMemberAccess(context, now).allowed &&
    Boolean(context.nationalPresidentGoogleSubject) &&
    context.googleSubject === context.nationalPresidentGoogleSubject
  );
}
