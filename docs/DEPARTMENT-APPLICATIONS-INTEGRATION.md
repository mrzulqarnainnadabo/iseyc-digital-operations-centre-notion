# Department applications integration check

The diagnostic is designed for an approved private Notion intake source named **ISEYC Department Applications — Intake Register**. The source's existence and integration access must be verified by an authorised administrator. It is not a membership register, appointment register or officer-authorisation source.

## Configuration

Set `NOTION_DEPARTMENT_APPLICATIONS_DATABASE_ID` in the IDCC Vercel project to the approved register's database ID. Obtain the value directly from the authorised Notion workspace administrator; do not commit the raw identifier to this public repository.

The existing `NOTION_TOKEN` must belong to the IDCC server integration and that exact integration must have access to the database. A connection made by a separate ChatGPT/Notion integration does not establish access for the Vercel application.

Do not put the Notion token in source control, browser code, public documentation or chat.

## Verification

After configuring the IDCC environment variable and deploying a preview, sign in to the restricted operations area and request:

`GET /ops/api/department-applications/connection`

The endpoint is protected by the existing staff session and is deliberately read-only. It retrieves the database schema only; it does not query application rows or return applicant names, email addresses, phone numbers, statements or reviewer notes.

A successful response reports:
- `configured`: the database ID and server token are present;
- `accessible`: the IDCC Notion integration can retrieve the database;
- `schemaReady`: the required intake properties have their expected Notion types;
- `missingProperties`: property names that are absent or have the wrong type.

A successful schema check is not approval to accept or process real applications.

## Activation boundary

Public submission and applicant-record review remain disabled until individual, revocable officer sessions and server-side role/resource authorization are implemented and tested. The transitional shared staff key must not be used to expose applicant personal information.

Do not store health details, safeguarding disclosures, identity documents, financial details or other sensitive case material in this intake register. Application submission does not create membership or confer appointment, authority or benefits. Human review is required.
