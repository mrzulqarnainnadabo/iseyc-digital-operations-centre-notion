# DOC API authorization enforcement map

Status: design and review document. This is not evidence that individual identity or role enforcement is implemented.

## Current behavior verified in the API routes

| Route | Current gate | Risk / limitation |
|---|---|---|
| GET /api/meetings | Shared staff session | Any holder of the shared session can list all meetings |
| POST /api/meetings | Same-origin + shared staff session | No distinct meeting-create permission or actor-bound audit |
| GET /api/meetings/[id] | Shared staff session | No per-record sensitivity or scope check |
| PATCH /api/meetings/[id] | Same-origin + shared staff session | Any shared-session holder can set In review, Approved, Archived or Draft |
| POST /api/auth/login | Shared staff key | No personal Google OIDC identity |
| POST /api/auth/logout | Same-origin | Clears the shared session cookie |

## Required target policy

The server must derive the authorization context from a verified Google OIDC session and trusted server-side records. Never accept Google subject, membership status, appointment, role, permissions, or audit actor from request JSON, query parameters, or client state.

| Operation | Required permission / condition |
|---|---|
| Read ordinary meeting | Active member; record sensitivity permits member access |
| Read restricted meeting | Explicit appointment permission and record scope |
| Create meeting | `meetings.create` |
| Move meeting to In review | `meetings.submit` |
| Approve meeting | `meetings.approve` and a separately recorded human approval |
| Archive meeting | `meetings.archive` |
| Change meeting to Draft | `meetings.edit` or authorised record owner workflow |
| Read own membership summary | Active member and matching immutable Google OIDC subject |
| Read membership register | National President or explicitly appointed records administrator |
| Decide membership | National President or current, unrevoked, time-bounded delegation with exact decision scope |

## Enforcement requirements

1. Introduce one server-only authorization adapter that returns a typed verified identity and trusted authorization context. It must fail closed when OIDC, membership, appointment, or delegation sources are unavailable.
2. Keep the legacy shared-key path clearly labelled as transitional. Do not silently treat it as a verified individual identity or map it to a privileged role.
3. Protect every API handler independently. Hiding buttons or navigation is not authorization.
4. Check record sensitivity and record-level scope after loading a record; do not rely only on route-level membership checks.
5. Validate request schemas and allowed status transitions server-side.
6. Derive audit actor identity from the verified session. Record action, target, timestamp, previous/new state, reason where required, and correlation ID. Never accept the actor from the browser.
7. Apply rate limiting to login and sensitive mutations, and use durable session revocation for privileged access.
8. Keep restricted membership, personnel, finance and safeguarding data out of public civic APIs and public client bundles.
9. Add integration tests for every route: anonymous, legacy-only, pending/rejected/suspended/expired member, active member, officer with insufficient permission, officer with required permission, revoked appointment, expired delegation, and cross-record access.
10. Preserve explicit human approval for governance decisions, finance, safeguarding, disciplinary matters, public findings and official commitments.

## Release gate

Do not enable Google member sign-in or remove the legacy gate until the identity provider, restricted membership source, appointment source, permission mapping, session revocation, audit persistence, route integration tests, and authenticated browser QA are complete. A passing policy-unit-test workflow alone does not satisfy this gate.

No deployment, production configuration change, or access migration is authorised by this document.


## Transitional shared-session containment (implemented on this review branch)

Until individual Google identity and trusted appointment records are implemented, the legacy shared staff-key session is treated as a restricted transitional credential:

- Meeting list and detail reads expose only records explicitly marked `Standard`; restricted, missing or unknown sensitivity values are denied.
- Restricted meeting intake is rejected by the API.
- The legacy session cannot transition a meeting to `Approved`.
- The interface disables the approval action and explains that individually authorised officer access is required.
- The legacy session may continue to read standard meeting records and create standard meeting submissions; this is not individual member access or role-based authorization.

These controls reduce exposure while the legacy gate exists. They do not provide per-person accountability, officer identity, approval authority, record-level permissions for other DOC modules, or a durable audit trail. They must not be represented as the final authorization system.


### Meeting record boundary correction

Meeting detail lookup now verifies that the retrieved Notion page's `parent.database_id` matches the configured Meetings database before returning it. This prevents a caller with a valid legacy session from supplying an arbitrary Notion page ID and using the meeting endpoint to read or update a page in another database.

Missing meeting sensitivity is represented as `Unclassified`, not silently defaulted to `Standard`; legacy-session filters therefore deny it.
