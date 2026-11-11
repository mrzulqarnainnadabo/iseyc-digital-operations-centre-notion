# Department operating registers

**Status:** Current application/schema contract; live Notion access and records are not verified by this document.

## Purpose

Provide one consistent operating record for all four departments without inventing programmes, work, officers, membership, approvals, statistics or outcomes.

The Digital Operations Centre uses **two shared internal Notion registers**, not one database per department and not a separate work-plan database:

1. **IDCC — Programmes & Work Register** — programme proposals and operational work-plan items, distinguished by `Work Type`.
2. **IDCC — Department Reports & Scorecards** — periodic department reports and outcome reviews.

Meetings, Actions, Media and External Engagement remain institution-wide registers.

## 1. Programmes & Work Register

**Environment:** `NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID`

This single database stores both programmes and work-plan items. The `Work Type` select distinguishes the two record types:

- `Programme` — a department programme proposal.
- `Operations` — a department work-plan item or operational task.

Do not create or configure `NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID`. The application deliberately aliases the work-plan adapter to the Programmes & Work Register so both record types share one controlled register.

### Required properties used by the application

| Notion property | Type | Application use |
|---|---|---|
| Programme / Work Item | Title | Record title |
| Department | Select | Department filter and stable-ID mapping |
| Work Type | Select | `Programme` or `Operations` |
| Status | Status | Proposed, Approved, In Progress, Under Review, Completed, Paused, Cancelled |
| Intended Outcome | Rich text | Programme objective or work-plan objective |
| Acceptance Criteria | Rich text | Programme deliverables or work-plan deliverable |
| Accountable Role | Rich text | Role title only; does not appoint a person |
| Start Date | Date | Programme start date |
| Due Date | Date | Programme end date or work-plan due date |
| Evidence / Deliverable | URL | Optional evidence or deliverable link read by the work-plan adapter |

The current application creates programme and work-plan records in **Proposed** status. It does not accept a status supplied by the browser and does not provide an approval action. A proposed record is not an approved programme, budget, commitment or instruction to begin delivery.

### Department select compatibility

The live Notion select options may retain historical labels. The application maps them to stable internal department IDs:

| Stable ID | Current display name | Existing Notion option |
|---|---|---|
| `education` | Education and Capacity Building | Education & Capacity Building |
| `health` | Department of Health and Well-being | Health & Well-being |
| `digital-systems` | Software and Technology | Software & Technology |
| `civic-affairs` | Civic Department | Civic Department |

Do not use display labels as security identifiers. Unknown Notion values remain `Unspecified` and require review; they must not silently default to a department.

## 2. Department Reports & Scorecards

**Environment:** `NOTION_DEPARTMENT_REPORTS_DATABASE_ID`

### Required properties used by the application

| Notion property | Type | Application use |
|---|---|---|
| Report / Period | Title | Report title and period label |
| Department | Select | Department filter and stable-ID mapping |
| Reporting Cycle | Select | Weekly, Monthly, Quarterly or Annual |
| Reporting Period Start | Date (range supported) | Start and optional end of reporting period |
| Status | Status | Draft, Submitted, Under Review, Accepted, Revision Required or Archived |
| Completed Work | Rich text | Reported activities and outputs |
| Risks & Blockers | Rich text | Challenges, constraints and unresolved risks |
| Decisions Required | Rich text | Outstanding decisions and actions |
| Outcomes / Evidence | Rich text | Outcome narrative and evidence references |

The application creates reports as **Draft**. A draft report is not accepted, certified or published. Submission, acceptance and outcome verification remain separate human-controlled decisions.

## 3. Shared evidence and accountability requirements

Every department follows the same evidence-to-action sequence:

1. Frame the question, population, geography, period and decision.
2. Find relevant Intelligence Observatory evidence and published Civic Mandate records.
3. Use Civic Brain to interpret sources, while retaining source IDs and original provenance.
4. Record what is supported, inferred and unknown, including geography, reference period, units, method and limitations.
5. Propose a programme or work-plan item with an accountable role, intended outcome, deliverable, due date and evidence requirement.
6. Obtain approval from the appropriate verified human authority before committing resources or starting controlled work.
7. Record implementation evidence and blockers.
8. Assess outcomes against a suitable baseline and follow-up method; do not equate activity counts with impact.

The current register adapters provide basic programme/work-plan and report fields. They do **not yet provide a fully structured evidence-assessment relation** to Observatory source IDs, a verified appointment-to-user binding, budget authorisation or independent outcome certification. Do not represent those capabilities as live.

## 4. Access and configuration

- Share only these two internal databases with the DOC Notion integration.
- Configure `NOTION_TOKEN`, `NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID` and `NOTION_DEPARTMENT_REPORTS_DATABASE_ID` in the intended Vercel environment before claiming live persistence.
- The server must continue to allowlist database IDs and fail closed when configuration is missing.
- Department APIs require a staff session; writes require same-origin requests and bounded input.
- Shared-key access does not identify an individual officer or prove appointment, membership or delegated authority.
- Do not expose personnel, finance, health, safeguarding or applicant records through public evidence surfaces.
- No demo programmes, officers, attendance, partner records or performance figures may be generated.

## 5. Release verification

Before enabling department operations, verify each register independently:

- Correct Notion database ID and integration access.
- Required property names and types match the contract above.
- Each department filter returns only the intended department's records.
- Programme and Operations work types remain distinct within the shared work register.
- Pagination, empty states and upstream failures behave honestly.
- Create flows produce Proposed or Draft records only.
- No approval, publication, external dispatch or completion certification occurs under shared-key access.
- Mobile and desktop workflows are tested with authorised test records before national presentation.

**Operating rule:** one shared Programmes & Work Register, one Reports & Scorecards register, four distinct departmental mandates, and one institution-wide evidence standard.
