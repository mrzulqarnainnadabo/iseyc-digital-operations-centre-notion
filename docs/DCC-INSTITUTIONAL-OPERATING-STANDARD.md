# DCC Institutional Operating Standard
Version: 1.0 — implementation baseline
Status: Technical operating standard for presidential review; not an appointment instrument or delegation of authority.

## 1. System identity and governing rule

The ISEYC Digital Command Centre (DCC) is the institution's controlled operating environment for meetings, communications, Chamber sessions, departmental delivery, decisions, accountability and governance. It is not a public dashboard and it is not a substitute for ISEYC's constitution, approved policies or written delegations.

**Traceability rule:** every consequential work item must carry a stable record identity and a traceable relationship to its source: an approved mandate, meeting, Chamber decision, authorised direction or approved programme. A task, draft, AI output, meeting note or status label is not itself an institutional decision.

**Human authority rule:** software may validate required fields, route work, calculate deadlines, flag overdue items and prepare summaries. Only a verified human with current, relevant authority may approve, publish, close a formal decision, appoint, spend, or exercise chair powers.

## 2. Canonical record model

Use the existing Notion registers as the operational record store. Do not create duplicate shadow registers or invent people, appointments, authority, programme outcomes or approval states.

Every record should expose, where relevant:
- Stable record ID and canonical Notion record link.
- Record type, originating office/department and sensitivity.
- Named responsible role; named person only when identity and appointment are verified.
- Created/updated timestamps and the actor responsible for each material change.
- Current status, next required step and due date.
- Source/authority reference and links to related records.
- Evidence or deliverable link, evidence status and limitations.
- Blocker, escalation owner, escalation date and resolution note.
- Decision/approval reference, approving actor and authority basis when applicable.

A missing field must remain visibly missing. Never fill it with a guessed person, date, status, evidence item or approval.

## 3. Meetings — the DCC Meeting Standard

### Required meeting brief
Before a meeting is treated as ready, its record must contain:
1. Meeting title and purpose.
2. Convening body and accountable convenor.
3. Meeting owner/secretariat role.
4. Proposed date, time and time zone; venue or meeting link where appropriate.
5. Required participants by role; attendance is recorded separately after the meeting.
6. Sensitivity classification (Standard or Restricted) and access handling.
7. Agenda with numbered items, each stating the question or outcome sought.
8. Pre-reading/document links and the officer responsible for each paper.
9. Decisions required, decision authority and any conflicts/recusals to declare.
10. Expected outputs and report/minutes owner.

### Meeting lifecycle
- **New:** intake received; not yet checked.
- **Draft:** convenor/secretariat is completing the brief.
- **In review:** secretary/authorised reviewer checks completeness, agenda, sensitivity and authority.
- **Approved:** authorised convenor confirms the meeting brief and circulation.
- **Held:** meeting occurred; attendance and proceedings are being recorded.
- **Minutes due:** draft minutes and action proposals are outstanding.
- **Closed:** minutes/record accepted by the authorised officer and all resulting actions have been created or explicitly marked as no action.
- **Archived:** retained under the approved records schedule; not deleted as a shortcut.

The current Meetings database may have a smaller set of statuses. Until its schema is formally extended, the application must not pretend that unsupported lifecycle states exist. Use linked records and clearly labelled workflow milestones rather than writing unconfigured status values.

### Meeting pack and minutes
The secretary records attendance by participant/role, apologies, chair, agenda item, concise discussion summary, decision wording, dissent/recusal where relevant, action owner role, due date, evidence expected and next review date. Draft minutes remain draft until accepted through the approved human process.

### Deadline and reporting standard
- Agenda papers: due at least 48 hours before an ordinary scheduled meeting unless the authorised convenor records an exception.
- Draft minutes: due within 48 hours after the meeting.
- Action owners: acknowledge assignment within 2 working days.
- Progress updates: at least weekly while an action is active, and immediately when blocked.
- Missed deadline: system flags overdue; owner records cause, recovery date and support/decision required.
These are proposed default service levels; an authorised office may record a reasoned exception for a particular meeting.

## 4. Communications — controlled editorial lifecycle

Each communication record must contain a content brief, audience, purpose, channel, originating department/office, factual claims and their sources, sensitivity/privacy check, non-partisanship check, owner, reviewer and intended publication window.

Lifecycle:
1. **Brief:** purpose, audience, message, format, channel, source material and desired action.
2. **Draft:** editable copy or asset; version and author recorded.
3. **Review:** factual, editorial, accessibility, privacy, safeguarding, brand and non-partisanship review.
4. **Revision required:** reviewer comments are recorded and assigned; previous versions remain traceable.
5. **Approved:** named approver, authority basis, timestamp and approved final version are recorded.
6. **Published:** channel, publication URL/reference, date/time and publishing officer recorded.
7. **Corrected/withdrawn:** reason, authority, replacement/correction link and affected channels recorded.
8. **Archived:** retained for institutional recordkeeping.

