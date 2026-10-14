<!-- Author: Raveen -->

# Enterprise Test Strategy

## 1. Executive Summary

This document establishes the enterprise quality assurance blueprint and automation governance model for the web application platform. The primary objective is to guarantee end-to-end reliability, security compliance, performance scalability, and cross-browser resilience through continuous automated validation in the CI/CD lifecycle.

Change governance uses `npm run impact:analyze -- <IDs-or-paths> --json`: static dependencies, reverse consumers, registered risk, plan/strategy links, test data, technical severity, and scoped validation are review signals, not authorization or execution evidence. Require owner confirmation before material behavior/contract changes, cross-module expansion, live targets, bulk additions, or new thresholds; production execution is prohibited. Risk categories are a selection menu, not a mandate to expand coverage. Consume the report once and read only impacted artifacts. Runtime UI/network dependencies still require review. Document/metadata updates remain coordinated manually; normalized KPI/trend reporting is not yet implemented.

The quality gate includes isolated target-policy, API-client forwarding, and dependency-impact regressions alongside traceability tests. Browser and API-client policies reject malformed configured QA/UAT/production URLs explicitly, including on local runs. This gate protects framework behavior; it does not establish backend or service-performance coverage.

## 2. Product Understanding

### 2.1 Scope

The current executable scope is the repository's local static sign-in/dashboard demo plus browser-intercepted API response flows, run in Chromium, Firefox, and WebKit. It validates selected UI input handling, persona display, logout, and response assertions against mocks. It does not validate a deployed application, server-side authentication/authorization, data persistence, or live API behavior. Other modules and non-functional goals below are strategy targets pending product acceptance criteria and real system contracts.

### 2.2 Modules

- **Authentication & Identity**: Local demo credential validation, demo session storage, and mocked login response assertions.
- **Persona Display**: Admin/User/Guest display in the local demo; this is not authorization enforcement.
- **Dashboard & User Context**: Guest default and text-only username rendering in the local static page.
- **Session Management**: Logout removes local demo session state; timeout, rehydration, and token revocation are not implemented.
- **Security & Input Validation**: Local demo input-handling checks and mocked API error payload assertions; no backend security validation.

### 2.3 Integrations

- Playwright Test Runner (ESM & TypeScript)
- Allure Test Reporting Engine
- GitHub Actions CI/CD Pipeline
- Local static demo and browser-intercepted mock API responses; no deployed backend integration is configured

### 2.4 Constraints and unverified targets

- Local demo credentials are intentionally visible in the static mock application; do not reuse or package them as credentials for a real/shared application.
- WCAG 2.1 AA conformance and suite runtime under 3 minutes are targets, not measured or certified outcomes.
- Demo usernames and passwords are intentionally present in the local mock application; they are not secrets and must never be used against shared environments.

### 2.5 Business Flows

1. User enters local demo credentials -> Static page validates them and stores a mock session -> Redirects to a persona-labeled dashboard.
2. User logs out -> Local demo session state is removed -> Redirects to the sign-in page.
3. Direct dashboard access without a user query/session -> Static page displays the Guest persona.

---

## 3. Scope and Objectives

### 3.1 In-Scope

- Local-demo UI regression and smoke coverage in Chromium, Firefox, and WebKit.
- Semantic locator and visibility assertions; no automated WCAG audit is configured.
- Boundary and input-handling checks limited to the local demo.
- Browser-intercepted API login/profile mock-flow checks; no live service is configured.
- CI lint, TypeScript, traceability, and browser test gates.

### 3.2 Out-of-Scope

- Production load testing exceeding 10,000 concurrent RPS.
- Hardware-level biometric authentication testing.

### 3.3 Assumptions

- CI runner environments have internet access to fetch browser binaries and npm dependencies.
- Any future shared test environment has dedicated persona accounts provisioned through an approved secret store.
- QA/UAT/production URLs in `.env.example` are placeholders, not approved test targets.

### 3.4 Implemented Evidence Boundary

- The repository's executable UI suite currently validates the local static demo in `public/`; these checks do not prove behavior of a production service.
- The API-named suite intercepts requests in the browser and returns mock responses. It is mock-flow coverage, not live API contract or backend security validation.
- Brute-force protection, live authenticated profile behavior, authorization enforcement, session timeout, WCAG conformance, performance SLAs, and database behavior are not established by the current automated suite.
- Treat the broader quality goals elsewhere in this strategy as targets or assumptions until acceptance criteria, a service contract, and corresponding evidence are approved.

---

## 4. Risk Analysis & Mitigation Matrix

| Risk Area | Impact | Likelihood | Priority | Current evidence and mitigation / gap |
| :--- | :--- | :---: | :---: | :--- |
| Accidental use of demo credentials against a shared target | High | Medium | P1 | Browser and API-client targets default to loopback; non-local targets require explicit opt-in and must match configured QA/UAT origins. Production origins are blocked, and non-local browser runs require dedicated persona credentials. Demo values remain intentionally public for local mock login only. |
| Server authentication, authorization, and session security | Critical | Unknown | P1 | Not validated: current UI is static and API responses are intercepted mocks. Requires approved service contract and isolated test environment before service-level tests. |
| Cross-browser UI behavior | Medium | Low | P2 | Local browser matrix passed 63 executions (21 named tests) across Chromium, Firefox, and WebKit on 2026-10-14; rerun per change/CI for fresh evidence. |
| API contract / integration drift | High | Unknown | P1 | Mock-only assertions can drift from a real service. No OpenAPI source or approved endpoint is provided; do not treat mocks as integration coverage. |
| Test data misconfiguration | Medium | Medium | P2 | `.env.example` identifies demo values as local-only; non-local browser targets require explicit opt-in and environment-specific persona credentials. |
| Performance-lite behavior | Unknown | Unknown | P3 | No response-time, throughput, or memory measurements exist. Define an owner-approved measure before adding performance checks. |
| Flakiness / pipeline time | Medium | Unknown | P2 | Browser matrix and retries are configured; stability and duration should be measured from CI history. No self-healing locator mechanism is configured. |
| Vulnerable automation dependencies | High | Medium | P1 | The current lockfile audit is clean after the `brace-expansion` patch update; `npm audit --audit-level=high` is part of the quality gate and blocks high/critical advisories. |

