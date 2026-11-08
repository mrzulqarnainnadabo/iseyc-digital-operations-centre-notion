# IDCC launch security and scale audit

**Review date:** 8 November 2026  
**Reviewed ref:** `main` at `3549a20c3494618c9323f6c8a337318238467fb7`  
**Scope:** This repository only: ISEYC Digital Operations Centre (Next.js + Vercel + Notion).  
**Verdict:** **NO-GO for multi-person restricted operations.** The public information site can be assessed separately from the restricted DOC workflow.

This is a source review, not a penetration test, load test, live Vercel verification, or confirmation that production environment variables and Notion permissions are correct. Findings below distinguish confirmed source facts from risks that require environment/runtime verification.

## Ranked findings

### P0 — Block launch of restricted operations

#### 1. Shared staff key is not individual authentication
- **Evidence:** `lib/auth.ts`, `app/api/auth/login/route.ts`, `app/api/meetings/route.ts`, `app/api/meetings/[id]/route.ts`.
- **Impact:** Anyone who obtains the one shared key inherits the same 12-hour session capability. Actions cannot be attributed to a person. Staff departure cannot selectively revoke access.
- **Exact fix:** Replace the shared-key gate with server-side individual sessions created only after Google OIDC identity verification AND a trusted, active membership record match by immutable Google subject. Resolve appointment, permission and resource scope from trusted server-side records on every protected handler. Do not grant access from email, UI state, a role title, or the pending-identity cookie. Keep legacy access disabled after migration and rotate the shared key.
- **Do not:** Treat the existing OIDC pending-identity proof as an operations session; the current code correctly does not do so.

#### 2. Login endpoint has no durable rate limit or lockout
- **Evidence:** `app/api/auth/login/route.ts` performs same-origin, bounded-body and constant-time key checks, but has no attempt limiter.
- **Impact:** Automated guessing can make unlimited attempts across serverless instances. Same-origin checks and constant-time comparison do not stop distributed guessing.
- **Exact fix:** Add a shared, durable rate-limit store (for example a managed Redis/KV service) and enforce per-IP plus per-account/global ceilings before key verification; use escalating delay and alerting, avoid permanent attacker-triggerable lockout, and return generic errors. Add tests for concurrent requests, multi-instance behavior, expiry and store failure. Fail closed for privileged sign-in when the limiter is unavailable.
- **Blocker:** No durable rate-limit provider is configured in this repository. Do not substitute an in-memory Map or a per-instance counter; those are ineffective on serverless deployments.

#### 3. Stateless sessions cannot be revoked individually
- **Evidence:** `lib/auth.ts` signs a timestamp, nonce and HMAC; `verifySessionToken` checks a 12-hour age. There is no server-side session registry or revocation lookup.
- **Impact:** Logout clears the current browser cookie only. A copied token remains valid until expiry or global staff-key rotation.
- **Exact fix:** Issue opaque random session IDs; store only a hash of each ID in a durable session store with subject, issued-at, expiry, last-used, and revoked-at fields. Rotate session IDs after authentication/privilege changes; revoke on logout, staff removal and incident response. Check the store on every protected request. Add session-store outage and revocation integration tests.
- **Blocker:** Requires an approved durable session store and individual identity model; do not claim revocation based on cookie clearing.

#### 4. Google OIDC does not establish membership or officer authority
- **Evidence:** `app/api/auth/oidc/callback/route.ts` creates a pending identity proof; `app/api/auth/oidc/status/route.ts` explicitly returns `accessGranted: false`. No trusted membership/appointment adapter is wired into API routes.
- **Impact:** A Google-verified person is not necessarily an approved member or authorised officer. Enabling the pending cookie as access would be an authorization vulnerability.
- **Exact fix:** Implement a server-only adapter to verified membership, appointment and delegation records; bind by immutable Google subject; enforce status, effective dates, revocation, permission and resource scope on every handler. Keep all decision/appointment actions unavailable until this is tested against trusted data. Never activate template records or infer appointment from email/title.

#### 5. No durable audit trail tied to authenticated actors
- **Evidence:** Meeting create/status handlers mutate Notion but do not persist an independent append-only actor/action audit event.
- **Impact:** You cannot reliably answer who changed a record, what changed, when, under which authority, or whether an event was later edited/deleted in Notion.
- **Exact fix:** Add an append-only audit sink with immutable actor subject from the verified session, action, target ID, timestamp, prior/new state, reason, request/correlation ID and authorization decision. Restrict write access, monitor failures, and test tamper resistance and retention. Do not accept actor identity from request JSON. Do not write sensitive contents into logs.

