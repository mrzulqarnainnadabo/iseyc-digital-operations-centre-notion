# DOC Authorization Test Matrix

Status: acceptance criteria; automated test harness and live identity integration are not yet implemented.

These cases must be executed against the real server-side authorization functions and every protected API route before the access system can be approved. A passing UI-only test is insufficient.

## Membership gate

| Case | Expected result |
| --- | --- |
| No authenticated Google subject | Deny |
| No membership record | Deny |
| Pending, Rejected, Suspended or Expired membership | Deny |
| Approved membership linked to a different Google subject | Deny |
| Approved membership with unverified email | Deny |
| Approved membership before effective-from date | Deny |
| Approved membership after effective-until date | Deny |
| Approved, verified, correctly linked and in-date membership | Allow member access |

## Appointment and officer gate

| Case | Expected result |
| --- | --- |
| Approved member with no appointment | Deny officer access |
| Appointment Inactive, Expired or Revoked | Deny |
| Appointment outside its effective dates | Deny |
| Active appointment without requested permission | Deny |
| Active appointment with exact requested permission | Allow only that permission |
| Suspended/expired member with otherwise active appointment | Deny |
| Browser-supplied role or permission not present in trusted records | Ignore and deny |

## Membership administration versus decisions

| Case | Expected result |
| --- | --- |
| Appointed Membership Administrator with `membership.records.manage` | May maintain operational records only |
| Administrator attempts approve/reject without delegation | Deny |
| Administrator attempts suspend/reinstate without delegation | Deny |
| Administrator attempts to appoint another administrator | Deny |
| Administrator attempts to create or expand their own delegation | Deny |
| National President with current verified identity and approved membership | May administer and decide |
| Delegate with active, matching decision scope | Allow only the delegated decision |
| Delegate attempts a decision outside scope | Deny |
| Delegate whose membership is suspended/expired | Deny |
| Delegation granted by a subject other than the currently recorded President | Deny |
| Expired or not-yet-effective delegation | Deny |
| Revoked delegation | Deny immediately after authoritative revocation is observed |
| Delegation with invalid/missing dates | Deny |
| Delegation attempts onward delegation | Deny |

## API and data-isolation gate

- Every protected API independently loads the authenticated subject and trusted authorization context on the server.
- Never accept membership status, role, permission, delegation, President identity or decision authority from request JSON, query parameters, headers supplied by the browser, or client-side state.
- Read and write endpoints both enforce authorization. Hiding a button is not access control.
- An ordinary member can read only their own permitted membership summary, never the full register.
- Public Mandate, Civic Brain and Observatory endpoints cannot query or serialize DOC membership, personnel, finance or safeguarding records.
- Every successful and denied governance decision attempt is recorded with actor, action, target, timestamp and authority basis, without logging credentials or PINs.
- Replaying an old session after suspension, appointment revocation or delegation revocation must not restore access.
- Cross-origin state-changing requests are rejected; CSRF and session protections remain enabled.
- Notion database views and filters are not treated as authorization boundaries.

## Release gate

Do not mark DOC access control production-ready until:
1. Automated tests cover the cases above.
2. Google OIDC subject verification and account linking are implemented.
3. Membership and appointment records are loaded from restricted, verified sources.
4. API and server-action enforcement is wired across all protected routes.
5. Delegation creation/revocation is President-only and audited.
6. Session revocation, rate limiting, PIN lifecycle and recovery are tested.
7. An authenticated browser QA pass confirms public/member/officer boundaries on mobile and desktop.


## Google OIDC identity-verification gate

These checks verify identity only. Passing them must not be interpreted as membership or officer authorization.

| Case | Expected result |
| --- | --- |
| OIDC provider credentials absent | Start endpoint fails closed; sign-in UI shows setup pending |
| Canonical DOC origin absent or malformed | OIDC remains disabled |
| Production canonical origin uses HTTP | OIDC remains disabled |
| OAuth callback arrives on a host other than configured DOC origin | Reject and redirect only to the configured canonical origin |
| State missing, mismatched or replayed | Reject callback |
| Nonce missing or mismatched | Reject ID token |
| PKCE verifier mismatch | Token exchange rejected by Google |
| Invalid Google signature, issuer, audience or expiry | Reject identity |
| Google email is not verified | Reject identity |
| Valid verified Google identity | Issue a short-lived pending-identity proof only |
| Pending identity proof is expired, malformed or tampered | Reject proof |
| Pending identity proof presented to `requireStaffSession` | Deny; it is not an operations session |
| Pending identity status endpoint | Return `accessGranted: false` until membership and appointment authorization are implemented |
| Logout | Clear shared session, OIDC transaction and pending identity cookies |

The OAuth flow must not log authorization codes, ID tokens, access tokens, client secrets, Google subjects or cookie values. Provider credentials and the signing secret must remain server-only environment variables; `DOC_SESSION_SECRET` must be distinct from `ISEYC_STAFF_KEY`.
