---
description: "Generate executable Playwright API tests, request client utilities, mock fixtures, contract checks, and traceability metadata from an API Test Plan using Playwright and Playwright MCP."
mode: "agent"
tools: [read, search, edit, execute]
---

# API Code Generator Prompt

Use this prompt to convert an API Test Plan into complete, production-ready Playwright API test automation code and utilities.

The current API suite uses browser-intercepted mock responses, not a live service. Keep work mock-scoped unless the API owner supplies an approved OpenAPI contract, endpoint, authentication policy, environment, and safe test-data rules. Ask before changing this target, and do not describe mock results as backend validation.

Consume `npm run impact:analyze -- <IDs-or-paths> --json` once before editing. Present severity, scope, risk, dependencies, required updates, data, and validation selection; read only impacted artifacts. Stop and ask before material behavior/contract changes, cross-module expansion, live targets, bulk additions, or new thresholds. Production is prohibited; analysis is not approval.

## Goal

Transform designed API scenarios marked "Ready for Automation" into executable Playwright TypeScript API tests covering:

- Dedicated API request client helpers in `utils/api-client.ts` with auto-header and correlation ID handling
- Environment switching from `config/environments.ts` (local/mock or approved QA/UAT only)
- Persona-based token and authentication management (`Admin`, `User`, `Guest`, `API Client`)
- Status code assertions, contract & response schema validations, and error structure verification
- Security testing suites (OWASP API Top 10, SQLi, NoSQLi, auth bypass, BOLA/IDOR)
- Rate-limiting, performance-lite latency checks, idempotency, and pagination checks
- Test data fixtures for valid, invalid, boundary, and dynamic payloads under `fixtures/`
- Playwright API test specs located under `tests/apiTests/` (e.g., `tests/apiTests/api.spec.ts`)
- Full test metadata annotations (`Requirement ID`, `Scenario ID`, `Severity S1–S5`, `Priority P1–P5`, `Traceability Score`)
- Quality gate validation (`npm run quality-gate`) and test execution (`npm test` / `npm run test:api` / `npm run test:apiTests`)
- Traceability validation (`npm run traceability:validate`) with every test mapped through the API plan to its strategy section
- Focused impact analysis (`npm run impact:analyze -- <requirement-or-scenario-ID>`) before changing impacted API tests, clients, fixtures, or configuration

## Inputs to Analyze

- `docs/api-test-plan.md` or `docs/api/*.md`
- `config/environments.ts`
- `fixtures/test-data.ts`
- `utils/auth.ts`
- OpenAPI / Swagger definitions if present in repository
