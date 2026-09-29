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
