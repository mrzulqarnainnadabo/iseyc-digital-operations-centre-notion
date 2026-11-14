# Public evidence integration

Status: limited read-only integration verified against the public Civic Intelligence Observatory. This document describes the current IDCC implementation; it does not assert that all four departments have evidence coverage.

## Verified Observatory interface

The public read-only gateway is implemented in [the Observatory repository](https://github.com/mrzulqarnainnadabo/iseyc-civic-intelligence-observatory) and exposed at:

- `GET https://iseyc-civic-intelligence-observatory.vercel.app/api/evidence/observations?catalog=1`
- `GET https://iseyc-civic-intelligence-observatory.vercel.app/api/evidence/observations?indicatorId=wb-nga-se-prm-enrr`
- `GET https://iseyc-civic-intelligence-observatory.vercel.app/api/evidence/observations?indicatorId=wb-nga-sh-dyn-mort`

These endpoints were requested successfully during implementation. The catalog identified an allowlist-only v1 API. Responses use `contractVersion: "1.0.0"`; the observation payload includes an indicator descriptor, observations and a retrieval receipt. The handler permits only allowlisted indicator IDs and returns public read-only data. IDCC does not build query URLs from browser input.

The [Observatory README](https://github.com/mrzulqarnainnadabo/iseyc-civic-intelligence-observatory/blob/main/README.md) describes the Observatory as an early-stage national pilot, not a national statistics office, representative survey, government service-delivery monitor or fully integrated national evidence system. The gateway describes retrieval receipts as ephemeral; durable receipt storage is deferred there.

## What IDCC displays

The IDCC adapter currently requests only two source-approved pilot series:

- **Education:** `wb-nga-se-prm-enrr`, World Bank World Development Indicators, national gross primary enrollment ratio. The source notes that the ratio can exceed 100%, is a national aggregate, does not measure learning outcomes or facility quality, and can have missing years.
- **Health:** `wb-nga-sh-dyn-mort`, World Bank World Development Indicators, modeled national under-five mortality estimate. The source notes modeling uncertainty, national-only scope, and that the series is not a measure of a particular health programme.

The third published catalog indicator is total population. IDCC does not map it to a department-specific service or outcome claim. There are no department-matched software/technology or civic-service indicators in the current pilot catalog. Those areas show a catalog/evidence gap rather than a fabricated metric or an empty dataset.

For each displayed observation, the department page shows its reference year and value, indicator unit, national geography, publisher, original World Bank source link, measurement type, retrieval timestamp, method and limitations. The response's record-level `datasetId` must equal `world-bank-wdi`; each `methodologyRef` must exactly match the verified method note for its allowlisted indicator, and the receipt must name the same dataset and v1 contract. The API does not supply an observation publication date; IDCC states that explicitly. National estimates are not projected onto state, LGA, ward or facility maps.

## Reliability and publication boundary

The adapter pins the Observatory host, maps departments to a small allowlist of indicator IDs, requests the documented endpoint using a server-side GET with Next.js caching disabled, applies an eight-second timeout, and uses a bounded one-hour in-memory success cache per server runtime with concurrent refresh deduplication. Unavailable and invalid responses have a one-minute negative-cache cooldown to avoid retrying on every page request. Department detail routes are server-rendered on request rather than served as stale ISR pages. Once the cache expires, a failed refresh produces an unavailable state; expired results are never served as a fallback. Receipts older than 24 hours are explicitly labelled stale, with their values date-stamped and the original source linked. This threshold measures feed-receipt age only; it does not assert that an observation is current, because publication dates are absent.

The adapter validates the v1 response shape, source and dataset IDs, indicator ID, national geography, numeric observations, period, unit, retrieval date and exact per-record methodology provenance before rendering any values. Unexpected or malformed payloads are withheld. Failures render a non-data state; they never become zero values. The in-memory cache is per serverless runtime and is not durable or shared across instances; a cold start can trigger another upstream request.

The integration reads already published, source-attributed public data. It does not create Observatory records, publish community reports, verify implementation, infer confidence, or automate institutional decisions. A valid empty API response, a malformed response, an unavailable source, an expired feed receipt, and an indicator absent from the catalog have different UI messages.

## Remaining limitations

The World Bank pilot is still limited to two national series, but the separate curated source-snapshot feed now provides a wider, source-attributed evidence catalogue for all four IDCC departments. It does not yet provide complete state/LGA/facility coverage, a live feed from each publisher, or a durable retrieval log. IDCC currently has no background scheduler, alerting, source-change history, broken-link monitor, or durable operational error-reporting service. On-demand refresh after the per-runtime cache expires is the only automatic source refresh currently implemented; it is not a scheduled or shared refresh service. Public department copy and evidence mapping still need institutional review before any wider launch.


## Curated national source snapshots — connected in department workspaces

The Observatory now exposes a separate read-only source-snapshot endpoint:

- `GET /api/evidence/source-snapshots?departmentId=education`
- `GET /api/evidence/source-snapshots?departmentId=health`
- `GET /api/evidence/source-snapshots?departmentId=software-technology`
- `GET /api/evidence/source-snapshots?departmentId=civic`

The earlier `GET /api/evidence/snapshots` contract remains unchanged for existing consumers. IDCC's department workspace adapter now uses `/api/evidence/source-snapshots` through `lib/department-snapshots.ts`; it no longer treats the older nine-record snapshot bundle as the full evidence foundation.

The current source pack contains **104 curated observations**, **105 source-registry entries** and **28 catalogue-only or partially integrated sources**. These are dated manual transcriptions and published research records, not live feeds from each publisher. The source registry is not itself proof that a dataset has been ingested.

IDCC maps Observatory departments to its internal workspaces:
- **Education and Capacity Building** ← `education`
- **Health and Well-being** ← `health`
- **Software and Technology** ← `software-technology` (IDCC route: `digital-systems`)
- **Civic Department** ← `civic` (IDCC route: `civic-affairs`)

The adapter pins the Observatory host and source contract, requests only the server-defined department ID, and validates the response version, record count, observation IDs, source publisher, HTTPS URL, value/unit/period, geography, source type, department mapping, interpretation and limitations. It validates the full returned department payload before rendering, excludes records explicitly marked superseded from ordinary department views, and surfaces relevant reconciliation notes separately. It also displays catalogue-only or partial source entries so a missing sector dataset is visible as an evidence gap rather than a zero or invented metric.

The adapter uses an eight-second timeout, a bounded ten-minute per-runtime cache and a one-minute failure cooldown. It shows up to 20 current records per department view, reports the total current record count, labels the dataset's source-check date separately from the IDCC fetch time, and marks bundles stale when the source check is older than seven days. No browser-supplied upstream URL is accepted.

### Department evidence coverage

- **Education:** published school-census and education-budget evidence, plus NITDA digital-literacy programme measures where the source explicitly links them to education. School counts and programme reach do not prove classroom quality, teacher availability or learning outcomes.
- **Health:** WHO national health indicators, NPHCDA programme records and BudgIT's secondary H1 2026 state-health spending analysis. The ₦621.34bn detailed-report total and earlier ₦614.55bn infographic are preserved as a visible reconciliation issue; the earlier figure is superseded and excluded from ordinary cards.
- **Software and Technology:** NITDA DL4ALL programme reach, NCC broadband subscriptions/penetration and fixed-fibre subscriptions, and World Bank/ITU internet-use estimates. These use different denominators and periods; broadband subscriptions are not unique people, DL4ALL target progress is not national digital-literacy prevalence, and national figures do not establish state or household access.
- **Civic Department:** state budget/appropriation and fiscal-transparency evidence, selected state actual expenditure, revenue and implementation records, and public-administration sources. Budget allocation, release, expenditure, procurement, completion and service functionality remain separate states.

The state-budget register tracks all 36 states and FCT separately. Current discovery located 15 official state budget portals and three additional official state budget documents; 18 states remain unreviewed in this source-discovery pass. This is not a complete 36-state budget-execution dataset. The FCT is tracked separately and must not be silently included in state denominators.

Anambra's official Q3 2026 BIR is one of the available state examples: the nine-month report records ₦229.80bn expenditure (30.0% of the original budget) and ₦165.76bn capital expenditure (27.8% of the capital budget). These are fiscal execution ratios, not proof of project delivery or service failure.

The department workspace displays each record's source publisher, evidence type, reference period, geography, reported value/unit, interpretation, source-check date, source link and limitations. It does not coerce values from different sources into comparable numeric series. It does not infer Kaduna South, facility, ward or household conditions from state or national figures.

The earlier World Bank national-indicator pilot remains a separate supplementary series for Education and Health. It is not merged into the curated snapshot bundle, and its estimates are not represented as local measurements.

A department with no matching current snapshot, a valid empty response, an invalid contract, an unavailable endpoint, a stale source check, or a source awaiting integration receives a distinct UI state. The application does not fill gaps with proxy metrics, zeroes or invented activity.



### Using evidence in a department draft

When the curated snapshot feed is available, the programme, work-plan and report draft forms offer a source selector populated only from the validated records for that department. Selecting an option copies the original publisher URL into the existing Notion evidence-link field. A manual URL can still be entered when a relevant source is not in the current bundle.

The current Notion registers have one URL field for this purpose. The selected source's Observatory record ID, metric values and snapshot payload are not persisted in the register yet. The form states this limitation; a URL is a source pointer, not proof of implementation, delivery or impact. A future schema change can add a dedicated structured evidence-reference property after approval.
