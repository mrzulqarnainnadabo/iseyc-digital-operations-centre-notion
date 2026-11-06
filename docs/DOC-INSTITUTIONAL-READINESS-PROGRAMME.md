# DOC Institutional Readiness Programme

Status: active engineering programme; not production-ready.

This document is the execution ledger for the Digital Operations Centre (DOC). It distinguishes implemented safeguards from design-only controls and from work blocked on institutional decisions, provider credentials or infrastructure. A passing test suite does not mean the DOC is production-ready.

## Operating constraints

- Keep all engineering on review branches until a separately approved release window.
- Do not deploy, promote a preview, alter production secrets, weaken Vercel SSO or change production authentication as part of this programme.
- Preserve public access to ISEYC's public-facing civic products. The DOC remains a separate internal trust boundary.
- The National President retains final membership governance authority. An appointed administrator may maintain records and prepare recommendations; decision rights require a recorded, scoped, time-bound delegation.
- Never invent members, officer appointments, membership categories, decisions, public statistics or institutional records.
- Human approval remains mandatory for governance decisions, public commitments, sensitive findings, finance, safeguarding and disciplinary matters.
- Notion views and filters are not access-control boundaries. Verify actual page sharing and integration permissions before storing real member data.

## Current implementation inventory

### Implemented on the review branch

- Shared-key session cookie no longer embeds the shared key; session token is nonce-backed and HMAC-signed with a bounded lifetime.
- Login/logout and meeting mutations enforce same-origin requests.
- Login payload parser rejects malformed and non-string key values.
- Private DOC/auth API responses now use explicit no-store cache headers and vary on Cookie.
- Login and meeting mutation routes validate JSON media type and enforce encoded request-size limits before parsing.
- Legacy shared-key meeting reads and dashboard aggregates include only records explicitly classified Standard.
- Legacy meeting intake requires an explicit Standard sensitivity value.
- Legacy meeting session can move a Standard record only to In review; approval/archive/draft transitions remain denied.
- Individual meeting retrieval verifies that the page belongs to the configured Meetings database.
- Membership, appointment, officer-permission and delegation policy primitives fail closed on malformed or inactive records.
- Tests cover member eligibility, scoped permissions, membership administration vs decision authority, delegation provenance, expiry/revocation, legacy sensitivity boundaries, private response cache policy and bounded JSON request parsing.
- Queue and review interfaces have explicit loading, retry, cancellation and network-error states; requests avoid browser caching.

### Not implemented — do not describe as operational

- Individual Google OpenID Connect sign-in and verified identity linking.
- A restricted, authoritative membership register and a secure data adapter for membership records.
- Actual membership records, membership categories, or an appointed Membership Administrator.
- Live server-side appointment and delegation loading.
- Complete member/officer/privileged RBAC enforcement across every DOC page, API and server action.
- Secure individual PIN enrollment, hashing, recovery and durable throttling.
- Durable session revocation and distributed login abuse controls.
- Tamper-resistant governance audit storage.
- Authenticated end-to-end browser QA and production operational monitoring.
- Complete operational workflows for the Digital Chamber, Action Register, Media & Content Command and Officer Access. Their current pages are placeholders.

## Execution workstreams

### Workstream A — identity and session architecture

1. Implement OIDC authorization-code flow with PKCE, state and nonce validation.
2. Validate issuer, audience, signature, expiry, nonce, state and verified-email claims.
3. Persist immutable Google OIDC subject as the identity key; email is a verified contact attribute, not the primary key.
4. Create server-side session records with rotation, expiry, revocation and secure cookie settings.
5. Keep provider secrets and signing keys in encrypted deployment secrets; never commit or store them in Notion.
6. Add negative tests for callback replay, mismatched state/nonce, wrong audience, expired tokens and unverified email.

Exit gate: identity cannot be spoofed from browser-supplied fields; sessions can be revoked centrally; tests pass. Provider client ID, secret, callback URL and approved configuration are required before live sign-in can be enabled.

### Workstream B — membership and governance records

1. Define restricted Membership, Appointment, Delegation and Governance Decision records with stable internal IDs.
2. Verify Notion workspace/page sharing, integration scope, export controls and backups before choosing Notion for restricted personal data.
3. Keep secrets, PIN hashes, recovery codes and session state out of operational Notion databases.
4. Model membership status independently from office appointment and permissions.
5. Record decision actor, authority basis, date, scope, reason and delegation reference.
6. Preserve the President's final authority and explicit delegation/revocation controls.
7. Do not create real member rows or appoint an administrator without the President's instruction and verified source data.

