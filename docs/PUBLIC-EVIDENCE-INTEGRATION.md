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

The Observatory pilot is limited to its published indicators and source periods. It does not provide a broad department-evidence feed, direct software/technology indicators, civic public-service indicators, state/LGA or facility-level education or health coverage, or a durable retrieval log. IDCC currently has no background scheduler, alerting, source-change history, broken-link monitor, or durable operational error-reporting service. On-demand refresh after the per-runtime cache expires is the only automatic source refresh currently implemented; it is not a scheduled or shared refresh service. Public department copy and evidence mapping still need institutional review before any wider launch.