### P1 — High operational and scale risk

#### 6. Meeting list fetches and retains the entire Notion database
- **Evidence:** `lib/notion.ts:listMeetings()` loops through every Notion cursor and accumulates every page; `app/ops/queue/page.tsx` expects one complete `meetings` array.
- **Impact:** Response time, memory use, Notion API calls and client rendering all grow with the total number of records. At 10x data volume, each queue load still reads the entire database. Large histories can time out or exhaust function memory.
- **Exact fix:** Implement cursor pagination end-to-end. Query only the required properties, sort newest-first, return a bounded page (for example 25–50 records) plus an opaque next cursor, validate/limit cursor input, and update the queue UI with Next/Previous or load-more. Add tests for empty pages, invalid cursors, repeated cursors, page boundaries and Notion errors. Do not silently truncate a full list while presenting it as complete.

#### 7. Notion is on the synchronous critical path without resilience
- **Evidence:** `listMeetings`, `getMeeting`, `createMeeting` and `setMeetingStatus` call Notion directly; there is no cache, circuit breaker, retry budget or explicit Notion rate-limit handling in this adapter.
- **Impact:** Notion latency/outage/rate limits become user-visible queue failures. Naive retries under load can amplify an outage.
- **Exact fix:** Set bounded request timeouts, retry only safe reads and transient 429/5xx responses with jitter and a strict retry budget; respect Retry-After. Do not blindly retry writes because a timed-out write may already have succeeded. Add idempotency keys for create operations and reconcile ambiguous writes. Add a short-lived cache only for non-sensitive list data after access checks, with explicit stale-data labels. Test throttling, timeout and duplicate-submit cases.

#### 8. Dependency installation is not reproducible
- **Evidence:** Repository tree has no `package-lock.json`; workflow `.github/workflows/doc-policy-tests.yml` runs `npm install --ignore-scripts`.
- **Impact:** CI and deploy builds can resolve different transitive dependency versions over time. A previously green build can change without a source change, making regressions and supply-chain review harder.
- **Exact fix:** Generate and commit a reviewed npm lockfile using the chosen Node/npm versions; switch CI to `npm ci`; add dependency review and scheduled `npm audit`/update review. Pin or constrain critical packages deliberately and review Next.js/React advisories before upgrades. Do not claim dependencies are vulnerability-free until an audit has run against the lockfile.

#### 9. Security test suite is mostly source-shape regression, not runtime authorization proof
- **Evidence:** `scripts/route-security.test.cjs` asserts source markers and source ordering; `scripts/access-control.test.cjs` tests policy primitives. There are no demonstrated end-to-end tests exercising real route handlers with authenticated/unauthenticated sessions and Notion boundaries.
- **Impact:** A marker can remain in source while the actual runtime behavior is broken. Tests do not prove cookie behavior, deployment headers, Notion permissions, multi-instance rate limiting or resource authorization.
- **Exact fix:** Keep the current policy tests, then add route integration tests with mocked identity/session and Notion adapters for anonymous, legacy, pending, rejected, suspended, expired, active member, wrong department, insufficient permission, revoked appointment, cross-record access, malformed body, CSRF and Notion failure. Add browser smoke tests for login, queue, detail, mutation and logout.

#### 10. Notion database ID validation is not an access-control boundary
- **Evidence:** `lib/notion.ts:assertInternalDb()` binds to environment-configured IDs and blocks one known public database ID.
- **Impact:** A valid but incorrectly configured environment variable can still point the integration at an unintended database. Syntax validation does not prove the integration's workspace sharing or least privilege.
- **Exact fix:** Verify the integration is shared only with the intended DOC databases; use separate integrations/workspaces for restricted classes where feasible; verify database identity at deployment/readiness checks; keep membership, personnel, finance and safeguarding records out until their data stores and access model are approved. Add a safe startup/configuration check that reports database names/IDs only to authorised administrators, never public responses.

