# ISEYC Digital Operations Centre — Design System & Screen Specification

Status: implementation specification for the private officer interface. This document does not establish appointments, permissions, membership, or operational readiness.

## Product rules

1. IDCC has two environments: public institutional information routes and restricted officer operations. This specification describes the restricted officer interface; public pages are a separate, read-only composition layer.
2. Human officers own institutional seats and decisions. AI may assist with drafts but cannot approve, appoint, publish, or represent an officer.
3. External civic links open published public surfaces only. Internal submissions, membership data, officer records, and deliberations remain private.
4. A configured integration is not proof of operational workflow. A visible route is not proof of authority.
5. Empty means the connected source returned no records. Not connected means the source is unavailable or unconfigured. Never collapse these states.

## A. Design tokens

Official identity: use the supplied ISEYC seal as a small header mark, never as a full-bleed background. Primary institutional surfaces show the full name, Initiative for Sustainable Evolution for Youth and Community; compact navigation uses ISEYC. Do not invent replacement logo artwork.

| Token | Value | Intended use |
|---|---|---|
| Forest 950 | #123B2F | Institutional shell and dark command surface |
| Forest 900 | #123B2F | Primary actions and navigation |
| Forest 800 | #194B3B | Hover and selected states |
| Forest 100 | #E8F0EA | Quiet selected surfaces |
| Cream 50 | #FAF9F5 | Application canvas |
| White | #FFFFFF | Cards and form surfaces |
| Ink 950 | #202923 | Main text |
| Ink 700 | #626D65 | Secondary text |
| Ink 600 | #626D65 | Metadata |
| Gold 600 | #A7833F | Restrained accent and section eyebrow |
| Border | #E4E6DF | Dividers and card outlines |
| Success | #28664A | Confirmed operational state only |
| Warning | #93651D | Awaiting human action |
| Danger | #A43D37 | Rejected or destructive state |

Typography: Inter/system sans for UI; Georgia/Cambria serif only for major page titles. 12px metadata, 14px secondary copy, 16px body, 20px section titles, 26–28px mobile page titles.

Spacing: 4px base scale; primary rhythm 8/12/16/20/24/32px. Mobile gutters 16px; desktop gutters 32px. Card padding 16–20px. Section gap 24px.

Radius: 8px controls, 9px buttons, 12px cards, 16px large panels. Elevation: subtle 1px border plus low-opacity shadow; no floating glass shell.

Buttons: one primary action per view. Primary = forest fill/white text; secondary = white/line border/forest text; quiet = text action. Destructive action must be explicit and confirmed. Disabled controls explain why.

Badges: small outlined/pale surfaces; no oversized coloured pills. Labels must map to actual state: Operational, Partial, Not operational, Published, Draft, Awaiting human review, Verified. "Verified" is reserved for an explicit verification process, never inferred from publication.

Accessibility: semantic headings, 44px minimum touch targets, visible focus rings, sufficient contrast, labelled controls, reduced-motion support, keyboard access, no colour-only status communication.

## B. Component inventory

- AppShell / DocShell: responsive institutional navigation, identity context, sign-out, footer and published-system links.
- MobileNavigation: compact horizontal scroll row with visible focus and active route.
- PresidentialCouncilStrip: role seats only when configured; unconfigured state must say seat register is not connected.
- DepartmentCard: department name, factual description, operational state, and readiness dependency.
- SharedFunctionCard: Communications under Chief of Staff; explicitly not a fifth department.
- QueueSummary: counts only when the source is connected and loaded successfully.
- ApprovalQueueRow: title, source metadata, current workflow state, and open-for-review action.
- AI Draft Banner: only rendered when a record is explicitly marked as AI-generated; text: "AI draft — not an institutional decision." Must sit above the human approval area.
- HumanDecisionPanel: Accept / Edit / Return / Reject; enabled only when server confirms individual identity, appointment scope, permission and audit capability. Otherwise show disabled state with reason.
- StatusBadge: evidence-style, text-labelled state.
- EmptyState: distinguish no records from unconfigured source.
- LoadingState: lightweight skeleton, no layout jump.
- ErrorState: safe message, retry where possible, no raw provider exceptions.
- PrimaryButton / SecondaryButton / QuietButton: shared height, focus and disabled patterns.
- PublishedSystemLink: external link to Civic Mandate or Civic Brain only; no internal record identifiers.

## C. Mobile screen specifications

Primary viewport: 390px wide; support 360–430px without horizontal page overflow.

### 1. Sign-in / session gate

Structure: centered single-column card, no public marketing hero. ISEYC seal and product name; "Private officer access"; short explanation of access limitations; Google identity action only when OIDC provider configuration is ready; clearly separated transitional staff-key fallback while it remains enabled; safe status/error area; small footer with non-partisan and privacy notice.

Preferred state: each person signs in with their own personal Google account. Google OIDC verifies the immutable subject and verified email; it does not itself grant ISEYC membership or office. The server must match the subject to an approved active membership record and a separately active appointment before opening officer routes. The intended six-digit personal DOC PIN is a later additional factor/step-up check; do not display or accept a PIN until secure storage, distributed rate limiting, recovery and audit are implemented. Transitional fallback, if retained, must be labelled "Temporary staff-key access — shared identity; restricted permissions" and must not imply individual accountability. Do not describe a shared key as verified personal identity.

States: provider not configured; Google redirect/loading; invalid or expired identity response; identity verified but membership/appointment authorisation unavailable; PIN required only after the PIN flow is activated; network error with retry; session expired/revoked. Never echo credentials, tokens, PINs or reveal whether an account exists.

### 2. Command home

