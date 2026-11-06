# Officer Appointment & Role Register — Implementation Specification

Status: schema and governance specification only. No officer appointment data is loaded or inferred by this application.

## Purpose

The Appointment & Role Register is the authoritative restricted source for whether a person currently occupies an institutional seat, the term of that appointment, its department scope and its explicitly delegated permissions. It is separate from the Membership Register: membership does not create an appointment, and an appointment does not override membership status.

## Proposed Notion properties

| Property | Type | Required | Meaning |
| --- | --- | --- | --- |
| Appointment ID | Title | Yes | Stable internal appointment record identifier |
| Officer Name | Rich text | Yes | Human's confirmed display name |
| Google OIDC Subject | Rich text | Yes after identity linking | Immutable identity-provider subject |
| Seat / Role | Select | Yes | Exact formally approved seat or role |
| Department ID | Rich text | Conditional | Immutable department identifier for department scope |
| Department Name | Select | Conditional | Display label; not the security key |
| Appointment Status | Status or Select | Yes | Active, Inactive, Expired, Revoked |
| Scope Type | Select | Yes | Global or Department |
| Permissions | Multi-select | Yes | Exact identifiers from `lib/doc-permissions.ts` |
| Effective From | Date | Yes | Appointment start |
| Effective Until | Date | Yes | Appointment end or review date |
| Appointed By Subject | Rich text | Yes | Verified identity of appointing authority |
| Authority Reference | URL or Rich text | Yes | Formal appointment instrument / resolution reference |
| Appointment Evidence | Files or URL | Conditional | Restricted evidence of appointment |
| Revoked At | Date | Conditional | Revocation timestamp |
| Revocation Reason | Rich text | Conditional | Concise reason / authority reference |
| Last Access Review | Date | Yes | Most recent access-scope review |
| Record Created | Created time | Automatic | Notion metadata |
| Last Edited | Last edited time | Automatic | Notion metadata |

Do not use Notion page sharing, database views, or filters as authorization controls. Verify the integration's workspace and page access independently. Do not store OAuth secrets, PINs, session tokens, recovery codes or peppers in this register.

## Scope rules

- Global scope is an explicit appointment attribute, not inferred from a title or seniority.
- Department scope requires an immutable Department ID.
- A department appointment must never authorize a different department.
- A missing, malformed or unknown scope denies access.
- A global appointment can reach department resources only when the record explicitly declares Global scope and the permission is present.
- Permission identifiers must match the closed vocabulary in `lib/doc-permissions.ts`. Unknown strings are rejected.
- A title such as "Director", "President", "Secretary" or "Coordinator" grants no permissions by itself.

## National President authority

The National President remains the final institutional authority for membership governance and appointment/delegation policy. The active National President identity must be established by one current, verified appointment record with explicit Global scope and the appropriate governance authority. Zero or multiple matching active records must fail closed for privileged membership decisions; never choose the first matching record.

The appointment record is evidence of an approved human appointment, not an automated appointment action. No record should be created until the appointment has actually been made and the authority reference exists.

## Required audit events

Appointment creation, amendment, renewal, expiry, revocation, permission changes and scope changes must create a separate append-only audit event containing:
- Event ID and timestamp
- Target Appointment ID
- Authenticated actor's Google OIDC subject
- Previous and new status, scope and permission set
- Authority basis and reference
- Reason
- Result of the access/session invalidation action

The audit actor must come from the verified server-side identity. Never accept it from the browser. Ordinary appointment records must not be used as their own audit trail.

## Server enforcement

1. Verify the Google OIDC identity and link it to one Approved, active membership record.
2. Load the appointment records for that exact OIDC subject from the restricted register.
3. Check Active status and effective dates on every protected request.
4. Check the exact permission and server-derived resource scope.
5. Deny if the membership or appointment source is unconfigured, unavailable, malformed, ambiguous or stale.
6. Apply the same checks to API routes, server actions and server-rendered pages.
7. Invalidate the affected session/permission cache on revocation; do not wait for UI navigation to update.
8. Record all successful and denied privileged actions in the append-only audit store.

## Activation checklist

- [ ] Founder confirms the exact seat/role vocabulary and department identifiers.
- [ ] Founder verifies appointment instruments and authority for every actual seat holder.
- [ ] Create the restricted Appointment & Role Register.
- [ ] Create a separate append-only Appointment & Access Audit Log.
- [ ] Link Notion integration with minimum required access only.
- [ ] Confirm no duplicate active appointments for a single seat where exclusivity is required.
- [ ] Confirm all scopes and permissions are explicit and valid.
- [ ] Add real verified OIDC subjects only after each person completes sign-in and identity linking.
- [ ] Run the complete appointment, scope, revocation and cross-resource authorization test matrix.
- [ ] Complete authenticated browser QA before enabling officer routes.

No names, appointments, office occupancy, department heads or national coverage are to be populated from assumptions or placeholder values.
