# DOC Access Control Model

Status: implementation specification; not yet production policy enforcement.

## 1. Product boundary

ISEYC public-facing products and public read-only experiences remain accessible to everyone. Do not place a global authentication wall in front of public routes.

The Digital Operations Centre (DOC) is an internal institutional workspace. Its member-only interfaces require an approved, active ISEYC membership. Officer interfaces require an additional active appointment and explicit permission.

Public civic products and the DOC are separate trust boundaries. Internal membership, personnel, finance, safeguarding and governance data must never be exposed through public civic APIs.

## 2. Identity is not membership

- Each person signs in using their own personal Google account.
- Shared Google accounts are prohibited for individual access.
- Google OpenID Connect establishes identity. Persist the immutable OIDC `sub` as the stable identity key; treat email as a verified contact/lookup attribute that may change.
- A Google account, successful authentication, or matching email domain does not by itself confer ISEYC membership.
- An identity receives member access only when matched to an explicitly approved and active membership record.
- Do not use the Google `hd` domain hint as an authorization control.

## 3. Separate membership from appointment

Membership and appointment are separate records with separate lifecycle and authority.

Membership record minimum fields:
- Internal member ID
- Member display name
- Personal email
- Google OIDC subject (after identity linking)
- Membership status: Pending, Approved, Suspended, Expired, Rejected
- Membership type
- Application, approval and expiry timestamps
- Approving authority / approver identity
- Identity verification and consent state
- Last access review timestamp

Appointment record remains the source of truth for office, department, appointment status, term and delegated permissions. An approved member without an active appointment must not access officer-only functions.

## 4. Access tiers

| Tier | Eligibility | Scope |
| --- | --- | --- |
| Public | Everyone | Public website and explicitly public product experiences |
| Member | Approved, active membership | Member-only resources and collaboration interfaces |
| Officer | Approved member plus active appointment | Assigned department and explicitly delegated officer workflows |
| Privileged | Explicitly designated authority | Specific Council, personnel, finance, safeguarding or administrative operations |

Do not infer privileged access from seniority, a title string, membership type or a department-filtered Notion view.

## 5. Server-side enforcement

- Define a central authorization service with typed permissions and deny-by-default behavior.
- Enforce authorization in every protected server component, server action and API route. Hiding a button or navigation item is not authorization.
- Public endpoints must explicitly declare that they are public and return only approved public fields.
- Member endpoints require an approved, active membership.
- Officer endpoints additionally require the relevant active appointment, department scope and permission.
- Sensitive actions require explicit permission and, where governance policy requires it, a separate human approval step.
- Do not treat Notion filtered views as security boundaries. Verify actual page/database sharing and integration capabilities.

## 6. PIN and session controls

- The six-digit personal DOC PIN is an additional control for DOC access or sensitive actions, not a login requirement for public visitors.
- Never store raw PINs. Use a modern memory-hard password hash with unique random salt and a server-side pepper held only in encrypted deployment secrets.
- Use a dedicated restricted authentication store; do not place PIN hashes, OAuth secrets, recovery codes or other authentication secrets in ordinary operational Notion databases.
- Rate limiting and lockout must be distributed and durable; in-memory serverless counters are insufficient.
- Define secure PIN reset/recovery, session expiry/revocation and audit events before enabling the PIN flow.
- Privileged users should enable Google account MFA.

## 7. Membership governance is an implementation gate

Before membership-based access is enabled, ISEYC must formally designate:
1. Who may approve ordinary membership applications.
2. Who may suspend, expire or reinstate membership.
3. Who may approve and revoke officer appointments.
4. Who may grant privileged access and review that access.
5. The authoritative register and evidence required for approval.

Do not invent approvers or infer these powers from the current appointment templates. Until the authority is designated and the register is permission-checked, do not onboard members or grant access based on incomplete records.

## 8. Audit and lifecycle

Record actor, target identity/member ID, action, timestamp, outcome and reason for membership approval, suspension, reinstatement, expiry, appointment change, permission grant/revocation, denied access and sensitive operations. Protect audit records from ordinary editing and avoid recording secrets or unnecessary personal data.

Suspending one member must revoke that member's access without affecting other members. Expired or revoked appointments must immediately remove the associated officer permissions while preserving valid membership.

## 9. Required test matrix

- Anonymous visitor: can access intended public pages and public product features; cannot access DOC member routes.
- Pending applicant: cannot access member routes.
- Approved active member: can access member routes; cannot access officer routes without an active appointment.
- Suspended, expired or rejected member: denied member and officer access.
- Approved member with expired appointment: member access only.
- Department officer: only assigned department scope and delegated permissions.
- Privileged officer: only explicitly granted privileged actions.
- Revoked member or appointment: access denied after revocation/session invalidation.
- Direct API calls: same authorization outcomes as the UI; no bypass by changing URLs or request payloads.

## 10. Current implementation status

The current application still uses the shared `ISEYC_STAFF_KEY` gate. Google OIDC, membership records, appointment-based RBAC, individual PIN verification and the public/member/officer route split are not implemented. The existing security-hardening PR is a temporary shared-key improvement, not the final identity solution.

This document is a design specification only. It does not itself create a membership database, grant access, establish governance authority or change production behavior.
