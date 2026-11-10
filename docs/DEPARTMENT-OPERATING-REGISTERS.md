# Department operating registers

Status: Architecture and environment contract for presidential technical review. Not live-verified in Preview.

## Purpose

Support programme management, work planning and departmental reporting without inventing records or granting appointment authority.

## Shared vs department-specific

| Concern | Approach |
|---------|----------|
| Meetings | Shared institutional Meetings register (existing) |
| Actions / follow-ups | Shared Actions register (existing) |
| Communications | Shared Media register (existing) |
| External partners | Shared external engagement registers (existing) |
| Programmes | Department-scoped rows · API + UI implemented · env required |
| Work plans | Department-scoped rows · API + UI implemented · env required |
| Department reports | Department-scoped rows · API + UI implemented · env required |

Do not create four separate programme databases per department unless governance requires isolation beyond a Department property filter.

## Notion databases (create & share to go live)

### 1. DCC — Department Programmes

Environment: `NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID`

Suggested properties:

- Name (title)
- Department (select: Education, Health, Digital Systems, Civic Affairs)
- Status (select: Planning, Draft, Active, On hold, Completed, Closed)
- Objectives (rich_text)
- Target community (rich_text)
- Geography (rich_text)
- Activities (rich_text)
- Deliverables (rich_text)
- Start date (date)
- End date (date)
- Accountable role (rich_text) — role title only until appointments exist
- Evidence notes (rich_text)

### 2. DCC — Department Work Plans

Environment: `NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID`

Suggested properties: Name, Department, Programme (relation), Objective, Deliverable, Due date, Dependencies, Accountable role, Status, Progress note, Evidence notes.

### 3. DCC — Department Reports

Environment: `NOTION_DEPARTMENT_REPORTS_DATABASE_ID`

Suggested properties: Name, Department, Report type, Period, Summary, Challenges, Outstanding actions, Recommendations, Status (Draft / Submitted for review / Archived).

## Access requirements

- Share each database with the DOC Notion integration.
- Configure environment variables on Vercel Preview before claiming live list/create.
- Server routes must require staff session, same-origin on writes, fail closed when unset.
- Approval and certification of reports remain disabled under shared-key sessions.

## Application behaviour today

- `lib/department-operations.ts` defines mandates, functions and record models.
- Routes: `GET/POST /ops/api/department-programmes`, `department-workplans`, `department-reports`.
- Adapters: `lib/notion-department-programmes.ts`, `notion-department-workplans.ts`, `notion-department-reports.ts`.
- UI panels on each department desk: programme, work-plan and report create/list with pagination.
- Creation limited to Draft/Planning (programmes), Planned (work plans), Draft (reports).
- Department workspaces show honest **Not connected** states when env vars are absent.
- No demo programmes, officers or statistics are generated.
- `assertInternalDb` allowlists the three `NOTION_DEPARTMENT_*` env names.