Exit gate: every membership decision is attributable to the President or a valid recorded delegation; administrative maintenance cannot silently confer decision rights; restricted data is inaccessible to public surfaces.

### Workstream C — centralized authorization and enforcement

1. Define a closed permission catalogue and typed resource/action policy.
2. Build authorization context only from verified session and trusted server-side records.
3. Add reusable server guards for member, officer, department-scoped and privileged actions.
4. Enforce access in server components, route handlers and server actions; UI visibility is supplementary only.
5. Add object-level checks so an officer cannot access another department's or another member's records by changing IDs.
6. Add route inventory tests that fail CI when a new API route is introduced without an explicit public/private classification and guard.
7. Test both allowed and denied paths, including direct API calls.

Exit gate: no protected route relies solely on a shared key or hidden UI; every route has an explicit authorization contract and negative tests.

### Workstream D — audit, privacy and operational resilience

1. Record security and governance events in a durable, append-only audit store.
2. Minimise personal data in logs; never log credentials, PINs, tokens or recovery material.
3. Implement distributed rate limiting and lockout for sign-in and sensitive actions.
4. Implement PIN hashing with a memory-hard KDF, unique salt and server-side pepper only if the PIN remains necessary after OIDC.
5. Implement session revocation on membership suspension, appointment revocation and account compromise.
6. Add request IDs, generic user-facing errors, operational alerts and backup/restore exercises.
7. Verify that public civic APIs cannot access or serialize DOC-only records.

Exit gate: security events are attributable and reviewable; revocation is effective; rate limits work across serverless instances; restore procedures are tested.

### Workstream E — operational product completion

1. Replace placeholder Officer Access with a read-only access status and governance-controlled appointment view.
2. Build membership intake, verification queue, recommendation brief and President decision workflow.
3. Build Digital Chamber with meeting notice, attendance, minutes and decision records; each transition must be permissioned.
4. Build Action Register linked to approved decisions, with owner, due date, evidence and closure review.
5. Build Media & Content Command with draft, editorial review, approval and publication evidence.
6. Add mobile-first layouts, low-bandwidth loading states, accessible focus/labels, empty states and error recovery.
7. Keep all official publication and external communication behind human approval.

Exit gate: workflows are usable end-to-end by the correct role, with evidence and audit trail; no placeholder is presented as a live function.

## Route and module inventory at this checkpoint

| Surface | Current state | Required next control |
| --- | --- | --- |
| `/login` and auth APIs | Shared-key transitional gate | Replace with verified individual OIDC |
| `/ops` | Protected shared-session dashboard | Member/officer authorization and safe data scoping |
| `/ops/queue` | Standard-only meeting queue | Role-aware queue and object-level authorization |
| `/ops/intake` | Standard meeting intake | Identity attribution, validation and audit event |
| `/ops/review/[id]` | Restricted legacy transitions | Officer-scoped decision workflow |
| `/ops/access` | Placeholder | Governance-controlled member/appointment view |
| `/ops/chamber` | Placeholder | Chamber workflow and minutes |
| `/ops/actions` | Placeholder | Action ownership, due dates and closure evidence |
| `/ops/media` | Placeholder | Editorial workflow and human publication approval |

## Release gates — all must pass before production

- OIDC and individual identity linking independently tested.
- Restricted data-store access and sharing reviewed.
- Membership and delegation source records verified by the National President.
- Every protected route and server action has explicit server-side authorization.
- Object-level access tests pass for cross-member and cross-department attempts.
- Audit, revocation, rate limiting, recovery and backup/restore tests pass.
- Accessibility, mobile and low-bandwidth QA completed.
- Security review and authenticated end-to-end QA completed.
- Production configuration and release window explicitly approved by the National President.
- Preview/production status and rollback plan recorded before release.

## Current release decision

**NO-GO for production.** The shared-key gate is transitional and is not suitable as the final identity or authorization system. The current work is review-branch engineering only. CI and PR preview checks may run automatically, but no production merge, promotion or deployment is authorized by this programme.


### Additional controls added after the initial inventory

- A closed DOC permission vocabulary is now defined in `lib/doc-permissions.ts`. It defines capability identifiers only; it does not grant access. Runtime policy rejects unknown permission strings even if they appear in a supplied appointment payload.
- The policy test suite now checks that every API route either uses the private no-store response helper or carries an explicit `PUBLIC_API_ROUTE:` classification and rationale. This is a guard against silently adding an unclassified API endpoint.
- Tests cover the closed permission vocabulary and unknown-permission denial.


