# Digital Operations Centre — operational workflow implementation

## Delivered in this change
- Adds authenticated, server-side Notion read and create adapters for the existing Actions, Media and Chamber databases.
- Adds a shared mobile-first register interface with refresh, live records, Notion deep links and record creation.
- Restricts creation to initial states: Actions=Open, Media=Draft, Chamber=Scheduled.
- Keeps approval, publication, closure and formal decisions disabled because the current shared-key session does not establish individual identity or appointment authority.
- Fails closed when a register is not configured or Notion cannot be reached. It never substitutes demo rows or inferred counts.

## Required Vercel environment
Existing settings must contain the exact approved Notion database IDs:
- NOTION_TOKEN
- NOTION_ACTIONS_DATABASE_ID
- NOTION_MEDIA_DATABASE_ID
- NOTION_CHAMBER_DATABASE_ID

The Notion integration must be explicitly shared with each database. A populated environment variable alone does not prove access; test each module after preview deployment.

## Remaining release blockers
1. Replace shared-key sessions with individual identity plus active appointment/delegation resolution and revocation.
2. Enforce per-user, per-resource permissions for all reads and writes; add durable append-only audit events.
3. Add action updates, assignment validation, decision linkage, evidence and closure workflow.
4. Add media review/approval and publication evidence; publishing remains human-controlled.
5. Add Chamber attendance, agenda, minutes and decision handoff with verified chair/secretary authority.
6. Connect department programme and report registers using approved IDs and department-scoped access.
7. Add pagination, distributed rate limits, monitoring, backup/restore and recovery tests.
8. Run CI, preview deployment, and mobile/tablet/desktop QA before release.

This change is not production authorization and does not make the entire DOC release-ready.