---

## 5. Test Types & Coverage Taxonomy

### 5.1 Functional Testing

- **System/UI demo validation**: Local sign-in, persona display, logout, and input-handling checks through the browser.
- **Mock-flow validation**: Selected login/profile response shapes and status handling against browser-intercepted responses.
- **Smoke/Regression**: Current 21 named Playwright tests are run in each configured browser; these are not UAT or production-system evidence.
- **Framework regression**: Node.js tests exercise traceability validation failure modes independently of browser/product scenarios.
- Product unit/component, database, true integration, UAT, and server-side business-rule coverage are not currently configured.

### 5.2 Non-Functional Testing

- **Security Testing (SEC-T)**: Local demo input sanitization and mocked response checks only; security headers and backend security are not tested.
- **Accessibility Testing (ACC-T)**: Some semantic locators/visibility checks; no WCAG conformance scan or screen-reader evaluation.
- **Performance & Reliability (PT/REL-T)**: No SLA, load, or memory-leak checks currently run. Define measurable thresholds and target before implementation.

### 5.3 API and Mock Validation

- API flow tests may use controlled browser-intercepted responses when no backend contract or environment has been approved.
- Mocked status and payload assertions do not establish live API availability, server-side contract conformance, authentication enforcement, or security resistance.
- Map each approved API scenario to its API test plan section and retain its mock/live target designation in execution evidence.

---

## 6. Test Environment and Data Strategy

### 6.1 Environments

- **Local**: `http://127.0.0.1:4173` managed by Playwright `webServer`; this is the default supported target.
- **CI**: GitHub-hosted runners execute the same local demo and browser matrix.
- **QA/UAT**: Placeholder URLs only; not currently exercised. Non-local execution requires `ALLOW_NON_LOCAL_TEST_TARGET=true`, a URL matching configured QA or UAT origins, dedicated persona credentials, and owner approval.
- **Production**: Not an automation target. Production origins are rejected by the target guard.

### 6.2 Test Data Management

- Local demo persona defaults are public mock credentials shared with `public/login.html`; they are not secrets and are safe only for the local static demo.
- Non-local browser tests require `ALLOW_NON_LOCAL_TEST_TARGET=true` and non-empty environment-specific credentials for every persona. The local demo default values are rejected for non-local browser targets.
- Store shared-environment credentials in CI secrets or a managed local secret store; never commit real credentials or place them in `.env.example`.
- Dynamic data helper functions exist in `fixtures/test-data.ts`, but the current suite does not exercise generated business records.

---

## 7. Entry and Exit Criteria

### Entry Criteria

- Code builds cleanly with zero TypeScript errors (`npm run typecheck`).
- ESLint checks pass with zero warnings (`npm run lint`).
- Traceability validation and high-severity dependency audit pass (`npm run quality-gate`).
- Target test environment is reachable and mock services initialized.

### Exit Criteria

- 100% test pass rate across all smoke and critical security test suites.
- Minimum 95% overall regression test pass rate with zero unresolved P1/P2 defects.
- Allure test execution results generated and archived.
- Traceability mappings validate and execution status is updated with identified run/browser/environment evidence; lifecycle logging alone does not sync or prove results.

---

## 8. Defect Management Strategy

### Severity & Priority Classification

- **P1 - Critical**: System crash, security vulnerability, login failure, or blocked critical business flow. (SLA: Fix within 4 hours).
- **P2 - High**: Feature degradation, broken navigation, or incorrect role display without full outage. (SLA: Fix within 24 hours).
- **P3 - Medium**: Minor UI alignment, cosmetic flaws, non-blocking validation message typos. (SLA: Fix in next sprint).

---

## 9. Reporting and Governance

- **Automated CI Reporting**: Raw Allure results are uploaded as artifacts per browser project. Rendered reports can be generated locally using the locked Allure CLI and a separately installed Java runtime; CI does not currently generate rendered Allure reports.
- **Traceability Ledger**: Functional mappings are maintained in `docs/traceability-tracker.md` and `docs/functional-test-plan.md`; API scenarios are maintained in `docs/api-test-plan.md`. `scripts/validate-traceability.mjs` validates links in the quality gate, while `scripts/traceability.mjs` records lifecycle events only.
- **Quality Gates**: GitHub Actions runs the quality gate and browser matrix on supported branch/PR events. Required merge checks must be configured separately through repository protection/rulesets; enforcement is not established by workflow YAML alone.

| Requirement ID | Requirement | Test Type | Test Case | Status |
| -------------- | ----------- | --------- | --------- | ------ |

## 14. Open Issues and Assumptions

## 15. Appendix

- Security checklist
- Accessibility checklist
- Performance checklist
