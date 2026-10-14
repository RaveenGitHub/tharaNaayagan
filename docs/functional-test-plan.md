# Functional Test Plan

This plan records only the behavior present in the local static demo and its current Playwright suite. Requirement IDs are carried forward from `traceability-tracker.md` as the user-selected baseline; they still require requirement-owner approval. No production-system behavior is inferred.

## TP-01 Authentication and session

**Test Strategy alignment:** Sections 2.5 and 5.1 of `test-strategy-template.md`.

### TP-01.1 Sign-in and session scenarios

| Requirement ID | Scenario ID | Scenario | Risk / Priority | Automation target |
| --- | --- | --- | --- | --- |
| REQ-01 | SCN-01 | Valid admin credentials reach the Admin dashboard. | High / P1 | `tests/functional/smoke.spec.ts` |
| REQ-02 | SCN-02 | Invalid credentials show an accessible error. | High / P1 | `tests/functional/smoke.spec.ts` |
| REQ-03 | SCN-03 | Logout clears the session and returns to sign-in. | Medium / P2 | `tests/functional/auth.spec.ts` |

## TP-02 Sign-in entry and input validation

**Test Strategy alignment:** Sections 3.1 and 5.1 of `test-strategy-template.md`.

### TP-02.1 Sign-in and input validation scenarios

| Requirement ID | Scenario ID | Scenario | Risk / Priority | Automation target |
| --- | --- | --- | --- | --- |
| REQ-04 | SCN-04 | Sign-in page displays the username, password, and login controls. | Medium / P1 | `tests/functional/smoke.spec.ts` |
| REQ-06 | SCN-06 | Empty credentials show client-side validation. | Medium / P2 | `tests/functional/boundary.spec.ts` |
| REQ-06 | SCN-09 | Whitespace-only credentials are rejected. | Medium / P2 | `tests/functional/boundary.spec.ts` |
| REQ-06 | SCN-10 | A 1024-character username does not crash the local demo. | Low / P3 | `tests/functional/boundary.spec.ts` |

## TP-03 Persona display

**Test Strategy alignment:** Sections 2.2 and 5.1 of `test-strategy-template.md`.

### TP-03.1 Persona scenarios

| Requirement ID | Scenario ID | Scenario | Risk / Priority | Automation target |
| --- | --- | --- | --- | --- |
| REQ-05 | SCN-05 | User and Guest login display the matching persona. | Medium / P2 | `tests/functional/auth.spec.ts` |
| REQ-05 | SCN-12 | Direct dashboard access defaults to Guest. | Medium / P2 | `tests/functional/security.spec.ts` |

## TP-04 Security and abuse prevention

**Test Strategy alignment:** Sections 3.1 and 4 of `test-strategy-template.md`.

### TP-04.1 Input handling scenarios

| Requirement ID | Scenario ID | Scenario | Risk / Priority | Automation target |
| --- | --- | --- | --- | --- |
| REQ-07 | SCN-07 | SQL injection strings are rejected by the local demo login. | High / P1 | `tests/functional/security.spec.ts` |
| REQ-07 | SCN-11 | XSS query input is displayed as inert text. | High / P1 | `tests/functional/security.spec.ts` |

### TP-04.2 Deferred abuse scenario

| Requirement ID | Scenario ID | Scenario | Risk / Priority | Status |
| --- | --- | --- | --- | --- |
| REQ-08 | SCN-08 | Repeated failed login / brute-force protection. | High / P1 | Not implemented; no rate-limit behavior or service contract is available. |

## TP-AUTO-01 Automation support

**Test Strategy alignment:** Section 9 of `test-strategy-template.md`.

### TP-AUTO-01.1 Utility scenarios

| Requirement ID | Scenario ID | Scenario | Risk / Priority | Automation target |
| --- | --- | --- | --- | --- |
| REQ-AUTO-01 | SCN-AUTO-01 | Authentication helper completes a login. | Low / P3 | `tests/functional/smoke.spec.ts` |
| REQ-AUTO-01 | SCN-AUTO-02 | API client blocks an unapproved non-local target. | Medium / P2 | `tests/apiTests/api.spec.ts` |

## Scope limits and change impact

- UI tests run against the repository's local static pages. They do not establish backend authentication, authorization, rate-limit, persistence, or service-side input-security behavior.
- The API test plan is exercised through browser-intercepted mock responses. The API cases do not call a real service. API client requests to non-local origins require explicit opt-in and a configured QA/UAT origin; production origins are rejected.
- Before changing a requirement, scenario, or artifact, consume `npm run impact:analyze -- <IDs-or-paths> --json`. Review dependency consumers, technical severity, registered risk, plan/strategy references, data impact, and selected validation. File-level scope can include sibling scenarios; runtime UI/network links require explicit review.
- Update the impacted plan row, tracker, and strategy risk/scope references together, then update the listed tests and dependencies as applicable. Semantic document changes are not automatically propagated. Run `npm run quality-gate` and the selected affected suite.
- Confirm acceptance criteria, API contract, target environment, and any expansion beyond the listed module with the owner before making material changes. Do not add adjacent-scope tests without approval.
