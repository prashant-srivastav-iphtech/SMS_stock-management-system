# CoverUp OMS

Production-oriented headless multi-tenant Order Management System scaffold.

## Stack

- React, TypeScript, Tailwind CSS, React Router, Axios, Zustand, React Hook Form, Zod
- Node.js, Express, TypeScript, PostgreSQL, Sequelize v7, Redis, BullMQ, Stripe
- Session refresh cookies with rotating refresh tokens and in-memory access tokens
- HMAC signed encrypted API payloads, nonce replay protection, request logging, rate limiting, CSRF, device fingerprinting

## Run Locally

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`

API: `http://localhost:5000`

The first registered account becomes the only platform `admin`; all later users become `customer`.
