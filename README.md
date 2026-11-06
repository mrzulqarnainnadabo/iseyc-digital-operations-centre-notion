# ISEYC Digital Operations Centre

Proper DOC product on **Notion + Vercel** (Supabase removed by design).

## What this is

Institutional Digital Operations Centre:

1. Officer sign-in (staff key → session)
2. Command Brief
3. **Meeting intake → queue → human approve** (Notion)
4. Chamber / Media / Actions module slots (same pattern next)
5. Links to live Civic Mandate & Civic Brain

## Deploy

1. Create Vercel project from this repo
2. Set env from `.env.example`
3. Create Notion **Meetings** database (see `docs/ARCHITECTURE.md`)
4. Share DB with integration; set `NOTION_MEETINGS_DATABASE_ID`

## Not this

- Not the thin Command Hub shell
- Not Supabase
- Not a public campaign site


## Individual identity verification (opt-in, not access authorisation)

The feature branch includes a Google OpenID Connect identity-verification flow. It is disabled unless `DOC_GOOGLE_CLIENT_ID`, `DOC_GOOGLE_CLIENT_SECRET` and a separate `DOC_SESSION_SECRET` (at least 32 bytes) are configured. Register the exact callback URL `https://<DOC-host>/api/auth/oidc/callback` in the Google OAuth client.

Google identity verification alone does **not** grant access to the command desk. The flow creates a short-lived pending-identity proof only; the operations layout and APIs do not accept that proof as a session. Trusted ISEYC membership, current appointment, scoped permissions, revocation and durable audit integration remain release gates. No production environment settings are changed by this repository work.
