# ADR-006: Secrets Management Strategy

## Status
Partially implemented — local complete, production deferred

## Date
6 June 2026

## Context
The platform has multiple services that share secrets (JWT_ACCESS_SECRET
shared between Auth Service and API Gateway). These secrets must be
managed securely across environments.

## Decision
Local development: .env files, never committed to Git,
listed in .gitignore. Each developer generates their own secrets.

Production: AWS Secrets Manager (or GCP Secret Manager on GCP).
Secrets stored centrally, fetched at service startup via SDK.
IAM roles restrict which services can access which secrets.
Automatic rotation configured for JWT secrets.

## Implementation plan
Phase 14 (deployment) will implement Secrets Manager for production.
All services centralize config in src/config/env.ts — switching
from process.env to Secrets Manager SDK requires changing only
this one file per service.

## Why deferred
Implementing Secrets Manager requires real cloud infrastructure,
IAM configuration, and mocking in tests — adding 2-3 sessions
of infrastructure work that does not advance core feature
development. The current .env approach is secure for local
development and the architecture supports a clean migration.

## What this means in interviews
"In development we use .env files, never committed to Git.
In production we use AWS Secrets Manager — each service fetches
secrets at startup via the AWS SDK. Our config is centralized
in env.ts so switching secret sources is a one-file change
per service. Rotation is automated and access is audited via IAM."

## Alternatives considered
Implement Secrets Manager now — rejected due to infrastructure
complexity distracting from core feature development.
HashiCorp Vault — more powerful but overkill for this project size.