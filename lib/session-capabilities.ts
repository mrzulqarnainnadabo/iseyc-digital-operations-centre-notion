/**
 * Explicit capability matrix for DOC sessions.
 *
 * Shared staff-key sessions prove coordination access only.
 * They do not prove individual officer identity, appointment,
 * department membership, or authority to approve, assign, or publish.
 *
 * Appointment-bound sessions are reserved for a future authority source
 * (membership + appointments registers). This module does not invent them.
 */

export type SessionMode = "none" | "shared_staff";

/** Future extension point — not issued by current auth. */
export type OfficerSessionMode = "officer";

export type SessionCapability =
  | "ops.browse"
  | "ops.draft.programme"
  | "ops.draft.workplan"
  | "ops.draft.report"
  | "ops.draft.communications"
  | "ops.meeting.standard"
  | "ops.action.propose"
  | "ops.action.progress"
  | "ops.approve"
  | "ops.publish"
  | "ops.assign"
  | "ops.membership.manage"
  | "ops.appointment.manage";

const SHARED_STAFF_CAPABILITIES: ReadonlySet<SessionCapability> = new Set([
  "ops.browse",
  "ops.draft.programme",
  "ops.draft.workplan",
  "ops.draft.report",
  "ops.draft.communications",
  "ops.meeting.standard",
  "ops.action.propose",
]);

/** Privileged capabilities that require verified appointment — never granted to shared staff. */
export const APPOINTMENT_REQUIRED_CAPABILITIES: readonly SessionCapability[] = [
  "ops.action.progress",
  "ops.approve",
  "ops.publish",
  "ops.assign",
  "ops.membership.manage",
  "ops.appointment.manage",
] as const;

export function capabilitiesForSession(mode: SessionMode): ReadonlySet<SessionCapability> {
  if (mode === "shared_staff") return SHARED_STAFF_CAPABILITIES;
  return new Set();
}

export function sessionAllows(mode: SessionMode, capability: SessionCapability): boolean {
  return capabilitiesForSession(mode).has(capability);
}

/**
 * Map a verified shared staff session to its mode.
 * Callers must already have verified the session token.
 */
export function modeFromStaffSession(verified: boolean): SessionMode {
  return verified ? "shared_staff" : "none";
}

export function denialReason(capability: SessionCapability): string {
  if (APPOINTMENT_REQUIRED_CAPABILITIES.includes(capability)) {
    return "This action requires a verified individual appointment. Shared staff access is not sufficient.";
  }
  if (capability.startsWith("ops.")) {
    return "An authenticated operations session is required.";
  }
  return "Permission denied.";
}
