<!-- Author: Raveen -->

# Test Plan, Scenario, and Automation Traceability Tracker

This tracker is the canonical mapping source for functional and automation-support scenarios. API scenarios are defined in [api-test-plan.md](api-test-plan.md). Historical lifecycle events remain in `.traceability-events.json`; they are audit records, not execution evidence, and do not synchronize requirements, plans, or strategy documents.

Every automated test title must contain exactly one requirement ID and one or more scenario IDs. Run `npm run traceability:validate` to verify test titles against the tracker, test-plan sections, and strategy sections.

## Status legend

- Execution Status: Not Run | Draft | In Progress | Passed | Failed | Blocked | N/A
- Automation Status: Not Started | In Progress | Automated | Retired
- Risk Level: Low | Medium | High | Critical
- Priority: P1 | P2 | P3 | P4 | P5

## Coverage summary

| Module / Feature                 | Registered Scenarios | Automated Scenarios | Not Implemented / Unverified |
| -------------------------------- | -------------------: | -----------------: | ---------------------------: |
| Authentication & sign-in         |                    4 |                  4 |                            0 |
| Persona display and dashboard    |                    2 |                  2 |                            0 |
| Input validation                 |                    3 |                  3 |                            0 |
| Security / input handling        |                    3 |                  2 |                            1 |
| API plan scenarios (mocked only) |                    8 |                  8 |                            0 |
| Automation support               |                    2 |                  2 |                            0 |

The recorded local browser-matrix run on 2026-10-14 passed all 63 tests across Chromium, Firefox, and WebKit. API cases exercise browser-intercepted mocks, not a backend. This is not evidence of live API or production security coverage.

## Current traceability matrix

| Requirement ID | Feature / Module | Test Plan ID | Scenario ID | Scenario Title | Risk Level | Priority | Test Type | Execution Status | Automation Status | Automation Coverage (%) | Defect Count | Owner | Environment | Last Updated | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| REQ-01 | Authentication | TP-01 | SCN-01 | Valid admin login | High | P1 | Smoke / Functional | Passed | Automated | 100 | 0 | QA Lead | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Verified in the 63-test browser matrix. |
| REQ-02 | Authentication | TP-01 | SCN-02 | Invalid credentials show an accessible error | High | P1 | Functional / Negative | Passed | Automated | 100 | 0 | QA Lead | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Verified in the 63-test browser matrix. |
| REQ-03 | Session management | TP-01 | SCN-03 | Logout clears session and returns to sign-in | Medium | P2 | Functional / Reliability | Passed | Automated | 100 | 0 | QA Engineer | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Logout covered; session timeout and token revocation are not covered. |
| REQ-04 | Authentication / entry | TP-02 | SCN-04 | Sign-in page displays required login controls | Medium | P1 | Smoke / Accessibility locator | Passed | Automated | 100 | 0 | QA Engineer | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Visibility checks only; not a WCAG conformance audit. |
| REQ-05 | Persona display | TP-03 | SCN-05 | User and Guest login display the matching persona | Medium | P2 | Functional | Passed | Automated | 100 | 0 | QA Engineer | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Persona display only; authorization enforcement is not validated. |
| REQ-06 | Form validation | TP-02 | SCN-06 | Empty credentials show client validation | Medium | P2 | Functional / Negative | Passed | Automated | 100 | 0 | QA Engineer | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Verified in the 63-test browser matrix. |
| REQ-07 | Security / input handling | TP-04 | SCN-07 | SQL injection strings are rejected by the demo login | High | P1 | Security / Input handling | Passed | Automated | 100 | 0 | Security QA | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | UI demo behavior only; not evidence of backend SQLi resistance. |
| REQ-08 | Security / abuse prevention | TP-04 | SCN-08 | Repeated failed login / brute-force protection | High | P1 | Security | Not Run | Not Started | 0 | 0 | Security QA | Not defined | 2026-10-14 | No corresponding test or rate-limit contract exists; requires product/API owner confirmation. |
| REQ-06 | Form validation | TP-02 | SCN-09 | Whitespace-only credentials are rejected | Medium | P2 | Boundary / Negative | Passed | Automated | 100 | 0 | QA Engineer | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Verified in the 63-test browser matrix. |
| REQ-06 | Form validation | TP-02 | SCN-10 | Long username input does not crash the demo login | Low | P3 | Boundary | Passed | Automated | 100 | 0 | QA Engineer | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | 1024-character fixture; server-side behavior is not covered. |
| REQ-07 | Security / input handling | TP-04 | SCN-11 | XSS query input is displayed as inert text | High | P1 | Security / Input handling | Passed | Automated | 100 | 0 | Security QA | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Local DOM sanitization behavior only. |
| REQ-05 | Persona display | TP-03 | SCN-12 | Direct dashboard access defaults to Guest | Medium | P2 | Functional | Passed | Automated | 100 | 0 | QA Engineer | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Default display behavior only; does not prove route authorization. |
| REQ-API-01 | API authentication (mocked) | TP-API-01 | SCN-API-01 | Valid admin login response contract | High | P1 | Mocked API-flow / Contract | Passed | Automated | 100 | 0 | API QA | Browser-intercepted mock / Chromium, Firefox, WebKit | 2026-10-14 | No live API service is called. |
| REQ-API-01 | API authentication (mocked) | TP-API-01 | SCN-API-02 | Valid standard user login returns the user role | High | P1 | Mocked API-flow / Contract | Passed | Automated | 100 | 0 | API QA | Browser-intercepted mock / Chromium, Firefox, WebKit | 2026-10-14 | Verified in browser-intercepted mock flows; no live API service is called. |
| REQ-API-01 | API authentication (mocked) | TP-API-01 | SCN-API-03 | Invalid credentials return 401 | High | P1 | Mocked API-flow / Negative | Passed | Automated | 100 | 0 | API QA | Browser-intercepted mock / Chromium, Firefox, WebKit | 2026-10-14 | No live API service is called. |
| REQ-API-01 | API authentication (mocked) | TP-API-01 | SCN-API-04 | Empty credentials return 400 | Medium | P2 | Mocked API-flow / Negative | Passed | Automated | 100 | 0 | API QA | Browser-intercepted mock / Chromium, Firefox, WebKit | 2026-10-14 | No live API service is called. |
| REQ-API-01 | API authentication (mocked) | TP-API-01 | SCN-API-05 | Extremely long email returns a validation error | Low | P3 | Mocked API-flow / Boundary | Passed | Automated | 100 | 0 | API QA | Browser-intercepted mock / Chromium, Firefox, WebKit | 2026-10-14 | 1024-character input is checked against a mocked 422 validation response; no live API service is called. |
| REQ-API-01 | API authentication (mocked) | TP-API-01 | SCN-API-06 | SQL injection response does not disclose SQL errors | Critical | P1 | Mocked API-flow / Security | Passed | Automated | 100 | 0 | Security QA | Browser-intercepted mock / Chromium, Firefox, WebKit | 2026-10-14 | Mocked response cannot validate backend injection resistance. |
| REQ-API-02 | API profile (mocked) | TP-API-01 | SCN-API-07 | Missing authorization returns 401 | High | P1 | Mocked API-flow / Security | Passed | Automated | 100 | 0 | API QA | Browser-intercepted mock / Chromium, Firefox, WebKit | 2026-10-14 | No live API service is called. |
| REQ-API-02 | API profile (mocked) | TP-API-01 | SCN-API-08 | Authenticated profile returns the caller's profile | High | P1 | Mocked API-flow / Contract | Passed | Automated | 100 | 0 | API QA | Browser-intercepted mock / Chromium, Firefox, WebKit | 2026-10-14 | Verified in the same test as SCN-API-07; no live API service is called. |
| REQ-AUTO-01 | Automation support | TP-AUTO-01 | SCN-AUTO-01 | Authentication helper completes a login | Low | P3 | Automation utility | Passed | Automated | 100 | 0 | Automation Engineer | Local demo / Chromium, Firefox, WebKit | 2026-10-14 | Tracks `loginAs` helper behavior. |
| REQ-AUTO-01 | Environment safety | TP-AUTO-01 | SCN-AUTO-02 | API client blocks an unapproved non-local target | Medium | P2 | Configuration / Safety | Passed | Automated | 100 | 0 | Automation Engineer | Local / Chromium, Firefox, WebKit | 2026-10-14 | Non-local targets require explicit opt-in and must match configured QA/UAT origins; production is blocked. |