Approval and publication are separate events. An approved draft is not evidence of publication. A publication record must never be created automatically merely because content is approved. No AI or shared-key session may approve or publish.

## 5. Digital Chamber — formal session protocol

A Chamber session record must identify the convening authority, chair, secretary, session date/time, session type, attendance/quorum basis where applicable, agenda, controlled papers, sensitivity, decision items and record custodian.

Chair controls must be explicit and permission-checked:
- Open session / confirm agenda.
- Call and close agenda items.
- Record a motion or proposed resolution.
- Record the decision wording and outcome as stated by the chair.
- Record abstention, dissent, conflict or recusal where applicable.
- Pause/adjourn/resume/close the session.
- Direct the secretary to prepare minutes and decision records.

The software may present these controls only to an authenticated user whose active appointment and explicit Chamber chair delegation are verified. A UI button, role label or Notion view filter is not proof of chair authority. Where quorum or voting rules are not formally defined, the system must label the field “not configured” and must not calculate or infer a valid decision.

### Decision handoff
A Chamber decision is first captured as a draft decision record. The authorised chair confirms the wording and outcome; the secretary verifies the minutes reference. Only then may an authorised officer submit it to the Council Decisions & Action Register with decision date, authority, rationale, approval evidence and accountable role. Linked actions inherit the decision reference, owner role, due date, deliverable/evidence requirement and reporting cadence. A Chamber session marked Closed does not automatically mean every action is complete.

## 6. Actions and accountability

An action record must include:
- Clear outcome-oriented title and description.
- Originating meeting/decision/direction/programme reference.
- One accountable owner role; contributors are separate.
- Department/office scope.
- Priority, due date and expected evidence/deliverable.
- Current status and last progress update.
- Blocker/dependency, support or decision required.
- Escalation level, escalation recipient and date.
- Completion evidence and reviewer/acceptance record.

Lifecycle:
- **Open:** accepted for assignment/follow-up; not yet started.
- **In progress:** owner has begun work.
- **Blocked:** cannot proceed; blocker, owner and required intervention are mandatory.
- **Done:** owner submitted completion evidence; not automatically verified.
- **Accepted:** authorised reviewer accepts the evidence/outcome.
- **Archived:** retained under records policy.

“Done” and “Accepted” are intentionally different. Do not mark an action complete solely because its due date passed or an owner says it is finished.

### Escalation ladder
- Due in 48 hours: reminder to accountable owner.
- Due date missed: overdue flag and recovery note required.
- 3 working days overdue: escalate to the relevant department head/line manager.
- 5 working days overdue or cross-department blocker: COO/Chief of Staff coordination, depending on originating authority.
- 10 working days overdue, material risk or unresolved authority issue: Council/President decision queue.
- Safety, privacy, safeguarding, financial-control or security incident: immediate escalation through the designated incident route; do not wait for the routine ladder.
Escalation proposes attention; it does not transfer ownership or grant approval power.

## 7. Department desks and reporting

The four department desks are first-class workspaces, not decorative tiles:
- Education & Capacity Building.
- Health & Well-being.
- Software & Technology.
- Civic Department.

Each desk must show its own approved programmes/work, accountable role, milestones, due/overdue work, blockers, evidence, submitted reports and decisions required. A department user must not see another department's restricted records merely because a client-side filter hides them.

Minimum reporting rhythm:
- Weekly work update: progress, next milestone, due dates, blockers, decisions needed.
- Monthly department report: planned work, completed work, outputs, evidence/outcomes, risks/blockers, budget summary where authorised, data limitations and decisions required.
- Quarterly review: performance, lessons, capability, risk and next-quarter priorities.

Separate activity, output and outcome. Do not present attendance, posts, meetings, submissions or money spent as verified impact without supporting evidence. Report limitations and missing data.

## 8. Governance, identity and permissions

Authentication proves control of an account; it does not prove appointment or authority.

Required access decision for every protected request:
1. Verify the individual identity through the approved identity provider.
2. Match immutable provider subject to one membership record.
3. Resolve an approved, current appointment record and its term/status.
4. Resolve department/office scope and explicit permissions.
5. Check record sensitivity and requested operation.
6. Check any action-specific delegation, separation-of-duties and conflict constraints.
7. Write a durable audit event for every privileged read or mutation as required by policy.

Proposed membership states: Invited, Verified, Active, Suspended, Revoked. Appointment states remain governed by the Appointment & Role Register. A verified Google account or individual PIN alone must never activate an appointment.