Header: "Command home", subtitle "Private institutional operations". Dark forest command panel with queue count only when connected, source connection state, and human-authority reminder.

Governance: Presidential Council strip showing role-seat register status. Do not invent seat titles or occupants. If no authoritative register is connected, show "Seat register not connected" and explain that occupancy is not asserted.

Departments: four equal cards — Education & Capacity Building; Health & Well-being; Digital Systems & Technology; Civic Affairs. Each carries a real operational badge and one-line remit. Until trusted role and workflow data exists, use "Not operational" and explain activation dependency.

Shared function: Communications coordination under the Chief of Staff. Clearly label "Shared function — not a fifth department." Its status is independent and factual.

Bottom actions: one primary "Open approval queue"; secondary "New meeting intake". Published-only external links to Civic Mandate and Civic Brain sit in a quiet section, never mixed with private records.

Empty/loading/error: if Notion is unconfigured, show "Not connected" rather than zero. If connected and empty, show "No items awaiting review." On provider failure, suppress counts and show a retryable source error.

### 3. Department desk

Header: department name, role/context label only when identity and appointment are verified, factual operational badge. First panel: open tasks. Second: drafts awaiting review. Third: published civic references with source/date labels. No private Mandate submissions or unpublished civic records.

Empty state: "No open tasks assigned to this department" only if the authoritative task source is connected; otherwise "Department task register not connected." Draft section follows the same distinction. Department authority and edit actions require server-side department scope checks.

### 4. Global approval queue

Header: "Global approval queue", explanation that queue presence is not approval. Compact summary counts only from a successful source response. Filter by workflow state; no campaign rankings or people rankings.

Each row: record title, source/convening body, date, status badge, "Human decision required", and "Open for review". If record has an explicit AI-origin flag, show "AI draft — not an institutional decision" before the human review area.

Review detail: source record and original submission, change history, evidence, and human decision panel. Accept / Edit / Return / Reject actions must be disabled until verified individual identity, appointment scope, action permissions, CSRF protection, and durable audit events are enforced by the server. No optimistic success UI.

States: loading skeleton; connected empty; source not connected; provider error; malformed record; permission denied. Distinguish each.

### 5. Day-1 packet (seat view)

Header: seat title and appointment status, only from a trusted appointment record. If no appointment is present, show "No active appointment record" and no personalised seat packet.

Sections: mandate of the seat; first actions; relevant policies and reporting line; "Human-only responsibilities"; AI staff assistance boundaries; escalation and handover. First actions are templates, not claims that actions have been assigned or completed.

### 6. Meeting intake → queue → human approval

Intake: one-column labelled form; title, convening body, date, summary, sensitivity classification. Explain which sensitivity levels are permitted for the current session. Submit creates a Notion record only; it does not approve it.

Queue: source-backed record status, safe retry, empty and not-connected states. Review: record detail and human decision panel. Every transition is validated server-side and audited. Until identity/RBAC/audit are ready, allow only explicitly authorised transitional actions and make unavailable actions visibly unavailable.

### 7. Module slots: Chamber / Media / Actions

Each page is an honest module shell with a clear "Not operational" badge, short purpose, missing dependencies, and a link to readiness. No fake sessions, attendance, minutes, editorial calendar, action counts, owners, due dates, or outcomes. A configured Notion database alone does not activate the module.

### 8. Cross-links

A quiet "Published civic systems" area links to Civic Mandate Nigeria and Civic Brain. Links open in a new tab and are explicitly labelled public. Do not link to operator/admin routes. Never expose unpublished submissions, private membership lists, officer identities, internal notes, or restricted source records from public routes.

## D. Desktop adaptation

At >=1024px use a 248–264px left navigation rail, sticky top header, content max width 1280px and 32px gutters. Command home uses a three-column summary row, two-column department grid at medium desktop and four columns at wide desktop. Approval queue uses a wider record list with a separate detail pane only when there is enough room; do not shrink mobile controls. Preserve reading order and keyboard flow. Mobile navigation becomes a horizontally scrollable, labelled compact navigation row.

## E. Do not ship

- Invented council roles, filled names, appointments, member counts or department heads.
- "National coverage", impact claims, prevalence estimates, or representative language unsupported by evidence.
- Candidate/party rankings, endorsements, campaign imagery, political party colours or election persuasion.
- AI presented as officer, decision-maker, approver, appointment authority or source of official statements.
- AI-generated drafts without an explicit origin label.
- Fake meeting counts, attendance, action completion, media publication, chamber activity or membership records.
- Public routes exposing unpublished civic submissions, private membership lists, personnel records or internal deliberations.
- Enabled approval controls without server-side identity, scoped permissions and durable audit events.
- "Verified" badges inferred from a Published status.
- A zero count when the source is unconfigured, unavailable, malformed or only partially loaded.

## Founder checklist: real data vs UI

Real data / governance required:
- Approved Presidential Council role list and seat register.
- Verified individual identity provider and account lifecycle.
- Trusted membership and appointment records, including scope and dates.
- Department heads/authorised officers and department-specific permissions.
- Chief of Staff role and Communications delegation.
- Notion database IDs, integration sharing and schema validation for each operational module.
- Real task ownership, drafts, meeting records and evidence.
- Durable audit event storage, session revocation and rate limiting.
- Human approval policy and record retention rules.

UI-only / can be completed without inventing facts:
- Layout, navigation, responsive behaviour, tokens and accessible states.
- Empty, loading, error and not-connected states.
- Module placeholder shells.
- Disabled decision-control presentation with reason.
- Published-only external link cards.
- Documentation and tests for privacy boundaries.
