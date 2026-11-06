/**
 * Closed vocabulary for DOC authorization checks.
 *
 * These identifiers define possible capabilities; they do not grant them.
 * A permission is effective only when loaded from a trusted, active,
 * server-side appointment/delegation record and checked against resource scope.
 */
export const DOC_PERMISSIONS = [
  "meetings.read",
  "meetings.create",
  "meetings.submit",
  "meetings.approve",
  "meetings.archive",
  "meetings.edit",
  "chamber.read",
  "chamber.manage",
  "actions.read",
  "actions.create",
  "actions.update",
  "actions.close",
  "media.read",
  "media.create",
  "media.review",
  "media.publish",
  "membership.records.read",
  "membership.records.manage",
  "membership.decisions.approve",
  "membership.decisions.reject",
  "membership.decisions.suspend",
  "membership.decisions.reinstate",
  "membership.delegations.manage",
  "department.read",
  "department.manage",
  "finance.read",
  "finance.manage",
  "safeguarding.read",
  "safeguarding.manage",
  "personnel.read",
  "personnel.manage",
] as const;

export type DocPermission = (typeof DOC_PERMISSIONS)[number];

const permissionSet: ReadonlySet<string> = new Set(DOC_PERMISSIONS);

export function isDocPermission(value: unknown): value is DocPermission {
  return typeof value === "string" && permissionSet.has(value);
}
