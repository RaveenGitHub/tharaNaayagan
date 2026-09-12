---
description: "Transform ready-to-automate functional test scenarios into robust Playwright TypeScript Page Objects, accessible locators, and test specs."
mode: "agent"
tools: [read, search, edit, execute]
---

# Prepare Functional Tests Prompt

Use this prompt to convert ready-to-automate functional test scenarios into executable TypeScript Playwright code.

## Goal

Generate clean, maintainable Playwright functional automation code following repository conventions:

- Reusable Page Object Models in `pages/` extending `BasePage`
- Centralized, accessible semantic locators in `locators/common.locators.ts` (`getByRole`, `getByLabel`, `getByTestId`)
- Modular functional test specs in `tests/functional/` (e.g., `tests/functional/smoke.spec.ts`, `tests/functional/auth.spec.ts`, `tests/functional/security.spec.ts`, `tests/functional/boundary.spec.ts`)
- Reusable fixtures and dynamic test data builders in `fixtures/test-data.ts`
- Verification with `npm run quality-gate` and `npm test`

## Inputs

- Functional test scenarios from `docs/scenarios.md` or `docs/traceability-tracker.md`
- Application structure in `public/` or live target URL
- Existing POM classes in `pages/`