### Streaming request limits and route guard regression coverage

The bounded JSON reader was strengthened to count bytes while consuming the request stream. It rejects an oversized declared Content-Length early, but also enforces the ceiling on actual streamed chunks when Content-Length is absent or inaccurate. It cancels the stream once the configured byte limit is exceeded and rejects invalid UTF-8 rather than silently replacement-decoding it.

The regression suite now checks:
- Early rejection of an oversized declared Content-Length.
- Actual streamed-body limits for chunked requests.
- Stream cancellation on overflow.
- Invalid UTF-8 rejection.
- Retention of same-origin checks on every current mutation endpoint.
- Retention of staff-session checks on protected meeting read/write endpoints.

These checks are source-level regression safeguards, not a substitute for end-to-end security testing against a running deployment.


### Browser security headers

The application now configures baseline response headers for all routes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Permitted-Cross-Domain-Policies: none`
- A restrictive `Permissions-Policy` disabling unused camera, microphone and geolocation access.
- Production-only HSTS with a one-year max age and deliberately no `includeSubDomains`, because the application is hosted on shared infrastructure.

A regression test checks the production header configuration. A Content Security Policy has not been added yet; it requires a separate audit of scripts, styles, fonts, image origins and any future Google OIDC integration to avoid a falsely restrictive or ineffective policy.


### Operational interface truthfulness

The Officer Access page no longer implies that a Notion roster is a future-ready access-control mechanism. It now explicitly identifies the shared-key gate as transitional, shows identity/membership/appointment/delegation as not implemented or not connected, states the President's decision authority, and lists the four departments without implying that any department head has been appointed.

The meeting intake now presents Standard sensitivity as the only available transitional option, explains why Restricted submissions are unavailable, enforces field length limits in the interface and exposes submission errors as accessible alerts. The server remains authoritative and independently validates all fields.


### Explicit appointment scope and regression verification

Officer permission checks now require both an explicit resource scope supplied by the protected server-side handler and an explicit scope on the trusted appointment:
- Department scope is bound to one department identifier and cannot be used against another department.
- An appointment without scope is denied.
- A department appointment cannot satisfy a global-resource request.
- A global appointment can act across department resources only when global scope is explicitly recorded.
- The Membership Administrator record-maintenance check uses an explicit global resource scope; it remains separate from membership decision authority.

The first CI attempt exposed outdated test fixtures that lacked the newly mandatory scope. Those fixtures were corrected rather than weakening the policy. The latest run for commit `301144868ed02cef907afcf24ebf029908636c54` passed all 53 policy tests and the TypeScript check.

This remains a policy primitive only. No trusted appointment adapter or department-scoped API integration is live yet.


### Operational module readiness register

A protected `/ops/readiness` page now gives staff a single, explicit inventory of current module capability, limitations and dependencies. It records the meeting workflow as limited, membership as not connected, officer access as policy-foundation-only, and Digital Chamber, Action Register and Media & Content Command as placeholders. It also records audit/security operations as not implemented.

The Command Brief links to this register. Environment indicators on the dashboard now say **Configured / Not configured**, not Ready / Missing, and explain that environment-variable presence does not prove database connectivity, integration permissions or end-to-end workflow readiness.

A regression test checks that the readiness page preserves the not-ready warnings and that dashboard language does not turn configuration presence into an operational claim. The readiness page is a transparency and governance aid; it does not itself implement the listed workflows or grant access.


### API route register and placeholder containment

The review branch now contains `docs/ROUTE-SECURITY-REGISTER.md`, a route-by-route inventory of the current API methods, authentication gates, request limits, sensitivity boundaries and known transitional limitations.

A new CI test, `scripts/route-security.test.cjs`, compares the actual `app/api` route tree with the reviewed inventory and checks each route's expected HTTP methods and security markers. An unreviewed route addition or method-surface change fails the test until the security contract is updated. This is a source-level change-control guard, not proof of runtime authorization.

The Digital Chamber, Action Register and Media & Content Command pages now explicitly state that they are not operational. Each page explains what it does not currently do, lists the required workflow before launch, and links to Module Readiness. Regression tests prevent these planned modules from losing their non-operational warnings.

No new operational records, member data, appointments or publication workflows were fabricated. The system remains a review-branch build and the production release decision remains NO-GO.
