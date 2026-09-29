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

## Meetings Notion schema

| Property | Type | Values |
|----------|------|--------|
| Name | Title | required |
| Status | Select | New, Draft, In review, Approved, Archived |
| Convening body | Rich text | |
| Meeting date | Date | |
| Summary | Rich text | |
| Sensitivity | Select | Standard, Restricted |

Never use the public Civic Mandate database ID for DOC ops.
