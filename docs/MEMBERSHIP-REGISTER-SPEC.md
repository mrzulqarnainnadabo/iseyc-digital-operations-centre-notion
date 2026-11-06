# Membership Register — Data and Permission Specification

Status: schema specification only. No dedicated membership register was found in the inspected Notion DOC workspace, and no membership database is connected to the application. The Field Register Desk is an unrelated event RSVP / activities / participants workspace and must not be repurposed as a membership register.

## Governance owner

The National President is the membership governance authority and retains final authority over membership approval, rejection, suspension and reinstatement, and over appointing/removing the person who administers the process.

A Membership Administrator may receive applications, verify completeness, maintain records, prepare recommendations and communicate authorised decisions. Administrative access is not decision authority. A specific delegation of decision authority must be written, scoped, time-limited or review-dated, and revocable by the National President.

## Data boundary

Create a dedicated restricted Notion database for membership operations. It contains personal information and must not be publicly shared, exposed through public civic products, or placed in a public website/API response. Before use, verify actual Notion page sharing, workspace access, integration access and export/backup controls. Notion views and filters are not security boundaries.

Do not store OAuth client secrets, PIN hashes, peppers, recovery codes or session secrets in this database. The Google OIDC subject may be stored as an identity link only after sign-in and must be treated as restricted personal data.

## Proposed properties

| Property | Notion type | Purpose |
| --- | --- | --- |
| Member ID | Title | Internal immutable record identifier |
| Full Name | Rich text | Applicant/member display name |
| Personal Email | Email | Verified personal contact and account lookup |
| Membership Status | Status or Select | Pending, Approved, Rejected, Suspended, Expired |
| Membership Type | Select | ISEYC-defined category; do not invent categories at implementation time |
| Application Date | Date | Application received |
| Decision Date | Date | Date of authorised decision |
| Decision | Select | Approved, Rejected, Suspended, Reinstated, Expired |
| Decision Maker | Person or rich text | Person who made the decision |
| Authority Basis | Select | National President; Recorded Delegation |
| Delegation Reference | URL or rich text | Link/reference to written, scoped delegation where applicable |
| Decision Reason | Rich text | Concise rationale; avoid unnecessary sensitive details |
| Effective From | Date | Start of current membership status |
| Effective Until | Date | Expiry/review date where applicable |
| Google OIDC Subject | Rich text | Stable identity binding after verified OIDC login; restricted |
| Email Verified | Checkbox | Whether the identity provider verified the email |
| Last Access Review | Date | Last membership/access review |
| Administrator | Person or rich text | Operational record handler, not necessarily decision-maker |
| Record Created | Created time | Record creation audit metadata |
| Last Edited | Last edited time | Change metadata |

The register must distinguish the current status from the historical decision trail. Do not overwrite the only evidence of previous approval, suspension or reinstatement. Use a separate append-only Membership Decision & Audit Log database or an equivalent immutable audit mechanism for decision events.

## Permission model

| Actor | Receive/check applications | Maintain records | Recommend | Approve/reject | Suspend/reinstate | Appoint/remove administrator |
| --- | --- | --- | --- | --- | --- | --- |
| National President | Yes | Yes | Yes | Yes | Yes | Yes |
| Appointed Membership Administrator | Yes | Yes | Yes | No, unless specifically delegated | No, unless specifically delegated | No |
| Specifically delegated decision-maker | As scoped | As scoped | Yes | Only within written scope | Only within written scope | No, unless separately authorised |
| Ordinary member | Own application/status only, if enabled | No | No | No | No | No |
| Public visitor | No | No | No | No | No | No |

The National President may personally perform any administrative task. An administrator's ability to update a Notion property must not be treated as sufficient authorisation to perform a governance decision in the application.

## Required decision event fields

