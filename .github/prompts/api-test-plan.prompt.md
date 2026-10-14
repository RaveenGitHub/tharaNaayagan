---
description: "Generate a comprehensive, enterprise-grade API Test Plan (design only, no code) from OpenAPI/Swagger specs, network discoveries, or product requirements."
mode: "agent"
tools: [read, search]
---

# API Test Plan Prompt

Use this prompt to generate a structured, enterprise-grade API Test Plan ready for consumption by downstream code generators (`apiCodeGenerator`) and engineering review.

## Goal

Produce a design-only API Test Plan conforming to repository standards covering:

- API endpoint discovery & contract analysis
- Functional, negative, boundary, and security test scenario matrices
- OWASP API Security Top 10 coverage
- Persona-based authentication and header strategies
- Mock data schemas and parameterization across environments
- Full traceability metadata matrix (`Requirement ID` -> `Endpoint` -> `Scenario ID`)

## Inputs to Analyze

- OpenAPI / Swagger specifications (`.json` or `.yaml`)
- Solution Design and Product Architecture documents
- Recorded network traces or Playwright session discoveries
- Repo environment settings in `config/environments.ts` and test data models in `fixtures/test-data.ts`

## Key Rules

- **Design only**: Do not write executable test code specs.
- **Traceability**: Follow repository metadata and numbering schemes (`REQ-API-xx`, `SCN-API-xx`, `TP-API-xx`).
- **Scope and approval**: Consume `npm run impact:analyze -- <IDs-or-paths> --json` once (request output if execution tools are unavailable). Present severity, scope, risk, required updates, test-data review, and narrow validation. Read only impacted artifacts. Select meaningful categories for approved endpoints rather than generating every category. Stop and ask before material behavior/contract changes, cross-module expansion, live targets, bulk additions, or new thresholds. Production is prohibited; analysis is not approval.
