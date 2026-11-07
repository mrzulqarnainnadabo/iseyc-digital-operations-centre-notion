# DOC API route security register

Checkpoint: 6 November 2026  
Status: transitional shared-key architecture; not production-ready.

This register is the reviewed inventory of API routes in `app/api`. The automated test suite compares the actual route tree and exported HTTP methods with this register. Adding, removing or changing a route requires an explicit security review and corresponding test update.

## Route inventory

| Route | Methods | Current authentication / protection | Permitted legacy behavior | Explicit limitation |
|---|---|---|---|---|
| `/api/auth/login` | POST | Same-origin, 2 KiB bounded JSON, strict string key parser, private no-store response | Establishes a 12-hour shared-key session | No individual identity, durable rate limiting or central session revocation |
| `/api/auth/logout` | POST | Same-origin, private no-store response | Clears the browser's session cookie | A copied stateless token remains valid until expiry or staff-key rotation |
| `/api/meetings` | GET, POST | Staff session; POST also same-origin and 16 KiB bounded JSON; private no-store response | Reads only explicitly Standard records; creates explicitly Standard submissions | No actor-bound audit, individual membership or officer authorization |
| `/api/meetings/[id]` | GET, PATCH | Staff session; PATCH also same-origin and 8 KiB bounded JSON; private no-store response; Notion parent-database check | Reads Standard records; can move Standard record to In review only | Cannot approve, archive or return to Draft; no individual identity or department scope |

## Global requirements

- Every route returns private no-store responses unless it is explicitly marked `PUBLIC_API_ROUTE:` with a rationale.
- Every state-changing route checks same-origin before processing the body.
- Every protected operational read or mutation checks the transitional staff session server-side.
- Request bodies are size-limited while streaming, require JSON media type, reject malformed JSON and reject invalid UTF-8.
- Input fields use allowlists; unknown fields are rejected.
- Meeting records must belong to the configured internal Meetings database.
- Legacy meeting access is limited to explicit Standard sensitivity. Missing, unknown, Restricted or malformed sensitivity is denied.
- No route accepts a browser-supplied identity, role, membership status, appointment, permission or audit actor.
- Public civic products and APIs are separate from DOC internal data. No DOC API is intentionally public at this checkpoint.

## Change control

A new route is not complete until all of the following are done:

1. Add its path and methods to `contracts` in `scripts/route-security.test.cjs`.
2. Document authentication, allowed behavior, data classification and limitations here.
3. Add route-level tests for unauthenticated, unauthorized, malformed-input and authorized cases.
4. Verify private cache headers and same-origin protection for mutations.
5. Verify object-level resource checks and database ownership checks where applicable.
6. Confirm that no public civic API or client bundle can reach DOC-only records.
7. Obtain review before any production merge or deployment.

The route inventory test intentionally fails when a new or removed API route has not been reviewed. It is a change-control guard, not proof of runtime security or a substitute for authenticated end-to-end tests.

## Current release decision

**NO-GO for production.** Shared-key authentication is transitional. Individual OIDC identity, trusted membership and appointment adapters, complete object-level authorization, durable audit events, distributed rate limiting, session revocation and authenticated browser QA remain outstanding.


## Guard ordering regression checks

The route-security test suite also checks that:
- Login rejects cross-origin requests before parsing the submitted key.
- Meeting creation checks origin and the staff session before parsing the body or writing to Notion.
- Meeting updates check origin and the staff session before parsing the body, loading the target record or mutating it.
- Meeting collection and detail reads authenticate before retrieving Notion records.

These are source-order regression checks. They help detect accidental refactors that move data access ahead of a guard, but they do not replace runtime tests of the deployed framework and middleware.


## Notion database configuration boundary

The current meeting adapter now accepts only a canonical 32-hex-character Notion database ID from `NOTION_MEETINGS_DATABASE_ID`. It rejects malformed IDs and binds every meeting read/create/update operation to that named setting. A request-supplied or otherwise unbound database ID is not accepted by the adapter. The known Civic Mandate public database remains explicitly blocked.

This is configuration integrity, not a complete Notion tenancy boundary: a deployment administrator could still point the environment variable at another valid Notion database. Before enabling restricted membership, personnel, finance or safeguarding records, create and verify dedicated restricted databases, their page sharing, workspace permissions and integration access. The application must not claim that syntactic ID validation proves Notion access isolation.


## Public IDCC and restricted cookie boundary (review branch)

The IDCC root and the routes `/explore`, `/submit`, `/explain`, `/method` and `/contact` are public, read-only composition pages. They do not read Notion operational databases and do not consume restricted session cookies.

The existing shared staff session is scoped to cookie path `/ops`. Browser meeting operations use `/ops/api/meetings` and `/ops/api/meetings/[id]`, whose handlers delegate to the existing server-side authenticated meeting handlers. The OIDC pending-identity status endpoint is available at `/ops/api/auth/oidc/status` so its proof cookie can remain scoped to `/ops`. OIDC transaction cookies are scoped to `/api/auth/oidc` because only the callback needs them.

The older `/api/meetings` paths remain guarded by the same server-side session checks, but the restricted browser no longer uses them; the `/ops` cookie is not sent to those public-path URLs. Public pages must not read or depend on restricted cookie values. This same-host path isolation is transitional; a dedicated operations hostname remains preferable before officer onboarding.