Every decision event should capture:
- Unique event ID
- Member ID
- Action and previous/new status
- Decision maker's authenticated identity
- Authority basis: National President or recorded delegation
- Delegation reference and permitted scope, if applicable
- Timestamp
- Reason
- Related application or supporting evidence reference
- Whether the access change was successfully applied
- Actor who entered the record, if different from the decision-maker

## DOC enforcement rules

1. A Google account is an identity, not membership evidence.
2. Match a verified Google identity by immutable OIDC subject after explicit account linking; email is not the permanent identity key.
3. Member routes require a current Approved membership record.
4. Pending, Rejected, Suspended and Expired members are denied member-only routes.
5. Officer routes additionally require a current appointment and matching permission scope from the Appointment & Role Register.
6. Membership administration permissions and membership decision permissions are separate.
7. A decision is valid only when made by the National President or a specifically recorded delegate acting within the delegation's scope and validity period.
8. Revocation or expiry must invalidate affected access promptly; do not rely only on hiding navigation.
9. All protected API routes and server actions enforce the same rules as the UI.
10. Public civic products remain publicly accessible according to their own publication and data rules; the membership register is never a public data source.

## Build and acceptance gates

- [ ] National President approves the exact database properties and access/sharing model.
- [ ] Create restricted Membership Register and Membership Decision & Audit Log.
- [ ] Verify Notion integration has only the minimum required access.
- [ ] Verify ordinary members cannot browse other members' personal records.
- [ ] Verify administrator cannot execute membership decisions without explicit delegation.
- [ ] Verify delegated scope, start/end dates and revocation are enforced server-side.
- [ ] Implement Google OIDC and stable subject linking.
- [ ] Implement server-side member, officer and privileged permission checks.
- [ ] Implement session revocation and audit.
- [ ] Pass direct-route/API authorization tests for every status and role.

No member records, personal emails, identity subjects or appointments should be populated until the access model and register permissions have been tested.


## Member self-service read boundary

A verified active member may receive only a minimal membership summary for their own linked Google OIDC subject. The application must never return the raw Notion page or expose other members through list, search, export, relation, or predictable-ID endpoints.

The National President and an appointed Membership Administrator may access the restricted operational register only through server-side authorization. A Membership Administrator's access is limited to intake, verification, record maintenance and recommendations; it does not grant decision authority. Any API returning membership records must apply this rule independently of UI navigation and must emit a minimal response DTO.

Audit events must identify the authenticated actor from the verified server session. The actor identity must not be accepted from a browser-supplied request field.


## Notion workspace discovery — 6 November 2026

A targeted search of the connected Notion workspace did not identify a dedicated ISEYC Membership Register or member-identity data source.

The similarly named **ISEYC Field Register Desk** is for a separate foundation's event RSVPs, programme activities and participants. It is not an ISEYC membership register and must not be repurposed for member sign-in, membership approval or DOC authorization.

The existing **IDCC — Appointment & Role Register** contains 11 role-template rows; all 11 are in Template status and none has an appointee name. It is not a membership source. Do not treat a role template as an appointment or membership record.

Therefore, the membership source remains absent. The DOC must fail closed for Google identities until a dedicated restricted membership source is approved, created, permissioned and populated by authorised humans.

## Confirmed identity direction and separate PIN gate

The current Notion identity/access decision draft records the National President's direction:
- Each person uses their own personal Google account; shared Gmail accounts are not acceptable.
- An institutional Workspace email domain is not required.
- Google OIDC verifies identity; the immutable Google subject is the durable identity key.
- Membership approval and appointment mapping are separate from Google authentication.
- An individual six-digit DOC PIN is intended as an additional DOC factor, not a substitute for Google MFA.

The PIN implementation remains blocked on a restricted PIN-hash store, a server-side pepper held in encrypted deployment secrets, distributed rate limiting/lockout, recovery policy and audit events. Do not store raw PINs or put PIN hashes in an ordinary membership register. The implementation provider has not been selected or configured.

The current code branch only verifies Google identity and issues a short-lived pending-identity proof. It does not create membership, grant DOC access, or complete the PIN challenge.
