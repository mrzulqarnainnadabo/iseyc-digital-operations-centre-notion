# Department operating registers

**Status:** Reconciled against the current GitHub adapters and the live Notion database schemas inspected on 11 November 2026. This confirms schema visibility, not production app connectivity or row-level readiness.

## Purpose

Provide one consistent operating record for all four departments without inventing programmes, work, officers, membership, approvals, statistics or outcomes.

The Digital Operations Centre uses **two shared internal Notion registers**, not one database per department and not a separate work-plan database:

1. **IDCC — Programmes & Work Register** — programme proposals and operational work-plan items, distinguished by `Work Type`.
2. **IDCC — Department Reports & Scorecards** — periodic department reports and outcome reviews.

Meetings, Actions, Media and External Engagement remain institution-wide registers.

## 1. Programmes & Work Register

**Notion database:** IDCC — Programmes & Work Register  
**Environment:** `NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID`  
**Data source:** `collection://b3fe5a7d-ffda-4da1-a6f3-c03c5a81b3b8`

One database stores both programmes and work-plan items. The `Work Type` select distinguishes the two record types:

- `Programme` — a department programme proposal.
- `Operations` — a department work-plan item or operational task.

Other existing Work Type options include Project, Training, Research and Community Engagement. Do not create or configure `NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID`; the application deliberately aliases the work-plan adapter to this shared register.

### Live Notion schema

| Notion property | Type | Current application use |
|---|---|---|
| Programme / Work Item | Title | Record title |
| Department | Select | Department filter and stable-ID mapping |
| Work Type | Select | `Programme` or `Operations` filter |
| Status | Status | Proposed, Approved, In Progress, Under Review, Completed, Paused, Cancelled |
| Intended Outcome | Text | Programme objective or work-plan objective |
| Acceptance Criteria | Text | Programme deliverables or work-plan deliverable |
| Accountable Role | Text | Role title only; does not appoint a person |
| Start Date | Date | Programme and work-plan start date |
| Due Date | Date | Programme end date or work-plan due date |
| Priority | Select | Optional Critical, High, Medium or Low priority on programme and work-plan drafts |
| Risk Level | Select | Optional Low, Moderate, High or Critical risk classification on programme and work-plan drafts |
| Contributors | Text | Supporting teams / role titles only; not personal identity or appointment proof |
| Evidence / Deliverable | URL | Optional HTTPS source/deliverable link read and written by programme and operations adapters |

The application now maps Priority, Risk Level and Contributors for programme and work-plan records. Contributors are labelled for teams and role titles only. Budget Requested, Budget Approved and Actual Spend are number fields formatted as dollars in the current Notion schema; the application deliberately does not expose them until the institution confirms the currency convention and financial permissions. Approval Reference and Last Reviewed also remain outside the shared-key workflow.

### Department select compatibility

The application uses stable internal IDs while writing the exact options that currently exist in Notion:

| Stable ID | Canonical display name | Existing Notion option |
|---|---|---|
| `education` | Education and Capacity Building | Education & Capacity Building |
| `health` | Department of Health and Well-being | Health & Well-being |
| `digital-systems` | Software and Technology | Digital Systems & Technology |
| `civic-affairs` | Civic Department | Civic Affairs & Public Accountability |

The application must write the existing Notion option exactly. Do not use display labels as security identifiers. Unknown Notion values remain `Unspecified` and require review; they must not silently default to a department.

### Application write boundary

The application creates programme and work-plan records in **Proposed** status. It does not accept a status supplied by the browser and does not provide an approval action. A proposed record is not an approved programme, budget, commitment or instruction to begin delivery.

## 2. Department Reports & Scorecards

**Notion database:** IDCC — Department Reports & Scorecards  
**Environment:** `NOTION_DEPARTMENT_REPORTS_DATABASE_ID`  
**Data source:** `collection://2cd472ec-1eba-4425-bb51-c714dc8bc4a2`

### Live Notion schema and current adapter mapping

| Notion property | Type | Current application use |
|---|---|---|
| Report / Period | Title | Report title and period label |
| Department | Select | Department filter and stable-ID mapping |
| Reporting Cycle | Select | Weekly, Monthly, Quarterly or Annual |
| Reporting Period Start | Date | Start of reporting period |
| Reporting Period End | Date | End of reporting period |
| Status | Status | Draft, Submitted, Under Review, Accepted, Revision Required or Archived |
| Completed Work | Text | Reported activities and outputs |
| Risks & Blockers | Text | Challenges, constraints and unresolved risks |
| Decisions Required | Text | Outstanding decisions and actions |
| Outcomes / Evidence | Text | Outcome narrative and evidence summary |
| Outputs | Text | Specific outputs recorded separately from the general completed-work narrative |
| Planned Work | Text | Next work, distinct from completed activity |
| Prepared By Role | Text | Declared role title only; not verified identity |
| Evidence Links | URL | Optional HTTPS source link read and written by the report adapter |
| Data Limitations | Text | Limitations read and written by the report adapter |

Outputs, Planned Work and Prepared By Role are now mapped. Prepared By Role is a declared title, not a verified user identity. Reviewed By Role and Budget Summary remain intentionally excluded from the shared-key API until individual reviewer authority and finance access controls are implemented. Evidence Links and Data Limitations are mapped; evidence URLs must use HTTPS. The current adapter reads/writes the two period dates as separate properties; it must not treat the start field as a date range.

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

The current register adapters provide basic programme/work-plan and report fields. They do not yet provide a fully structured evidence-assessment relation to Observatory source IDs, a verified appointment-to-user binding, budget authorisation or independent outcome certification. Do not represent those capabilities as live.

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
- Required property names and types match the live schema.
- Exact department select values are written for all four departments.
- Programme and Operations work types remain distinct within the shared work register.
- Programme and report period dates map to the correct Notion properties.
- Department filters return only the intended department's records.
- Pagination, empty states and upstream failures behave honestly.
- Create flows produce Proposed or Draft records only.
- No approval, publication, external dispatch or completion certification occurs under shared-key access.
- Mobile and desktop workflows are tested with authorised test records before national presentation.

**Operating rule:** one shared Programmes & Work Register, one Reports & Scorecards register, four distinct departmental mandates, and one institution-wide evidence standard.
