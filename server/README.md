# OMS Server

Backend API for the OMS project. This service is built with Express, TypeScript, Sequelize, PostgreSQL, and Stripe. It handles authentication, stores, products, orders, payments, and several application-level security controls.

## Overview

The server provides:

- user registration, login, refresh, logout, and current-user lookup
- store management for admins
- public product listing and admin product management
- checkout and order history
- Stripe webhook handling for payment fulfillment
- layered security middleware for WAF, rate limiting, CSRF, HMAC, replay protection, request encryption, and response encryption

## Tech stack

- Node.js
- Express 5
- TypeScript
- Sequelize 7 with PostgreSQL
- Stripe
- Zod for request and environment validation
- JWT for access and refresh tokens

## Main features

- first registered user becomes `admin`, later users become `customer`
- device fingerprint is tied to refresh flow
- one active session per user is enforced at login
- refresh token is stored in an HTTP-only cookie
- session-level HMAC secret is returned after login and refresh
- request replay is blocked using nonce storage
- authenticated traffic can be HMAC-signed and encrypted
- Stripe checkout completion updates orders and inventory

## Project structure

```text
server/
  src/
    app.ts                    Express app and middleware stack
    server.ts                 Startup entrypoint
    config/                   Database, logger, Stripe config
    middlewares/              Auth, WAF, CSRF, HMAC, encryption, errors
    models/                   Sequelize models and associations
    modules/
      auth/                   Auth routes, controller, service, validators
      stores/                 Store routes, controller, service, validators
      products/               Product routes, controller, service, validators
      orders/                 Order routes, controller, service
      payments/               Payment routes, controller, service
    security/                 JWT, AES, HMAC, nonce, fingerprint helpers
    utils/                    Shared helpers and error utilities
```

## Installation

1. Install dependencies:

```bash
cd server
npm install
```

2. Create a `.env` file in `server/`.

3. Start PostgreSQL and make sure the configured database exists.

4. Run the development server:

```bash
npm run dev
```

## Available scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment variables

All environment variables are validated at startup in [src/utils/envValidator.ts](/Users/iphtech26/Desktop/OMS/server/src/utils/envValidator.ts:1).

| Variable | Required | Description |
| --- | --- | --- |
| `JWT_ACCESS_SECRET` | Yes | Secret for access token signing, minimum 32 characters |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh token signing, minimum 32 characters |
| `JWT_ACCESS_EXPIRES_IN` | Yes | Access token TTL, for example `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Yes | Refresh token TTL, for example `7d` |
| `DB_NAME` | Yes | PostgreSQL database name |
| `DB_USER` | Yes | PostgreSQL user |
| `DB_PASS` | Yes | PostgreSQL password |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port |
| `COOKIE_SECRET` | Yes | Secret used by `cookie-parser`, minimum 32 characters |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key, must start with `sk_test_` or `sk_live_` |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook secret, starts with `whsec_` |
| `RATE_LIMIT_AUTH` | Yes | Rate limit max for auth endpoints |
| `RATE_LIMIT_MAX` | Yes | Global rate limit max |
| `PORT` | Yes | HTTP port |
| `NODE_ENV` | Yes | `development`, `production`, or `test` |

## Example `.env`

```env
JWT_ACCESS_SECRET=replace-with-very-long-access-secret
JWT_REFRESH_SECRET=replace-with-very-long-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

DB_NAME=oms
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_PORT=5432

COOKIE_SECRET=replace-with-very-long-cookie-secret

STRIPE_SECRET_KEY=sk_test_example
STRIPE_PUBLISHABLE_KEY=pk_test_example
STRIPE_WEBHOOK_SECRET=whsec_example

RATE_LIMIT_AUTH=5
RATE_LIMIT_MAX=120

