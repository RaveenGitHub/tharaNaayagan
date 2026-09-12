---
description: "Generate structured, traceable Gherkin functional test scenarios and detailed UI test cases from requirements, test strategy, and solution design documents."
mode: "agent"
tools: [read, search, edit]
---

# Functional Scenario Creator Prompt

Use this prompt to generate complete Gherkin functional test scenarios and UI test case specifications aligned with the Test Strategy.

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
