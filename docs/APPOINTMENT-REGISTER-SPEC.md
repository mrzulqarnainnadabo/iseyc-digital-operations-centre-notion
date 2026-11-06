# Officer Appointment & Role Register — Integration Specification

Status: existing Notion register identified and inspected; application integration is not implemented. No appointment data has been invented or activated.

## Existing authoritative Notion source

The existing database must be reused. Do not create a duplicate Appointment & Role Register.

- Notion database: **IDCC — Appointment & Role Register**
- Database page: `b9750d94-400f-4393-ad11-0e6a501c0ccd`
- Data source: `collection://c689c101-c875-4048-adc9-b1d54731d3be`
- Parent: ISEYC Digital Operations Centre
- Verified query result: **11 records**, all with status **Template**, and **0 named appointees**.
- The database description says it records role scope and access boundaries but does not itself grant system permissions.

This register currently contains role templates only. It is not evidence that any named person has been appointed or is active.

## Current schema observed

| Existing property | Current type / options | Integration meaning |
| --- | --- | --- |
| Office / Role | Title | Role template / formal office label |
| Appointee Name | Text | Blank on all 11 current template rows |
| Appointment Status | Select: Template, Proposed, Approved, Active, On Leave, Ended | Only Active can be considered for access, after date and instrument checks |
| Department / Office | Select: Presidential Office, Education & Capacity Building, Health & Well-being, Software & Technology, Civic Department, Cross-institutional, Advisory | Display taxonomy; not a stable security identifier |
| Role Category | Select: Presidential Council, Department Head, Special Adviser, Other Appointee, Contributor | Classification only; not permission |
| Access Tier | Select: Public, Internal, Restricted, Highly Restricted | Broad classification only; not sufficient for action-level RBAC |
| Appointment Instrument | URL | Formal appointment evidence reference |
| Start Date / End Date | Date | Appointment validity window |
| Review Date | Date | Access / appointment review |
| Decision Authority | Text | Human-readable authority note; not a machine permission |
| Authority Limits | Text | Human-readable boundary; not a machine permission |
| Responsibilities | Text | Role description |
| Role Purpose | Text | Role description |
| Reports To | Text | Reporting line |
| Official Email | Email | Contact field; not durable identity key |
| Backup Role | Text | Continuity note |
| Created / Updated | System timestamps | Notion metadata |

## Current schema gaps — do not infer permissions

The existing source does not currently expose:
- Immutable Google OIDC subject.
- Explicit permission identifiers from the closed application permission vocabulary.
- Explicit global versus department scope.
- Immutable department identifier.
- Appointing authority's verified OIDC subject.
- Revocation timestamp and reason as structured fields.
- Append-only appointment/permission change audit events.

The existing Access Tier, Role Category, Office / Role, Decision Authority and Authority Limits fields must not be parsed as a substitute for explicit permission grants.

## Required extension proposal

After the existing identity/access decision draft is approved, extend the existing data source with these fields:

| Proposed property | Notion type | Purpose |
| --- | --- | --- |
| Google OIDC Subject | Rich text | Stable identity link; populated only after personal Google sign-in and explicit account linking |
| Permission IDs | Multi-select | Exact values from `lib/doc-permissions.ts`; reject unknown options |
| Scope Type | Select | Global or Department |
| Department ID | Rich text | Immutable department scope key when Scope Type is Department |
| Appointed By Subject | Rich text | Verified identity of appointing authority |
| Revoked At | Date | Structured revocation timestamp |
| Revocation Reason | Rich text | Concise authority reference / reason |
| Last Access Review | Date | Last review of access necessity |

Do not change the database schema or add person/identity data until the founder-approved governance and identity design is final. The existing Notion page records the Google identity + personal six-digit PIN direction, but the PIN storage and distributed rate-limiter providers remain unresolved.

## Status mapping rules

- `Template`: never an appointment; deny.
- `Proposed`: not approved; deny.
- `Approved`: approved in principle but not active; deny until activation date and formal record are confirmed.
- `Active`: candidate for access only when Start Date is valid, End Date has not passed, Appointment Instrument is present and verified, identity subject is explicitly linked, and permission/scope data is valid.
- `On Leave`: deny officer access while leave is active.
- `Ended`: deny officer access.
- A revoked appointment must be denied immediately after the authoritative revocation is observed; a structured Revoked state/field is still required.

Missing or malformed status, dates, identity link, instrument, scope or permission data must fail closed.

## Department identifier reconciliation

The existing Notion select options use **Software & Technology** and **Civic Department**. The current IDCC screen specification uses **Digital Systems & Technology** and **Civic Affairs**. Do not silently compare display labels or rename historical values during access checks.

Before RBAC activation, establish immutable department IDs and an approved alias/display-label mapping. The UI may show the current approved display names, but the server must compare stable identifiers.

## Access enforcement contract

1. Verify the user's own Google identity using OIDC. Do not accept email or display name as the stable identity.
2. Require a separately approved and active membership record.
3. Match the immutable Google subject to exactly one active appointment record.
4. Check appointment status, start/end dates, instrument, exact permission and server-derived resource scope on every protected request.
5. Department scope must match the resource's immutable department ID exactly. Global scope must be explicit.
6. If zero or multiple active appointments ambiguously claim the same exclusive seat, deny the privileged action and raise a review condition.
7. Do not grant access from Notion views, page sharing, role titles or Access Tier alone.
8. Record appointment, permission and scope changes in a separate append-only audit store.
9. Revoke sessions or re-check authoritative status promptly after suspension, leave, expiry or revocation.

## Audit requirements

Use a separate append-only Appointment & Access Audit Log or an approved durable audit mechanism. Capture actor subject, target appointment, action, previous/new state, permission and scope changes, authority reference, reason, timestamp, and whether session invalidation succeeded. Do not treat the editable appointment row as its own audit trail.

## Current application state

The feature branch contains Google OIDC identity verification only. The resulting 15-minute pending-identity proof is not accepted as a DOC session and grants no access. Appointment-to-identity mapping and officer RBAC are not implemented. The existing appointment data source is not configured in the Next.js application.

## Activation checklist

- [ ] Founder approves the existing appointment schema extension and canonical department identifiers.
- [ ] Existing Notion integration access is verified and restricted to required databases.
- [ ] Membership source and approval authority are defined.
- [ ] Actual appointments and authority instruments are confirmed by humans.
- [ ] Google OIDC subjects are linked only after each person signs in with their own personal Google account.
- [ ] Permission IDs and scopes are explicitly approved; no role-title inference.
- [ ] Session revocation and append-only audit are implemented.
- [ ] Direct API, cross-department, expiry, leave and revocation tests pass.
- [ ] Authenticated mobile and desktop QA passes before officer onboarding.

No names, appointments, seat occupancy, department heads or national coverage are to be populated from assumptions or placeholder values.
