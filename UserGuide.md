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
npx playwright test tests/smoke.spec.ts --project=chromium --reporter=line
```

## Main docs

- [README.md](README.md) — primary project guide
- [docs/traceability-tracker.md](docs/traceability-tracker.md) — traceability and status tracking
- [docs/test-strategy-template.md](docs/test-strategy-template.md) — reusable test strategy template

This doc exists as a lightweight pointer to avoid duplicate onboarding content.
