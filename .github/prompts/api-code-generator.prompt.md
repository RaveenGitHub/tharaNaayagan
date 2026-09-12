---
description: "Generate executable Playwright API tests, request client utilities, mock fixtures, contract checks, and traceability metadata from an API Test Plan using Playwright and Playwright MCP."
mode: "agent"
tools: [read, search, edit, execute]
---

# API Code Generator Prompt

Use this prompt to convert an API Test Plan into complete, production-ready Playwright API test automation code and utilities.

## Goal

Transform designed API scenarios marked "Ready for Automation" into executable Playwright TypeScript API tests covering:

- Dedicated API request client helpers in `utils/api-client.ts` with auto-header and correlation ID handling
- Environment switching and base URL resolution from `config/environments.ts` (DEV/QA/UAT/PROD)
- Persona-based token and authentication management (`Admin`, `User`, `Guest`, `API Client`)
- Status code assertions, contract & response schema validations, and error structure verification
- Security testing suites (OWASP API Top 10, SQLi, NoSQLi, auth bypass, BOLA/IDOR)
- Rate-limiting, performance-lite latency checks, idempotency, and pagination checks
- Test data fixtures for valid, invalid, boundary, and dynamic payloads under `fixtures/`
- Playwright API test specs located under `tests/apiTests/` (e.g., `tests/apiTests/api.spec.ts`)
- Full test metadata annotations (`Requirement ID`, `Scenario ID`, `Severity S1–S5`, `Priority P1–P5`, `Traceability Score`)
- Quality gate validation (`npm run quality-gate`) and test execution (`npm test` / `npm run test:api` / `npm run test:apiTests`)

## Inputs to Analyze

- `docs/api-test-plan.md` or `docs/api/*.md`
- `config/environments.ts`
- `fixtures/test-data.ts`
- `utils/auth.ts`
- OpenAPI / Swagger definitions if present in repository
