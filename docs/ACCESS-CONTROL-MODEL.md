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

## 7. Membership governance and delegated administration

The National President retains the full and final institutional authority over ISEYC membership governance, including the authority to approve or reject membership, suspend or reinstate members, and appoint or remove anyone assigned to administer the membership process.

The National President may appoint a Membership Administrator or other designated officer to carry out operational duties such as:
- Receiving and checking applications for completeness.
- Verifying submitted information and following up with applicants.
- Maintaining the membership register and supporting records.
- Preparing recommendations and decision briefs.
- Communicating decisions after they have been authorised.
- Administering access changes that have been explicitly approved.

An appointment to administer the process does not, by itself, transfer final decision-making authority. The appointee must not independently approve, reject, suspend or reinstate membership unless the National President has expressly delegated that specific decision authority in a recorded written instrument. Any delegation must state its scope, duration, limits and revocation conditions. The National President retains ultimate oversight and may review, vary or revoke a delegation.

The system must therefore distinguish:
1. **Membership governance authority** — reserved to the National President, subject only to a specific recorded delegation.
2. **Membership administration** — operational tasks assigned to an appointed administrator.
3. **Membership decision record** — the actual authorised decision, decision-maker, date, reason and any delegation instrument relied upon.

The membership register must record the decision-maker and authority basis for each approval, rejection, suspension and reinstatement. A staff member's ability to edit a register or process an application must never automatically grant the permission to make the underlying governance decision.

Officer appointments and privileged access remain separate governance decisions. Do not infer those powers from membership administration duties.

## 8. Audit and lifecycle

Record actor, target identity/member ID, action, timestamp, outcome and reason for membership approval, rejection, suspension, reinstatement, expiry, appointment change, permission grant/revocation, denied access and sensitive operations. For delegated decisions, also record the delegation reference and scope. Protect audit records from ordinary editing and avoid recording secrets or unnecessary personal data.

Suspending one member must revoke that member's access without affecting other members. Expired or revoked appointments must immediately remove the associated officer permissions while preserving valid membership. Revoking an administrator's appointment or delegation must remove the associated administrative permissions and must not erase historical decisions or audit records.

## 9. Required test matrix

- Anonymous visitor: can access intended public pages and public product features; cannot access DOC member routes.
- Pending applicant: cannot access member routes.
- Approved active member: can access member routes; cannot access officer routes without an active appointment.
- Suspended, expired or rejected member: denied member and officer access.
- Approved member with expired appointment: member access only.
- Department officer: only assigned department scope and delegated permissions.
- Privileged officer: only explicitly granted privileged actions.
- Membership Administrator: can perform assigned administrative tasks but cannot make reserved membership decisions without a recorded specific delegation.
- Revoked administrator or expired delegation: administrative actions denied.
- Revoked member or appointment: access denied after revocation/session invalidation.
- Direct API calls: same authorization outcomes as the UI; no bypass by changing URLs or request payloads.

## 10. Current implementation status

The current application still uses the shared `ISEYC_STAFF_KEY` gate. Google OIDC, membership records, appointment-based RBAC, individual PIN verification and the public/member/officer route split are not implemented. The existing security-hardening PR is a temporary shared-key improvement, not the final identity solution.

This document is a design specification only. It does not itself create a membership database, appoint an administrator, grant access, or change production behavior.


## 11. Appointment scope is mandatory

Every active officer appointment must carry an explicit server-trusted scope:
- global — an institution-wide appointment whose authority has been explicitly approved and recorded.
- department — an appointment bound to one immutable department identifier.

A department-scoped appointment is valid only when the protected resource handler supplies the target department identifier and it exactly matches the appointment. Missing resource scope, missing appointment scope, malformed scope or a different department must be denied. Never infer scope from a role title, department label supplied by the browser, or an absent field.

A global appointment may act on department resources only when the trusted appointment record explicitly declares global scope. This is not an automatic property of a Council title or seniority. Resource handlers must derive target department identifiers from the server-side record being accessed, not from untrusted request claims.
