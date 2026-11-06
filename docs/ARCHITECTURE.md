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
| Supabase Auth | Transitional signed staff session (`ISEYC_STAFF_KEY`); opt-in Google OIDC identity verification is implemented but does not grant access |
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


## Identity and access-control sources

- `docs/MEMBERSHIP-REGISTER-SPEC.md` defines the restricted membership source; it has not been created or connected.
- `docs/APPOINTMENT-REGISTER-SPEC.md` defines the restricted appointment/role source; it has not been created or connected.
- `docs/ACCESS-CONTROL-MODEL.md` and `docs/AUTHORIZATION-TEST-MATRIX.md` define the required authorization and test boundaries.
- Google OIDC verifies identity only. Until membership and appointment sources, individual sessions, route-level authorization and durable audit are implemented, the OIDC flow does not grant command-desk access.
