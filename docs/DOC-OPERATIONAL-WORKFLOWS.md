# Digital Operations Centre — operational workflow implementation

## Delivered in this change
- Adds authenticated, server-side Notion read and create adapters for the existing Actions, Media and Chamber databases.
- Adds a shared mobile-first register interface with refresh, live records, Notion deep links and record creation.
- Adds bounded cursor pagination to Actions, Media and Chamber operational registers, with a load-more interaction and response validation.
- Requires an accountable owner role when creating an action; the form explicitly states that this is not an access grant or proof of appointment.
- Adds cursor pagination to the external invitation register; organisation/contact directory selectors and the approved-meeting option list remain limited to their first 50 records and must not be treated as exhaustive.
- Restricts creation to initial states: Actions=Open, Media=Draft, Chamber=Scheduled.
- Keeps approval, publication, closure and formal decisions disabled because the current shared-key session does not establish individual identity or appointment authority.
- Fails closed when a register is not configured, returns a malformed response or Notion cannot be reached. It never substitutes demo rows or inferred counts.
- Adds external organisation and contact registers, approved-meeting invitation drafts, and a separate agreements/commitments register.
- Separates the external-engagement workspace into Invitations, Organisations & Contacts, and Agreements views.
- Prevents duplicate organisation/contact records, filters out paused/declined/former relationships, validates the meeting handoff against the approved meeting list, and never exposes raw relation IDs as names.
- Invitation creation requires an accountable owner role and creates Draft only. No email, letter, external access, approval or partnership status is created automatically.

## Required Vercel environment
Existing settings must contain the exact approved Notion database IDs:
- NOTION_TOKEN
- NOTION_ACTIONS_DATABASE_ID
- NOTION_MEDIA_DATABASE_ID
- NOTION_CHAMBER_DATABASE_ID
- NOTION_PARTNER_ORGANISATIONS_DATABASE_ID
- NOTION_EXTERNAL_CONTACTS_DATABASE_ID
- NOTION_MEETING_INVITATIONS_DATABASE_ID

The Notion integration must be explicitly shared with each database. A populated environment variable alone does not prove access; test each module after preview deployment.

## Remaining release blockers
1. Replace shared-key sessions with individual identity plus active appointment/delegation resolution and revocation.
2. Enforce per-user, per-resource permissions for all reads and writes; add durable append-only audit events.
3. Add action updates, assignment validation, decision linkage, evidence and closure workflow.
4. Add media review/approval and publication evidence; publishing remains human-controlled.
5. Complete invitation approval, dispatch evidence, RSVP updates, attendance confirmation and follow-up. Do not automate dispatch until individual officer authority is implemented.
6. Integrate the Partnership Agreements & Commitments register into the application only after individual permissions and approval authority are available.
5. Add Chamber attendance, agenda, minutes and decision handoff with verified chair/secretary authority.
7. Connect department programme and report registers using approved IDs and department-scoped access.
8. Extend pagination to organisation/contact directory selectors and approved-meeting options; add distributed rate limits, monitoring, backup/restore and recovery tests.
9. Run CI, preview deployment, and mobile/tablet/desktop QA before release.

This change is not production authorization and does not make the entire DOC release-ready.