Permission dimensions must be independent:
- View / create / edit / submit / review / approve / publish / chair / administer.
- Department and portfolio scope.
- Record sensitivity.
- Effective start/end date.
- Delegation source and expiry.
- Revocation state.

Technology administrators may maintain systems but do not thereby acquire institutional approval authority. Special Advisers are advisory by default. Department Heads are scoped to their department. Cross-department and Presidential/Council powers require explicit written delegation. Revocation must take effect server-side and invalidate active sessions/tokens as appropriate.

## 9. Durable audit and evidence integrity

Audit events must be append-only from the application perspective and stored outside mutable business-record fields. Capture event ID, actor subject, resolved appointment, action, target record, timestamp, request/correlation ID, authority/delegation basis, outcome, and a minimal before/after state or cryptographic reference. Do not log secrets, PINs, tokens or unnecessary sensitive content.

Evidence is a linked artefact, not a status label. Record who supplied it, when, what claim it supports, verification state, reviewer and limitations. Preserve prior versions and correction history. A Notion page's ordinary edit history alone is not a complete application audit design.

## 10. Release gates

The DCC is not production-ready for executive onboarding until all are evidenced:
- Individual sign-in and verified appointment resolution.
- Server-enforced least privilege and department boundaries.
- Session expiry and immediate revocation.
- Action-level permission and separation-of-duties tests.
- Durable audit storage with retention and access controls.
- Meeting-to-decision-to-action traceability tests.
- Communications approval/publication separation tests.
- Chamber chair/secretary authority and quorum policy confirmed.
- Notion schema contract tests against actual databases.
- Pagination, retry, rate limits, monitoring and recovery.
- Backup/restore and incident-response rehearsal.
- Preview QA on mobile, tablet and desktop using real authorised test accounts.
- Explicit human release approval and rollback plan.

## 11. Current implementation boundary

The existing authenticated Actions, Media and Chamber register slice supports bounded Notion reads and initial record creation only. It is not the full standard above. It does not yet provide individual identity, appointment-backed permissions, action lifecycle transitions, editorial approval/publication, attendance/minutes, chair controls, department scope enforcement or durable audit. These must remain visibly unavailable rather than simulated.

The next implementation sequence is:
1. Reconcile all application environment IDs against the canonical Notion data sources and verify integration sharing.
2. Build the Meetings brief, minutes and action-handoff workflow using the actual Meetings schema.
3. Build department desks on the approved Programmes & Work and Department Reports & Scorecards data sources.
4. Implement the communications version/review/approval/publication evidence chain.
5. Implement Chamber session controls and decision handoff after chair/secretary authority is defined.
6. Replace shared-key access with individual identity and appointment-backed permissions.
7. Add durable audit, monitoring, backup/restore and release gates.


## 12. External organisations, invitations and partnership engagement

The DCC must support external institutional participation as a first-class meeting workflow. An external organisation may be invited to an internal meeting, consultation, technical session, programme activity, roundtable or partnership discussion. External participation does not grant internal membership, voting rights, Chamber access, access to restricted papers, or authority to represent ISEYC.

### Organisation and contact records

Maintain a canonical organisation record and separate contact-person records where the approved data model supports them. Do not use the legacy Sponsors or Other Clubs contact lists as the DCC's authoritative partner register: their current schemas contain only basic contact fields and do not capture institutional verification, engagement history, invitation permissions, confidentiality or agreement status.

An organisation record should capture:
- Registered/display name, organisation type, official website and public contact channel.
- Country/state/location and institutional remit.
- Verification state, source URL/evidence and verification date.
- Relationship owner within ISEYC and responsible department/office.
- Engagement category: prospective partner, invited participant, active collaborator, funder/sponsor, service provider, research institution, public institution, civil-society organisation or other.
- Relationship status and last reviewed date.
- Conflict, safeguarding, reputational, privacy or political-neutrality flags where relevant, with restricted access for sensitive notes.

A contact record should capture name, official role, organisation link, work email/phone, preferred contact channel, source and verification date, consent/contact preference where applicable, and the ISEYC officer responsible for the relationship. Personal contact information must not be exposed to all meeting participants by default.

### Meeting invitation record

Each invitee is a separate record linked to the meeting and organisation. Capture:
- Organisation and named contact, or clearly labelled generic institutional office when no individual is known.
- Invitation purpose and expected contribution.
- Participation type: observer, presenter, technical contributor, panelist, resource person, institutional representative, prospective partner, host or other explicitly defined role.
- Agenda item(s) relevant to the invitee.
- Invitation owner and authorising office.
- Invitation channel, sent date, sender and a copy/reference of the invitation.
- Response state: Draft, Awaiting approval, Approved to send, Sent, Accepted, Declined, Tentative, No response, Withdrawn, Attended, Did not attend.
- Response timestamp and any conditions or accessibility requirements.
- Access pack and document permissions, with expiry and least-privilege scope.
- Follow-up owner, due date and outcome.