PORT=5000
NODE_ENV=development
```

## Startup behavior

Startup is handled in [src/server.ts](/Users/iphtech26/Desktop/OMS/server/src/server.ts:1).

On boot the server:

1. loads environment variables
2. validates config
3. initializes database connection
4. syncs Sequelize models in development mode
5. cleans expired nonce records
6. starts the nonce sweeper
7. starts the Express server

## Database behavior

Database configuration lives in [src/config/database.ts](/Users/iphtech26/Desktop/OMS/server/src/config/database.ts:1).

Important notes:

- PostgreSQL is the backing database
- Sequelize sync with `alter: true` runs only in `development`
- production deployments should use proper migrations instead of sync
- timezone is configured as `+05:30`

## Data model summary

Main entities:

- `User`
- `Session`
- `Store`
- `Category`
- `Product`
- `Cart`
- `CartItem`
- `MasterOrder`
- `Order`
- `OrderItem`
- `Payment`
- `InventoryLog`
- `RequestNonce`

Associations are defined in [src/models/index.ts](/Users/iphtech26/Desktop/OMS/server/src/models/index.ts:1).

## Middleware stack

The main middleware chain is configured in [src/app.ts](/Users/iphtech26/Desktop/OMS/server/src/app.ts:1).

Applied middleware, in order:

1. `helmet` with CSP configuration
2. custom `waf`
3. `cors`
4. Stripe raw body parser for `/api/payments/webhook`
5. `cookie-parser`
6. JSON and URL-encoded parsers
7. request logger
8. global rate limiter
9. custom security headers
10. device fingerprint middleware
11. replay protection
12. HMAC verification
13. CSRF protection
14. request body decryption
15. response encryption
16. route modules
17. centralized error handler

## Security model

This server uses several layers of security.

### 1. HTTP hardening

- `helmet` is enabled
- custom security headers are added
- `X-Powered-By` is removed by the WAF

### 2. Web application firewall

The WAF inspects:

- suspicious URL content
- query strings
- request body values
- user agents
- suspicious proxy-style headers
- honeypot paths like `/.env` and `/wp-admin`

Reference: [src/middlewares/waf.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/waf.middleware.ts:1)

### 3. Rate limiting

- global limiter for all requests
- stricter limiter for auth routes

Reference: [src/middlewares/rateLimit.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/rateLimit.middleware.ts:1)

### 4. JWT authentication

- access tokens are used for authenticated API access
- refresh tokens are stored in cookies
- admin-only routes are protected by role checks

References:

- [src/middlewares/requireAuth.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/requireAuth.middleware.ts:1)
- [src/middlewares/adminOnly.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/adminOnly.middleware.ts:1)

### 5. Session binding

- login creates a session record
- only one session per user is kept
- refresh validates session ID and device fingerprint
- each session has its own HMAC secret

### 6. Device fingerprint

The refresh flow compares the current request fingerprint with the fingerprint stored in the token and session.

Reference: [src/security/fingerprint.ts](/Users/iphtech26/Desktop/OMS/server/src/security/fingerprint.ts:1)

### 7. Replay protection

- requests are expected to include `x-nonce` and `x-timestamp`
- nonces are stored and rejected if reused
- requests older than 5 minutes are rejected

Reference: [src/middlewares/replay.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/replay.middleware.ts:1)

### 8. HMAC verification

Requests are verified using:

- `x-signature`
- `x-timestamp`
- `x-nonce`
- encrypted payload value

The signing secret is either:

- the bootstrap `HMAC_SECRET` for initial auth flow, or
- the current session HMAC secret for authenticated flow

Reference: [src/middlewares/hmac.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/hmac.middleware.ts:1)

### 9. Request and response encryption

- request bodies can be decrypted from `body.data`
- responses can be re-encrypted before leaving the API
- login and bootstrap auth routes are excluded from encryption flow

References:

- [src/middlewares/encryption.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/encryption.middleware.ts:1)
- [src/middlewares/responseEncryption.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/responseEncryption.middleware.ts:1)

### 10. CSRF protection

- a CSRF cookie is issued
- unsafe methods require `x-csrf-token`
- webhook and some auth bootstrap routes are excluded

Reference: [src/middlewares/csrf.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/csrf.middleware.ts:1)

## Authentication flow

### Register

- `POST /api/auth/register`
- creates a user
- first user becomes `admin`
- later users become `customer`

### Login

- `POST /api/auth/login`
- validates credentials
- deletes older sessions for that user
- creates a new session
- returns access token in JSON
- sets refresh token cookie
- returns `x-session-hmac` header

### Refresh

- `POST /api/auth/refresh`
- requires the refresh token cookie
- validates session and device fingerprint
- rotates refresh token and session HMAC secret
- returns a new access token

### Logout

- `POST /api/auth/logout`
- requires auth
- deletes the active session if the refresh token cookie is present
- clears the refresh token cookie

### Me

- `GET /api/auth/me`
- returns the authenticated user payload from the access token

## API routes

Base URL examples assume local development on `http://localhost:5000`.

