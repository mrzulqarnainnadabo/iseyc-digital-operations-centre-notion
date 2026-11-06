# DOC API authorization enforcement map

Status: design and review document. This is not evidence that individual identity or role enforcement is implemented.

## Current behavior verified in the API routes

| Route | Current gate | Risk / limitation |
|---|---|---|
| GET /api/meetings | Shared staff session + Standard sensitivity filter | Legacy session sees only explicitly Standard records; not individual member authorization |
| POST /api/meetings | Same-origin + shared staff session + explicit Standard sensitivity | Legacy session can create Standard submissions only; no actor-bound audit |
| GET /api/meetings/[id] | Shared staff session + Standard sensitivity + Meetings database parent check | No individual identity or appointment scope |
| PATCH /api/meetings/[id] | Same-origin + shared staff session + Standard sensitivity + limited transition | Legacy session may move Standard records to In review only; approval, archive and draft transitions are denied |
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
- The legacy session may move a Standard meeting to `In review` only; `Approved`, `Archived` and `Draft` transitions are denied until individual authorization exists.
- Meeting intake requires an explicit `Standard` sensitivity value. Missing or unknown values are rejected rather than coerced to Standard.
- The review interface disables both approval and archive actions for the legacy session.
- The interface disables the approval action and explains that individually authorised officer access is required.
- The legacy session may continue to read standard meeting records, create explicitly Standard submissions and move them to `In review`; this is not individual member access or role-based authorization.

These controls reduce exposure while the legacy gate exists. They do not provide per-person accountability, officer identity, approval authority, record-level permissions for other DOC modules, or a durable audit trail. They must not be represented as the final authorization system.


### Meeting record boundary correction

Meeting detail lookup now verifies that the retrieved Notion page's `parent.database_id` matches the configured Meetings database before returning it. This prevents a caller with a valid legacy session from supplying an arbitrary Notion page ID and using the meeting endpoint to read or update a page in another database.

Missing meeting sensitivity is represented as `Unclassified`, not silently defaulted to `Standard`; legacy-session filters therefore deny it.


### Login request validation

The legacy login endpoint now parses its untrusted JSON body through a strict input helper. Null, array, primitive, missing-key, non-string-key, blank-key and overlong-key payloads are rejected without calling string methods on attacker-controlled values. This prevents malformed payloads from turning into an unhandled server error.

This is input validation only. Durable rate limiting and abuse monitoring are still outstanding; no in-memory limiter is being presented as reliable protection in a serverless deployment. A distributed limiter must be selected and configured before the shared-key login is considered production-hardened.


### Private response and request-boundary hardening

The review branch now applies a shared private-response helper to login, logout and meeting API responses. It sets `Cache-Control: private, no-store, max-age=0, must-revalidate`, `Pragma: no-cache` and `Vary: Cookie`. This reduces the risk of sensitive operational responses being retained or reused across sessions by browser or intermediary caches.

State-changing JSON endpoints now use a bounded parser that:
- Requires an `application/json` media type.
- Measures the actual encoded request body before parsing.
- Enforces a 2 KiB login body limit, 16 KiB meeting-intake limit and 8 KiB meeting-update limit.
- Returns controlled 400, 413 or 415 responses for malformed, oversized or incorrectly typed requests.

The meeting queue and review screens request fresh data without browser caching and include cancellation, retry and network-error states. These are usability and cache-safety improvements; they do not change the shared-key identity limitation.

### Test coverage at this checkpoint

The policy test suite now includes regression cases for:
- Membership Administrator record-maintenance access without decision authority.
- Own-record versus another-member record access.
- Unverified and suspended membership denial.
- President access requiring active, verified membership.
- Revoked/expired appointments and delegation provenance.
- Dashboard aggregates excluding restricted, unclassified and malformed-sensitivity records.
- Private API cache headers and bounded JSON parsing.

The CI workflow runs the policy suite and application TypeScript check. Passing CI is necessary but does not replace OIDC integration, durable storage, route-by-route authorization, authenticated browser QA or production security review.


## Department resource scope

Officer appointment records must declare an explicit scope. The policy primitive now requires the protected handler to pass a resource scope; it fails closed when scope is omitted or malformed. Department-scoped appointments can operate only on a resource whose server-derived department identifier exactly matches the appointment. An explicit global appointment may operate across departments; global scope must be present in the trusted appointment record and is never inferred from role title.

The policy tests cover same-department allow, cross-department deny, omitted resource scope deny, missing appointment scope deny, malformed department scope deny and explicitly global access. These are pure policy tests; there is not yet a trusted appointment adapter or live route integration. The application must not claim department RBAC is active until both are connected.


## Session-token parsing and operations-page guard

The transitional shared-key session verifier now rejects non-canonical token encodings before HMAC comparison: timestamps must be bounded decimal strings, nonces must match the generated 16-byte base64url form, and signatures must be lowercase SHA-256 hex. Existing HMAC verification, constant-time digest comparison, 12-hour expiry and limited future-clock tolerance remain in force.

Regression coverage now includes valid-token acceptance, signature tampering, malformed token segments, invalid nonce/signature encodings, expired tokens, future timestamps and the shared authenticated layout protecting every current operations page.

This does not add individual identity or central per-session revocation. Logout clears the browser cookie; because sessions remain stateless, a copied token remains valid until expiry or staff-key rotation. Treat this as a documented transitional limitation, not a production identity system.