An invitation must not be marked Sent until a human officer confirms the actual dispatch and records its channel/reference. A calendar invite or email draft is not proof of dispatch. A response is not proof of attendance. Attendance is recorded by the meeting secretary. Do not infer RSVP from email delivery, and do not automatically add external contacts to internal Notion workspaces.

### Invitation approval and dispatch

Before external invitations are sent, the workflow checks:
1. The meeting is approved for external participation by its authorised convenor.
2. The invitee's organisation and contact are sufficiently verified for the purpose.
3. The invitation wording, agenda scope, documents and requested contribution are approved by the responsible officer.
4. Confidentiality, safeguarding, privacy and non-partisanship checks are complete.
5. The recipient list and document access are limited to what the invitee needs.
6. The dispatching officer is authorised and the dispatch record is retained.

For a meeting involving multiple organisations, each organisation receives its own invitation record, appropriate recipient handling and response state. Do not expose other invitees' personal email addresses through a shared recipient list.

### External participation during the meeting

The secretary records the organisation, participant name/role, attendance times where appropriate, agenda items attended, contribution or presentation reference, any declared interest/conflict, and any follow-up requested. External participants are clearly distinguished from ISEYC officers, members, observers and guests. Their attendance does not count toward internal quorum or voting unless an approved governing instrument explicitly says otherwise.

External participants receive only approved, purpose-specific documents. Restricted Chamber papers, internal deliberations, personnel records and private member data remain excluded unless an authorised disclosure decision is recorded.

### Partnership pipeline — separate from meeting status

An external meeting may produce a lead, but not an automatic partnership. Track the relationship separately through:
- Prospect identified.
- Due diligence / institutional verification.
- Introductory engagement.
- Concept note or proposal requested.
- Proposal under development.
- Internal review.
- Negotiation / clarification.
- Agreement approved by the competent authority.
- Agreement executed and effective.
- Active delivery / monitoring.
- Completed, declined, paused, expired or terminated.

Only the competent authority may approve or execute an MoU, grant, sponsorship, data-sharing arrangement, procurement, financial commitment or formal partnership. Store the signed instrument, authority basis, signatories, scope, term, obligations, deliverables, reporting, financial/data commitments, safeguarding and termination provisions. A positive meeting, verbal expression of interest, email exchange or invitation acceptance must never be represented as an active partnership.

### Post-meeting follow-up

Within two working days of the meeting, the responsible ISEYC officer records:
- Attendance and participation outcome.
- Key points and commitments, attributed to the relevant organisation/contact.
- Documents or information promised, with due dates.
- ISEYC actions and external follow-ups as separate action records.
- Whether a concept note, second meeting, due diligence or no further action is required.
- The next contact owner and follow-up date.

External organisations do not become DCC users merely because they were invited. If a secure external collaboration space is later introduced, it must use separate external identities, explicit resource-level permissions, expiry, revocation and audit. Do not expose the internal executive workspace.

### Release requirements for external engagement

Before enabling this workflow in production, verify:
- A dedicated approved Partner Organisations register and External Contacts register exist, with documented schemas and data owners.
- Meeting-to-invitation and invitation-to-organisation relationships are durable and queryable.
- Invitation status is updated only by authenticated, authorised actions.
- Dispatch evidence is captured without claiming that the application itself sent an email unless a connected mail provider confirms it.
- External access is separate from internal executive access.
- RSVP, attendance and partnership agreement are distinct states.
- Data retention, consent, contact correction and deletion handling are defined.
- Tests cover duplicate invitations, wrong recipients, withdrawn invitations, expired access, privacy leakage and unapproved partnership claims.

Until the dedicated registers and access controls are available, the DCC may prepare invitation briefs and drafts but must label them as drafts and must not claim to have sent invitations or established partnerships.


### Formal partnership and commitment register

The Notion workspace now includes a dedicated **DCC — Partnership Agreements & Commitments** register, related to Partner Organisations, originating Meetings and Meeting Invitations. Use it for MoUs, partnership agreements, sponsorships, research collaborations, data-sharing arrangements and service agreements. The register records competent authority, approval reference, signatory roles, execution/effective/expiry dates, signed instrument, obligations, deliverables, reporting cadence, financial commitments and safeguarding/privacy conditions.

A record may be created as a lead or draft, but the status must not be set to Approved, Executed or Active without the relevant authority and documentary evidence. The register's existence does not mean the application currently supports its full workflow; the app integration remains a separate implementation and release gate.
