---
description: "Generate structured, traceable Gherkin test scenarios and detailed test cases from requirements, test strategy, and solution design documents."
mode: "agent"
tools: [read, search, edit]
---

# Scenario Creator Prompt

Use this prompt to generate complete Gherkin test scenarios and test case specifications aligned with the Test Strategy.

## Goal

Create an industry-best scenario catalog covering:

- Positive / Happy path workflows
- Negative & invalid input conditions
- Boundary value & extreme data conditions
- Security & access control validations
- Performance and operational risk scenarios
- Complete traceability mapping (`Requirement ID` -> `Scenario ID` -> `Priority`)

## Inputs

- `docs/test-strategy-template.md`
- Solution Design Document / Product Catalog
- User stories and acceptance criteria
