---
description: "Convert an API Test Plan into executable Playwright TypeScript API tests, request wrappers, and schema assertions."
mode: "agent"
tools: [read, search, edit, execute]
---

# API Code Generator Prompt

Use this prompt when you need to generate executable Playwright TypeScript API tests from an existing API Test Plan.

## Goal

Transform designed API scenarios into high-quality, maintainable Playwright API tests covering:

- Dedicated API request client helpers in `utils/api-client.ts`
- Environment-aware endpoint resolution from `config/environments.ts`
- Auth token and header management for Admin, User, Guest, and API Client personas
- Strict HTTP status code, response body schema, and payload assertions
- Negative and security injection tests (OWASP API Top 10)
- Execution validation using `npm run quality-gate` and `npx playwright test`

## Inputs

- `docs/api-test-plan.md` or `docs/api/*.md`
- `fixtures/test-data.ts`
- `config/environments.ts`
- `utils/auth.ts`

## Conventions

- Use Playwright's `request` fixture or `APIRequestContext`.
- Follow strict TypeScript typing with zero `any`.
- Adhere to the repository's ESLint rules and naming standards.
