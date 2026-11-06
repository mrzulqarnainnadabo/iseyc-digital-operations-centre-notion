# Trusted Identity, Membership and Appointment Adapter Contract

Status: design contract only; not connected to live member or officer records.

This document defines the minimum conditions under which the Digital Operations Centre (DOC) may consume institutional authority data. It does not create membership criteria, appoint officers, approve a person, or grant a permission. The current release decision remains NO-GO.

## 1. Security objective

The DOC must independently establish four facts before granting an operation:

1. **Identity:** the requester controls a verified Google identity, represented by the immutable OIDC `sub` claim.
2. **Membership:** an authoritative institutional record says that the same person is an approved, currently effective member.
3. **Appointment or delegation:** an authoritative record establishes the person's current office or a specific, time-bounded delegation.
4. **Permission and scope:** that record grants the exact capability against the exact resource scope being requested.

A verified email address, display name, Google account, membership record, role label, UI state, or possession of a legacy shared key is not by itself sufficient.

## 2. Authoritative sources and ownership

Before an adapter can be enabled, the National President must identify and approve:

- the authoritative membership register and its custodian;
- the authoritative appointment register and its custodian;
- the authoritative delegation register and its custodian;
- the authoritative record of the current National President, including effective dates and succession/revocation handling;
- the institutional criteria and workflow governing membership decisions and appointments.

The source owner must confirm the record IDs/database IDs, access model, integration identity, permitted readers, backup/export arrangements, retention policy and correction process. A Notion view, filtered database, copied spreadsheet, user-supplied browser payload or undocumented integration cache is not an authority source.

No production adapter may be enabled while any of these are unresolved. No sample person or placeholder row may be interpreted as a real appointment.

## 3. Minimum record contracts

All records require a stable, opaque internal ID, source reference, record version or last-edited marker, effective dates, status, and provenance sufficient to identify who made or approved the change. Avoid using email address or display name as the primary key.

### Membership

Required fields:

- `membership_id`: stable opaque identifier;
- `google_subject`: exact immutable OIDC subject linked through a reviewed identity-linking process;
- `status`: one of Pending, Approved, Rejected, Suspended, Expired;
- `email_verified`: true only when supported by the verified identity-linking process;
- `effective_from` and optional `effective_until`;
- `decision_id` and decision provenance for approval, suspension, rejection or reinstatement.

A missing, duplicate, ambiguous, malformed, future-effective, expired, suspended or unlinked record must deny access. Email matching alone must never silently link an account. Re-linking a Google subject requires an explicit, attributable review workflow.

### Appointment

Required fields:

- `appointment_id`, `membership_id` and linked `google_subject`;
- `status`: Active, Inactive, Expired or Revoked;
- approved role identifier (descriptive only; never infer permissions from its label);
- explicit permission identifiers from the closed DOC permission catalogue;
- explicit scope: global or one exact department ID;
- `effective_from`, optional `effective_until`;
- appointment decision/provenance and revocation reference where applicable.

An appointment is usable only while its linked membership is active and the appointment itself is active and in date. Missing scope, unknown permission, duplicate active appointment conflict, or invalid dates must deny the affected capability. A department appointment must never be widened to global scope by fallback logic.

### Delegation

Required fields:

- `delegation_id`;
- delegator and delegate membership IDs plus immutable Google subjects;
- the exact decision capabilities delegated;
- effective start and end timestamps;
- approval decision/provenance;
- revocation timestamp/reference, if revoked.

A delegation is valid only if the delegator was the duly authorised National President at the time of grant, the delegate is an active eligible member, the grant is within its effective period, and it has not been revoked. The adapter must verify this from authoritative records; the caller must not supply a trusted President subject or delegation context. Delegation must not be inferred from seniority, title, email, or historical participation.

## 4. Adapter boundary

The future adapter must be server-only and expose a narrow read interface. Browser code and route request bodies must never be able to provide or override authorization context.

Conceptual interface (not an implementation):

```ts
interface TrustedInstitutionalRecords {
  getMembershipByGoogleSubject(subject: string): Promise<TrustedLookup<MembershipRecord>>;
  getActiveAppointments(subject: string, at: string): Promise<TrustedLookup<AppointmentRecord[]>>;
  getActiveDelegations(subject: string, at: string): Promise<TrustedLookup<MembershipDelegation[]>>;
  getCurrentPresident(at: string): Promise<TrustedLookup<PresidentRecord>>;
}
```

Every lookup must return an explicit state such as `found`, `not_found`, `ambiguous`, `unavailable` or `stale`, plus source provenance and checked-at time. Do not collapse provider errors, missing records or ambiguous results into empty successful results. Any non-`found` state needed for an authorization decision fails closed.