#### 11. Public/restricted same-host path isolation is transitional
- **Evidence:** Public routes and `/ops` share one host; session cookie is scoped to `/ops`; API aliases are nested under `/ops/api`.
- **Impact:** The current path boundary is useful, but it is not a separate security origin. Future routes, proxy rewrites, service workers or broad cookie changes can accidentally blur public and restricted surfaces.
- **Exact fix:** Before officer onboarding, move restricted operations to a dedicated hostname with separate cookie scope, strict host allowlist, independent deployment configuration and explicit CORS/CSRF policy. Until then, keep all protected API handlers independently authenticated and add route-inventory tests for every new route.

### P2 — Medium launch quality / long-term maintenance

#### 12. Browser Content Security Policy is absent
- **Evidence:** `next.config.js` sets nosniff, frame denial, referrer, permissions and HSTS headers, but no CSP.
- **Impact:** The app has fewer browser-enforced mitigations if a script injection flaw is introduced. CSP is defence-in-depth, not a substitute for safe rendering.
- **Exact fix:** Add a nonce-based CSP compatible with the deployed Next.js rendering mode; start with report-only, review violations, then enforce. Avoid broad `unsafe-eval`/wildcard sources. Add header tests and verify production pages/assets/OIDC redirects before enforcement.

#### 13. No verified production release / deployment evidence
- **Evidence:** README records the last previously verified production source as `6158b85...`, states later mainline Vercel build-rate-limit failure and says later mainline is not verified live. Current GitHub Vercel status is green, but that status alone does not prove the supplied production domain serves the expected commit.
- **Impact:** Users can see 404s or stale code even when GitHub main is correct.
- **Exact fix:** Confirm the Vercel project/team/domain mapping, obtain a READY production deployment tied to the intended commit, then smoke-test `/`, `/explore`, `/login`, unauthenticated `/ops`, authenticated queue and logout. Record deployment ID, commit SHA, domain and test result. Do not change domains, project ownership, environment variables or access protection merely to make a status turn green.

#### 14. Operational UI language can be mistaken for operational capability
- **Evidence:** Readiness and dashboard screens show configured/not-connected status; login offers Google identity verification while stating officer access is not connected.
- **Impact:** Staff may interpret an identity check or configured environment variable as a functioning authorised workflow.
- **Exact fix:** Keep explicit state labels tied to verified backend capability; distinguish configured, connected, authenticated, authorised and operational. Hide or disable unavailable workflows and show the responsible blocker. Do not show success solely because an environment variable exists.

## Existing controls worth preserving

- Login and mutations check same-origin before processing writes.
- Request JSON is bounded while streaming and validates content type/UTF-8.
- Staff session cookies are HttpOnly, SameSite=Lax and scoped to `/ops`.
- Session tokens use HMAC and constant-time comparison, with strict token parsing and a 12-hour expiry.
- OIDC flow uses state, nonce, PKCE S256 and Google JWT verification.
- Pending OIDC identity is explicitly not an operations session.
- Private API responses use no-store headers.
- Meeting data is bound to the configured internal Meetings database; status mutation rechecks the Notion parent database.
- Legacy access is limited to explicitly Standard sensitivity; the legacy session cannot approve/archive or set Draft.
- Public pages do not directly load the restricted Notion adapter.
- Existing tests cover important authorization-policy primitives and route inventory.

These controls reduce risk; they do not close the P0 findings.

## Required order of work

1. Select and configure durable rate-limit, session and audit storage.
2. Implement individual identity + trusted membership/appointment resolution; keep legacy access contained until migration is verified.
3. Add route-level authorization and audit integration tests; preserve decision authority boundaries.
4. Add paginated Notion reads, bounded retry behavior and idempotent write handling.
5. Commit lockfile, switch CI to `npm ci`, run dependency audit.
6. Add CSP in report-only mode, then enforce after browser validation.
7. Verify Vercel project/domain/production commit and run authenticated mobile smoke tests.
8. Only then reconsider the NO-GO decision.

## Launch decision

**Restricted DOC operations: NO-GO.** The shared key, lack of durable rate limiting/revocation, missing trusted membership/appointment adapter, absent durable audit trail and unbounded queue reads are material blockers.

**Public institutional pages: conditional.** Their source boundaries look deliberately separated, but production deployment/domain behavior still needs a real HTTP smoke test. A green GitHub Vercel check is not proof that the user-facing production hostname resolves to that deployment.

No secrets, Vercel settings, Notion data, permissions, membership rows or appointments were changed during this review.