### Auth

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and create a session |
| `POST` | `/api/auth/refresh` | Public with refresh cookie | Refresh access token |
| `POST` | `/api/auth/logout` | Authenticated | Logout current session |
| `GET` | `/api/auth/me` | Authenticated | Get current user |

### Stores

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/stores` | Admin | Create a store |
| `GET` | `/api/stores` | Admin | List stores |

### Products

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/products` | Admin | Create a product |
| `GET` | `/api/products/alerts/low-stock` | Admin | List low-stock products |
| `GET` | `/api/products` | Public | Paginated public product list |
| `GET` | `/api/products/:id` | Public | Get product details |

### Orders

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/orders/admin` | Admin | List all orders |
| `POST` | `/api/orders/checkout` | Authenticated | Start checkout flow |
| `GET` | `/api/orders` | Authenticated | List current user orders |
| `GET` | `/api/orders/:id` | Authenticated | Get one customer order |
| `PATCH` | `/api/orders/:id/status` | Admin | Update order status |

### Payments

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/payments/webhook` | Stripe | Process Stripe webhook |

## Example responses

Success responses use the helper in [src/utils/api-response.ts](/Users/iphtech26/Desktop/OMS/server/src/utils/api-response.ts:1).

Example success response:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "123",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

Example error response:

```json
{
  "status": "error",
  "message": "Authentication required"
}
```

## Stripe payment flow

Stripe webhook logic is implemented in [src/modules/payments/payment.service.ts](/Users/iphtech26/Desktop/OMS/server/src/modules/payments/payment.service.ts:1).

Current flow:

1. checkout creates a Stripe Checkout Session
2. Stripe calls `/api/payments/webhook`
3. webhook verifies Stripe signature
4. completed payment marks payment as successful
5. master order moves to `processing`
6. child orders are marked paid and confirmed
7. product stock, reserved stock, and sold stock are updated
8. inventory logs are created

The fulfillment logic is idempotent for already-successful payments.

## Logging and errors

- request and response logging is handled in [src/middlewares/error.middleware.ts](/Users/iphtech26/Desktop/OMS/server/src/middlewares/error.middleware.ts:1)
- passwords are omitted from logged request bodies
- centralized error handling returns consistent JSON error responses

## Notes for development

- `sequelize.sync({ alter: true })` runs in development, so schema can change automatically
- this is convenient for local work but not ideal for production change management
- webhook route uses `express.raw()` and must stay before the standard JSON parser for Stripe verification to work
- CORS currently allows only `FRONTEND_URL` and credentials

## Known handoff notes

- `FRONTEND_URL` is read in [src/app.ts](/Users/iphtech26/Desktop/OMS/server/src/app.ts:1) but is not validated in `envValidator.ts`
- `HMAC_SECRET` and `AES_SECRET` are used by security helpers but are not validated in `envValidator.ts`
- `payments` route module currently only exposes the Stripe webhook route
- production rollout should add database migrations, stronger secrets management, and shared storage for replay/rate-limit style protections if running multiple instances

## Recommended next improvements

- add explicit DB migrations
- validate all security-related environment variables
- add OpenAPI or Postman collection for consumers
- add automated tests for auth, checkout, and webhook flow
- move memory-backed protections to shared infrastructure for horizontal scaling