The adapter must:

- run only on the server and use a dedicated least-privilege integration identity;
- read only the approved records and fields;
- validate source/database identifiers against deployment configuration;
- validate all field types, enumerations, references and timestamps at runtime;
- reject duplicate or conflicting records instead of choosing the first result;
- enforce an explicit freshness policy approved by the source owner; stale data denies privileged operations;
- return minimal normalized data and never expose private records through public civic APIs;
- avoid logging tokens, personal record contents or sensitive decision reasons.

No write access is needed for the initial authorization adapter. Membership and appointment mutations must remain separate, human-approved workflows.

## 5. Authorization context construction

Only a server-side session verifier and this trusted adapter may construct the authorization context consumed by `lib/access-control.ts`.

The request handler must derive the subject from the verified individual session, then load membership, appointment, delegation and President records from the adapter. It must not accept any of those values from query parameters, request JSON, headers controlled by the browser, client state or cached UI data.

If the source is unavailable, stale, ambiguous or malformed, return a generic denial/unavailable response and record a privacy-minimised security event. Do not silently fall back to the shared staff key, a previous user's context, a synthetic fixture or a stale permission snapshot.

## 6. Required negative and integration tests

Before the adapter can be accepted, tests must prove:

- unknown Google subject and email-only match are denied;
- missing, duplicate, ambiguous, rejected, suspended and expired membership are denied;
- membership/appointment subject mismatch is denied;
- future, expired, revoked and inactive appointments are denied;
- unknown permission and missing/ambiguous scope are denied;
- department A cannot read or mutate department B resources;
- department appointment cannot perform global operations;
- expired, revoked, malformed or improperly authorised delegation is denied;
- President succession or revocation takes effect according to approved effective dates;
- provider timeout, rate limit, stale response, malformed payload and wrong source ID deny privileged actions;
- changing an object ID cannot cross membership or department boundaries;
- no authorization context can be injected through a browser request;
- suspension or appointment revocation invalidates existing sessions/permissions within the approved revocation objective;
- public APIs never serialize membership, appointment, delegation or DOC audit records.

Tests must exercise route handlers directly, not only helper functions or hidden UI controls.

## 7. Session and revocation dependency

The current shared-key cookie is transitional and is not an individual identity session. The OIDC pending-identity proof is not an operations session.

After trusted membership linking is approved, the DOC needs individual server-side sessions with:

- opaque random session identifiers;
- hashed session identifiers at rest;
- bounded idle and absolute lifetimes;
- rotation after authentication and privilege changes;
- server-side revocation and logout invalidation;
- session binding to immutable Google subject and membership identity;
- re-check of membership/appointment status for sensitive operations;
- distributed abuse controls and safe recovery.

Do not treat deletion of a stateless cookie as central revocation. Do not issue an operations session from the pending-identity proof alone.

## 8. Privacy, audit and governance controls

Before real personal data is connected, document the purpose, minimum necessary fields, approved readers, retention, correction, export, backup and incident process. Do not store PINs, password material, recovery codes, session tokens or signing secrets in Notion.

Every membership decision, appointment grant/revocation and delegation grant/revocation must have attributable provenance: actor, authority basis, timestamp, scope, decision reference and reason classification. Store audit events in an append-only or tamper-evident system separate from mutable operational records. A Notion page history or ordinary editable property is not sufficient proof of an immutable audit trail.

The President retains final membership decision authority unless a valid, explicit, recorded, scoped and time-bounded delegation exists. Record maintenance does not imply decision authority.

## 9. Activation checklist

The adapter remains disabled until all items are evidenced:

- [ ] President approves the source of truth and governance criteria.
- [ ] Source custodians confirm data ownership and correction procedures.
- [ ] Restricted sharing and integration permissions are independently reviewed.
- [ ] Stable membership, appointment and delegation IDs are present and non-duplicated.
- [ ] Identity-linking procedure is approved and tested.
- [ ] Data freshness and outage-denial policy is approved.
- [ ] Server-only adapter passes schema, ambiguity, stale-data and outage tests.
- [ ] Individual session issuance, rotation and revocation are implemented.
- [ ] Every protected page, API and server action has server-side authorization.
- [ ] Object-level and cross-department negative tests pass.
- [ ] Append-only audit and incident procedures are operational.
- [ ] Authenticated mobile/browser QA and security review pass.
- [ ] A separately approved release and rollback plan exists.

Until then: no real member rows are created by engineering, no officer is activated, no authority is inferred, and the DOC remains NO-GO for production.
