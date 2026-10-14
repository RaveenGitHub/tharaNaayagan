<!-- Author: Raveen -->

# Enterprise API Test Plan

## 1. Executive Summary

This document defines the comprehensive API Test Plan for the platform's backend and service interfaces. It specifies endpoint contracts, authentication policies, payload schemas, risk-based test scenarios (positive, negative, boundary, and OWASP API Top 10 security), and test data strategies across all supported environments.

---

## 2. API Architecture & Environment Endpoints

The `example.com` endpoints and sample credentials in this plan are placeholders for planning/mock flows only. They are not approved service targets or usable shared-environment credentials.

Production execution is prohibited. Before changing approved scenarios or artifacts, consume `npm run impact:analyze -- <IDs-or-paths> --json` and review dependency, plan/strategy, risk, and test-data signals. Confirm material contract/behavior changes, live targets, cross-module expansion, bulk additions, and new thresholds with the owner. Update linked metadata/documents together; semantic propagation is manual. Framework target/API-client regressions run without network access and do not establish live API coverage. Invalid configured QA/UAT/production URLs fail explicitly, including during local runs.

| Environment | Base URL                  | API Base URL                  | Auth Mechanism          |
| :---------- | :------------------------ | :---------------------------- | :---------------------- |
| **DEV**     | `http://127.0.0.1:4173`   | `http://127.0.0.1:4173/api`   | Bearer Token / Mock JWT |
| **QA**      | `https://qa.example.com`  | `https://qa.example.com/api`  | OAuth 2.0 / Bearer JWT  |
| **UAT**     | `https://uat.example.com` | `https://uat.example.com/api` | OAuth 2.0 / Bearer JWT  |
| **PROD**    | `https://example.com`     | `https://example.com/api`     | Mutual TLS / OAuth 2.0  |

---

## 3. Mock Endpoint Catalog

### Endpoint 1: Authentication & Token Issuance

- **Requirement ID**: `REQ-API-01`
- **Method & Path**: `POST /api/v1/auth/login`
- **Description**: Defines intercepted login responses for local mock-flow checks; no backend authentication or token-claim validation occurs.
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`
- **Request Body**:
  ```json
  {
    "username": "admin@example.com",
    "password": "Admin@123"
  }
  ```
- **Response Contracts**:
  - `200 OK`: Mock admin/user responses contain an opaque mock token string, `user`, `role`, and `expiresIn: 3600` seconds. The token is not a validated JWT and no expiration timestamp is asserted.
  - `400 Bad Request`: Missing username or password fields.
  - `401 Unauthorized`: Invalid credentials supplied.
  - `422 Unprocessable Entity`: Mock long-email validation response. Malformed JSON handling is not exercised.

### Endpoint 2: Session Introspection & Profile

- **Requirement ID**: `REQ-API-02`
- **Method & Path**: `GET /api/v1/user/profile`
- **Description**: Retrieves profile data and authorized scopes for the authenticated caller.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response Contracts**:
  - `200 OK`: Returns user details and role permissions.
  - `401 Unauthorized`: Missing or invalid Bearer token.
  - `403 Forbidden`: Planning target only; insufficient privilege scope is not exercised by the current mock suite.

---

## 4. API Scenario Test Matrix

**Test Plan ID:** `TP-API-01`.

**Test Strategy alignment:** Sections 3.1 and 5.3 of `test-strategy-template.md`.

| Scenario ID    | Endpoint                   | Category              | Description                                                               | Persona   | Risk     | Priority |
| :------------- | :------------------------- | :-------------------- | :------------------------------------------------------------------------ | :-------- | :------- | :------- |
| **SCN-API-01** | `POST /api/v1/auth/login`  | Positive / Contract   | Admin mock login returns 200 OK with a mock token, role, and expiresIn     | Admin     | High     | P1       |
| **SCN-API-02** | `POST /api/v1/auth/login`  | Positive / Contract   | Valid standard user credentials return 200 OK with user role              | User      | High     | P1       |
| **SCN-API-03** | `POST /api/v1/auth/login`  | Negative / Auth       | Invalid password returns 401 Unauthorized with error message              | Admin     | High     | P1       |
| **SCN-API-04** | `POST /api/v1/auth/login`  | Negative / Validation | Empty payload or missing fields returns 400 Bad Request                   | Guest     | Medium   | P2       |
| **SCN-API-05** | `POST /api/v1/auth/login`  | Boundary / Schema     | Extremely long email (1024 chars) returns graceful validation error       | Guest     | Low      | P3       |
| **SCN-API-06** | `POST /api/v1/auth/login`  | Security (OWASP-10)   | SQL injection payload in username is rejected without leaking SQL errors  | Guest     | Critical | P1       |
| **SCN-API-07** | `GET /api/v1/user/profile` | Security (BOLA/Auth)  | Request without Authorization header returns 401 Unauthorized             | Anonymous | High     | P1       |
| **SCN-API-08** | `GET /api/v1/user/profile` | Positive / Auth       | Valid Bearer token returns profile payload matching authenticated persona | Admin     | High     | P1       |

---

## 5. Header & Authentication Strategy

1. **Default Headers**: Injected automatically by `ApiClient`:
   - `Content-Type: application/json`
   - `Accept: application/json`
   - `X-Request-ID`: Generated `req-<timestamp>-<random suffix>` correlation identifier, not a UUID or proof of end-to-end tracing. Browser mock fetches do not use `ApiClient` header injection.
2. **Planned Persona Token Matrix** (not verified authorization behavior):
   - `Admin`: Full read/write access token.
   - `User`: Standard user read/write access token.
   - `Guest`: Read-only public access token.
   - `Anonymous`: No header provided.

---

## 6. Traceability & Execution Governance

API scenarios are defined in this plan and mapped to the tracker for current execution status. The present mock implementation in [tests/apiTests/api.spec.ts](../tests/apiTests/api.spec.ts) uses browser-intercepted responses. Only the separate API-client safety assertion uses the request fixture; no service API contract is exercised through `APIRequestContext`.

## 7. Current Automation Evidence Boundary

The current API-named tests use `page.route()` and browser `fetch()` against intercepted responses. They do not call a service through `APIRequestContext`, and passing results establish only the defined browser/mock flow. The standard-user login scenario (`SCN-API-02`) and 1024-character email boundary (`SCN-API-05`) are covered by mocked responses; the latter uses the documented 422 invalid-email response shape. The authenticated profile scenario (`SCN-API-08`) is asserted alongside `SCN-API-07` in the current mocked profile test. Before adding real service tests, obtain the approved OpenAPI/contract source, environment endpoint, authentication method, and safe test-data policy from the API owner.

The reusable `ApiClient` rejects non-local requests unless `ALLOW_NON_LOCAL_TEST_TARGET=true` and the URL matches configured QA/UAT origins. Configured production origins are always rejected. Use dedicated test credentials and an owner-approved isolated environment; local demo defaults are not valid shared-environment credentials.
