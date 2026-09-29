# ISEYC Digital Operations Centre — Notion architecture

## Product identity

Same institutional DOC:

- Command Brief
- Meeting intake → queue → human review/approve
- Digital Chamber, Media, Actions
- Links to Civic Mandate & Civic Brain
- Non-partisan; human authority final

## Platform change only

| Was | Now |
|-----|-----|
| Supabase Auth | Signed staff session (`ISEYC_STAFF_KEY`) |
| Postgres + Drizzle | Notion databases |
| Express + Vite | Next.js App Router on Vercel |

## Server environment

Required server-only variables:

- `ISEYC_STAFF_KEY` — shared officer authentication key. Never expose as `NEXT_PUBLIC_*`.
- `NOTION_TOKEN` — Notion integration token.
- `NOTION_MEETINGS_DATABASE_ID` — internal Meetings database ID.

Optional module database IDs:

- `NOTION_MEDIA_DATABASE_ID`
- `NOTION_CHAMBER_DATABASE_ID`
- `NOTION_ACTIONS_DATABASE_ID`

The staff key is verified server-side and represented in the browser only by an httpOnly, same-site session cookie. Production cookies are Secure.

## Meetings Notion schema

| Property | Type | Required for intake | Read fallback |
|----------|------|---------------------|---------------|
| Name | Title | yes | `Title` |
| Status | Select or status-compatible field | yes | `Status` |
| Convening body | Rich text | no | `ConveningBody` |
| Meeting date | Date | no | `Date` |
| Summary | Rich text | no | `Notes` |
| Sensitivity | Select | no | — |

Canonical writes use the property names above. If Notion permissions or property types do not match, the API returns a safe setup message rather than exposing provider details.

Never use the public Civic Mandate database ID for DOC ops.

## API contract

Authenticated meeting routes use:

- Success: `{ ok: true, error: null, data: ... }`
- Client validation: `{ ok: false, error: "...", data: null }` with `400`
- Missing/invalid session: `401`
- Missing Notion configuration or integration/database setup failure: `503`
- Missing record: `404`
- Unexpected server failure: `500`

Mutation routes re-check the staff session server-side. Status changes are validated against the current record before the Notion update; human approval remains the final institutional action.