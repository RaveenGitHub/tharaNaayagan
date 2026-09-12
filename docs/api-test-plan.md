<!-- Author: Raveen -->

# Enterprise API Test Plan

## 1. Executive Summary

This document defines the comprehensive API Test Plan for the platform's backend and service interfaces. It specifies endpoint contracts, authentication policies, payload schemas, risk-based test scenarios (positive, negative, boundary, and OWASP API Top 10 security), and test data strategies across all supported environments.

---

## 2. API Architecture & Environment Endpoints

| Environment | Base URL                  | API Base URL                  | Auth Mechanism          |
| :---------- | :------------------------ | :---------------------------- | :---------------------- |
| **DEV**     | `http://127.0.0.1:4173`   | `http://127.0.0.1:4173/api`   | Bearer Token / Mock JWT |
| **QA**      | `https://qa.example.com`  | `https://qa.example.com/api`  | OAuth 2.0 / Bearer JWT  |
| **UAT**     | `https://uat.example.com` | `https://uat.example.com/api` | OAuth 2.0 / Bearer JWT  |
| **PROD**    | `https://example.com`     | `https://example.com/api`     | Mutual TLS / OAuth 2.0  |

---

## 3. Discovered Endpoint Catalog

### Endpoint 1: Authentication & Token Issuance

- **Requirement ID**: `REQ-API-01`
- **Method & Path**: `POST /api/v1/auth/login`
- **Description**: Authenticates user credentials and returns a scoped session token with persona claims.
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
  - `200 OK`: Returns JWT token, user persona (`Admin`, `User`, `Guest`), and expiration timestamp.
  - `400 Bad Request`: Missing username or password fields.
  - `401 Unauthorized`: Invalid credentials supplied.
  - `422 Unprocessable Entity`: Malformed JSON or invalid email structure.

### Endpoint 2: Session Introspection & Profile

- **Requirement ID**: `REQ-API-02`
- **Method & Path**: `GET /api/v1/user/profile`
- **Description**: Retrieves profile data and authorized scopes for the authenticated caller.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response Contracts**:
  - `200 OK`: Returns user details and role permissions.
  - `401 Unauthorized`: Missing or invalid Bearer token.
  - `403 Forbidden`: Insufficient privilege scope.

---

## 4. API Scenario Test Matrix

| Scenario ID    | Endpoint                   | Category              | Description                                                               | Persona   | Risk     | Priority |
| :------------- | :------------------------- | :-------------------- | :------------------------------------------------------------------------ | :-------- | :------- | :------- |
| **SCN-API-01** | `POST /api/v1/auth/login`  | Positive / Contract   | Valid admin credentials return 200 OK with valid JWT token                | Admin     | High     | P1       |
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
   - `X-Request-ID`: Generated UUID for end-to-end request tracing.
2. **Persona Token Matrix**:
   - `Admin`: Full read/write access token.
   - `User`: Standard user read/write access token.
   - `Guest`: Read-only public access token.
   - `Anonymous`: No header provided.

---

## 6. Traceability & Execution Governance

All API scenarios designed in this plan are tracked in [docs/traceability-tracker.md](docs/traceability-tracker.md) and automated via Playwright's `APIRequestContext` inside [tests/apiTests/api.spec.ts](tests/apiTests/api.spec.ts).
