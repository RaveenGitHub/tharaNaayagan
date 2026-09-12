<!-- Author: Raveen -->

# User Guide

This guide is intentionally short because the full onboarding and setup content now lives in [README.md](README.md).

Use the README as the main source of truth for:

- setup and installation
- prerequisites
- quick-start execution
- troubleshooting
- best practices
- FAQs
- support and contribution guidance

## Start here

```bash
npm install
npx playwright install --with-deps
npm run quality-gate
npm run test:smoke
# or: npx playwright test tests/functional/smoke.spec.ts --project=chromium --reporter=line
```

## Main docs

- [README.md](README.md) — primary project guide
- [docs/traceability-tracker.md](docs/traceability-tracker.md) — traceability and status tracking
- [docs/test-strategy-template.md](docs/test-strategy-template.md) — reusable test strategy template
- [docs/api-test-plan.md](docs/api-test-plan.md) — enterprise API test plan and contract specifications

## Agent Execution Quick Reference

The framework provides specialized agents for automated test planning and generation:

### Functional Track

1. **`Startergist`**: Create high-level strategy using `.github/prompts/startergist-test-strategy.prompt.md`.
2. **`functionalScenarioCreator`**: Generate Gherkin scenarios using `.github/prompts/functional-scenario-creator.prompt.md`.
3. **`prepareFunctionalTests`**: Generate Page Objects and spec files using `.github/prompts/prepare-functional-tests.prompt.md`.

### API Track

1. **`apiTestPlan`**: Generate API test plan and schemas using `.github/prompts/api-test-plan.prompt.md`.
2. **`apiCodeGenerator`**: Generate Playwright API tests and client utilities using `.github/prompts/api-code-generator.prompt.md`.

This doc exists as a lightweight pointer to avoid duplicate onboarding content.
