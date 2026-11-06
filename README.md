# ISEYC Digital Operations Centre

The canonical ISEYC Digital Operations Centre (IDCC/DOC) implementation is **Next.js + Vercel + Notion**. Supabase/Postgres belongs to a separate legacy implementation and is not part of this repository.

## Verified deployment position

As of 6 November 2026:

- Vercel project: `iseyc-digital-operations-centre-notion`
- Production deployment: Vercel reports **READY**
- Production source: `main` at commit `6158b85ac190dc655cb670910d87833103fc8316`
- Vercel project domain: `https://iseyc-digital-operations-centre-not.vercel.app`
- Vercel reports SSO protection enabled for deployment domains except custom domains.

**READY is a deployment/build state, not proof of operational readiness.** The production HTTP response, Notion credential validity, integration permissions, officer sign-in and end-to-end workflows still require verification. The current `.vercel.app` domain may require Vercel team authentication before the application's own sign-in screen is reached. Confirm the intended staff access path before onboarding.

## Current application scope

The repository currently contains:

1. Officer sign-in using one shared `ISEYC_STAFF_KEY` and a signed session.
2. Institutional landing / command surface.
3. Notion-backed meeting intake, listing and status updates.
4. Links to Civic Mandate and Civic Brain.

The shared staff key is a temporary single-credential gate, **not individual identity or role-based access control**. Do not onboard multiple officeholders with it.

The Chamber, Media and Actions databases already exist in Notion, but their full application workflows are not yet established by the inspected source. The separate IDCC registers for appointments, programmes, Council decisions, learning and departmental scorecards are Notion workspace records; they are **not yet integrated into the Next.js application**.

## Existing Notion databases — reuse, do not duplicate

The workspace already has these internal DOC databases:

| Environment variable | Existing database | Notion page |
| --- | --- | --- |
| `NOTION_MEETINGS_DATABASE_ID` | ISEYC DOC Meetings | [Open database](https://app.notion.com/p/8b745d054ad14afebaba89dbe7f129ed) |
| `NOTION_MEDIA_DATABASE_ID` | ISEYC DOC Media | [Open database](https://app.notion.com/p/0c39821ed4144a90acb62333fa2542ed) |
| `NOTION_CHAMBER_DATABASE_ID` | ISEYC DOC Chamber | [Open database](https://app.notion.com/p/2c1e64d702cd4b55ad81995785166d50) |
| `NOTION_ACTIONS_DATABASE_ID` | ISEYC DOC Actions | [Open database](https://app.notion.com/p/9a32cbe45bc04f9cb32ac8cb2d11e425) |

These databases and their schemas have been found in the Notion workspace. This does not prove that the dedicated API integration used by the Vercel application has been shared with them. Share only the databases required by the application and verify access with the integration itself.

## Environment configuration

Configure the keys listed in `.env.example` in the correct Vercel project and the appropriate deployment environments:

- `ISEYC_STAFF_KEY`
- `NOTION_TOKEN`
- `NOTION_MEETINGS_DATABASE_ID`
- `NOTION_MEDIA_DATABASE_ID`
- `NOTION_CHAMBER_DATABASE_ID`
- `NOTION_ACTIONS_DATABASE_ID`

Never commit real values, print secret values in logs, or paste tokens into Notion pages. Confirm values privately; the presence of a Vercel environment-variable entry alone does not prove that the value is valid.

## Development and deployment

1. Work on a feature branch. Do not make unreviewed changes directly on `main`.
2. Use the existing Notion databases above; do not create duplicates.
3. Verify the dedicated Notion integration has access to each database required by the feature.
4. Configure secrets in Vercel without exposing them.
5. Run lint, type checks, build and relevant workflow tests.
6. Open a pull request with test evidence and security notes.
7. Deploy only after review and explicit release approval.
8. Verify the deployed application, role access and rollback path before activation.

## Institutional readiness gates

Before multiple officers are onboarded:

- Replace the shared key with individual identities, role-based permissions, per-person revocation and auditable actor identity.
- Bind approval actions to formally delegated authority.
- Add durable audit history for approvals, access changes and sensitive actions.
- Add rate limiting / abuse protection, CSRF or explicit origin validation, sanitised API errors and complete Notion cursor pagination.
- Verify restricted-record segregation, least-privilege integration sharing, export/backup and a tested restore procedure.
- Confirm the SSO/domain strategy supports the intended authorised officers without weakening access controls.
- Complete mobile, accessibility and low-bandwidth acceptance tests.

AI-generated summaries and recommendations remain drafts. AI must not approve decisions, appoint people, commit funds, publish institutional statements or mark evidence verified.

## Product boundaries

The DOC is an internal institutional operating system. Civic Mandate Nigeria, ISEYC Civic Brain and the Civic Intelligence Observatory remain separate public-facing civic products. Do not copy private personnel, finance, health, safeguarding or contributor records into public civic datasets.

This repository is not a public campaign site and must preserve ISEYC's non-partisan institutional identity.
