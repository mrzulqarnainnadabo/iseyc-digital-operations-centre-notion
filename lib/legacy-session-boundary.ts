/**
 * Transitional safety boundary for the legacy shared-staff-key session.
 *
 * This is intentionally restrictive, not a replacement for individual
 * identity, membership, appointment or role-based authorization.
 */
export function legacySessionCanReadMeeting(sensitivity: unknown): boolean {
  return sensitivity === "Standard";
}

export function legacySessionCanCreateMeeting(sensitivity: unknown): boolean {
  return sensitivity === "Standard";
}

export function legacySessionCanSetMeetingStatus(status: unknown): boolean {
  return status === "In review";
}
