# Contributing to Enterprise Playwright Automation Framework

Thank you for your interest in contributing! We welcome contributions, bug reports, and enhancements.

## Code of Conduct

Please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all project interactions.

## Development Workflow

1. **Fork and Clone**:

   ```bash
   git clone https://github.com/<your-username>/tharaNaayagan.git
   cd tharaNaayagan
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   npx playwright install --with-deps
   ```

3. **Branching Strategy**:
   - Create feature/bugfix branches off `main` (e.g., `feat/login-fixtures`, `fix/session-storage`).

4. **Quality Gates**:
   Before submitting any pull request, verify that linting and type checking succeed:

   ```bash
   npm run quality-gate
   ```

5. **Running Tests**:

   ```bash
   npm test
   npm run test:smoke
   ```

6. **Submitting Pull Requests**:
   - Ensure your commit messages are descriptive.
   - Reference any relevant issues in the PR description.
   - Verify CI passes across Chromium, Firefox, and WebKit matrix builds.