## Execution snapshot

| Scenario ID | Execution Status | Last Executed | Automation Status | Comments |
| --- | --- | --- | --- | --- |
| SCN-08 | Not Run | - | Not Started | Requires product/API owner-approved abuse-protection acceptance criteria and service contract before implementation. |
The API scenarios SCN-API-02 and SCN-API-05 are now covered by browser-intercepted mocks; they do not establish live-service behavior. All scenarios other than SCN-08 in the detailed matrix passed in the 63-test browser-matrix run on 2026-10-14. The results are local demo/mock coverage, not live-service validation.

## Operating rules and next-step guardrails

- The detailed matrix above is authoritative for functional and automation-support scenarios; the scenario table in `api-test-plan.md` is authoritative for API cases.
- Registry and lifecycle records are historical audit records, not current execution status.
- The validator parses static Playwright declarations, checks mappings in both directions, and requires every Automated scenario to have runnable coverage. Skipped/fixme-only scenarios and missing/mismatched functional-plan test targets fail. Dynamic declarations and conditional skip/fixme calls fail explicitly rather than being silently ignored. This static gate does not prove execution, invent requirements, or synchronize documents.
- When a requirement or API contract changes, update its approved source, assess impacted scenarios and linked test artifacts, then update the strategy and plan and rerun validation. Obtain owner confirmation before material scope or contract changes.
- Record each run with its browser/environment and evidence; do not carry status forward to unexecuted browser projects or live services.
- Retirements and status changes should retain the reason and replacement/archive reference in `.traceability-events.json`.

## Remaining governance gaps

- Requirement IDs in this tracker are the selected baseline, but product/requirement owner approval is still needed.
- `SCN-08` brute-force protection remains unimplemented and unverified.
- The current suite establishes local demo behavior and mocked API-flow behavior only.
