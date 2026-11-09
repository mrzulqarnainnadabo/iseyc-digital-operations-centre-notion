# ISEYC Digital Operations Centre

The canonical ISEYC Digital Operations Centre (IDCC/DOC) implementation is **Next.js + Vercel + Notion**. Supabase/Postgres belongs to a separate legacy implementation and is not part of this repository.

## Release and deployment position

This is a point-in-time engineering record, not a live deployment monitor.

- Last previously verified production deployment source: `6158b85ac190dc655cb670910d87833103fc8316` (Vercel reported READY on 6 November 2026).
- Mainline has advanced beyond that deployment source. The latest Vercel check on the current mainline reports a **build-rate-limit failure**; this does not establish whether an earlier deployment remains available or whether the latest code is live.
- The latest mainline Vercel status is a **build-rate-limit failure**, not a verified successful deployment. No deployment of the later mainline security work is claimed.
- Vercel project: `iseyc-digital-operations-centre-notion`.
- Project domain: `https://iseyc-digital-operations-centre-not.vercel.app`.
- Vercel previously reported SSO protection for deployment domains except custom domains. The intended staff access path must be confirmed before onboarding.

**READY is a deployment/build state, not proof of operational readiness.** Production HTTP behaviour, Notion credential validity, integration permissions, officer sign-in and end-to-end workflows still require verification. A Vercel SSO gate may appear before the application's own sign-in screen.

## Public and restricted environments

The IDCC root is the public institutional home. Public routes include `/`, `/departments`, `/departments/[department]`, `/explore`, `/submit`, `/explain`, `/method` and `/contact`. Department pages read only the allowlisted public v1 Observatory World Bank pilot series for education and health. They do not create a second civic-record database or access restricted DOC records. Software/technology and civic-service indicator gaps remain visible. See [the public evidence integration note](docs/PUBLIC-EVIDENCE-INTEGRATION.md).

Restricted institutional operations remain under `/ops` and are protected by the existing server-side session gate. The transitional session cookie is scoped to `Path=/ops`; meeting API browser requests use `/ops/api/meetings`. OIDC transaction cookies are scoped to the callback path. Public pages do not use the restricted session. This same-host path isolation is transitional; a separate operations hostname is preferred before officer onboarding.

Public pages do not imply that the underlying civic products are nationally operational. Each product retains its own source, deployment and evidence limitations.

## Current application scope

The repository now contains:

1. A transitional shared-key sign-in and signed session.
2. Google OIDC identity-verification foundations using authorization code + PKCE, state/nonce and strict token checks.
3. A short-lived pending-identity proof after OIDC callback.

**Google identity verification is not membership approval, an operations session or officer authorisation.** The OIDC callback does not activate a person or grant permissions. The shared staff key remains the current operational sign-in gate; it is not individual identity or role-based access control.

The operations surface includes a command desk and Notion-backed meeting intake, listing and review workflow. Under the legacy shared-key boundary, only explicitly permitted standard meeting operations are available. Approval, restricted-meeting access and other privileged actions require individually authorised officer access and remain unavailable until the identity, appointment and route-level authorisation gates are complete.

The Chamber, Media and Actions databases already exist in Notion, but their full application workflows are not yet established by the inspected source. Separate registers for appointments, programmes, Council decisions, learning and departmental scorecards are workspace records; they are **not yet trusted, integrated authorisation sources** for this application.

## Existing Notion databases — reuse, do not duplicate

The workspace already has these internal DOC databases:

| Environment variable | Existing database | Notion page |
| --- | --- | --- |
| `NOTION_MEETINGS_DATABASE_ID` | ISEYC DOC Meetings | [Open database](https://app.notion.com/p/8b745d054ad14afebaba89dbe7f129ed) |
| `NOTION_MEDIA_DATABASE_ID` | ISEYC DOC Media | [Open database](https://app.notion.com/p/0c39821ed4144a90acb62333fa2542ed) |
| `NOTION_CHAMBER_DATABASE_ID` | ISEYC DOC Chamber | [Open database](https://app.notion.com/p/2c1e64d702cd4b55ad81995785166d50) |
| `NOTION_ACTIONS_DATABASE_ID` | ISEYC DOC Actions | [Open database](https://app.notion.com/p/9a32cbe45bc04f9cb32ac8cb2d11e425) |

These databases and their schemas have been found in the Notion workspace. This does not prove that the dedicated API integration used by the Vercel application has been shared with them. Share only the databases required by the application and verify access with the integration itself.

### Existing governance source — not yet integrated

- **Appointment & Role Register**: existing Notion database `b9750d94-400f-4393-ad11-0e6a501c0ccd`; data source `collection://c689c101-c875-4048-adc9-b1d54731d3be`. The inspected register contains 11 `Template` rows and 0 named appointees. It is not an operational access source until the approved identity-linking fields, permissions, scope, provenance and revocation controls are added and verified.
- **Membership Register**: no dedicated membership database was found in the inspected DOC workspace. The Field Register Desk is an unrelated RSVP/activities register and must not be repurposed. Do not create a duplicate or connect an unrelated register without the founder's approved schema and access model.

The existing appointment database must be extended in place only after governance approval. No membership or appointment records are created or activated by this repository.

## Environment configuration

Use the keys and descriptions in `.env.example` as the source of truth. Configure them in the correct Vercel project and deployment environments. Never commit real values, print secret values in logs or paste tokens into Notion pages. Confirm values privately; the presence of a Vercel environment-variable entry alone does not prove that the value is valid.

## Development and deployment

1. Work on a feature branch. Do not make unreviewed changes directly on `main`.
2. Reuse the existing Notion databases above; do not create duplicates.
3. Verify the dedicated Notion integration has access to each database required by the feature.
4. Configure secrets in Vercel without exposing them.
5. Run lint, type checks, tests and production build.
6. Open a pull request with exact-head test evidence and security notes.
7. Deploy only after review and explicit release approval.
8. Verify the deployed application, role access and rollback path before activation.

## Institutional readiness gates

Before multiple officers are onboarded:

- Establish and approve authoritative membership and appointment registers, custodians, stable identifiers and provenance.
- Link each appointment to an immutable verified identity; never match an account by email alone.
- Implement individual sessions, rotation, expiry and centrally effective revocation.
- Enforce permission and resource scope on every protected server route; UI hiding is not authorisation.
- Bind approval actions to formally delegated authority and preserve a durable audit trail.
- Add distributed rate limiting / abuse protection and complete route-level security tests.
- Verify restricted-record segregation, least-privilege integration sharing, export/backup and a tested restore procedure.
- Confirm the SSO/domain strategy supports intended authorised officers without weakening access controls.
- Complete mobile, accessibility and low-bandwidth acceptance tests.

No member rows or officer appointments are created by this repository change. No person is activated by Google sign-in. No privileged permission is inferred from a title, email address or user interface.

AI-generated summaries and recommendations remain drafts. AI must not approve decisions, appoint people, commit funds, publish institutional statements or mark evidence verified.

## Product boundaries

IDCC provides the public institutional entry point and a separate restricted operating environment. Civic Mandate Nigeria, ISEYC Civic Brain and the Civic Intelligence Observatory remain distinct public civic systems with their own data ownership and release gates; IDCC composes them rather than copying their records into a second civic database. Do not copy private personnel, finance, health, safeguarding or contributor records into public civic datasets.

This repository is not a public campaign site and must preserve ISEYC's non-partisan institutional identity.
