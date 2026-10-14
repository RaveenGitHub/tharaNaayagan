---
description: "Generate structured, traceable Gherkin functional test scenarios and detailed UI test cases from requirements, test strategy, and solution design documents."
mode: "agent"
tools: [read, search, edit]
---

# Functional Scenario Creator Prompt

Use this prompt to generate complete Gherkin functional test scenarios and UI test case specifications aligned with the Test Strategy.

Identify approved IDs and module; consume `npm run impact:analyze -- <IDs-or-paths> --json` once (request output if unavailable). Present severity, scope, risk, required updates, test-data review, and narrow validation. Read only impacted artifacts and select risk-relevant scenarios. Stop and ask before material behavior/contract changes, cross-module expansion, live targets, bulk additions, or new thresholds. Production is prohibited; analysis is not approval.

## Goal

Create an enterprise-standard functional test scenario catalog covering:

- Positive / Happy path user journeys across all supported personas (Admin, User, Guest)
- Negative input validations and client/server alert handling
- Boundary value conditions (string lengths, whitespace, special characters)
- Role-based access control (RBAC) and navigation permissions
- Session persistence and secure logout flows
- Complete traceability mapping (`Requirement ID` -> `Scenario ID` -> `Priority`)

## Inputs to Analyze

- `docs/test-strategy-template.md`
- Solution Design Document / Product Catalog / User Stories
- Page templates in `public/` (e.g., `login.html`, `index.html`)
- Persona models and test data in `fixtures/test-data.ts`
