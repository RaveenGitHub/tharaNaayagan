---
description: "Transform ready-to-automate test scenarios into robust Playwright TypeScript Page Objects, test specs, and locators."
mode: "agent"
tools: [read, search, edit, execute]
---

# Prepare Tests Prompt

Use this prompt to convert ready-to-automate scenarios into executable TypeScript Playwright code.

## Goal

Generate clean, maintainable Playwright automation code following repository conventions:

- Reusable Page Object Models in `pages/` extending `BasePage`
- Centralized, accessible locator definitions in `locators/`
- Modular test specs in `tests/`
- Test fixtures and dynamic test data builders in `fixtures/`
- Validation with `npm run quality-gate` and `npx playwright test`

## Inputs

- Test scenarios from `docs/scenarios.md` or `docs/traceability-tracker.md`
- Application structure in `public/` or application URL
- Existing POM classes in `pages/`
