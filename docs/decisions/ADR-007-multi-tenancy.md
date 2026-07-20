# ADR-007: Multi-tenancy Strategy

## Status
Accepted

## Date
8 June 2026

## Context
The platform is designed to serve multiple organizations
simultaneously — not just our own demo applications. Companies
like Uber, Amazon, or any startup should be able to use this
platform to monitor their own services. This requires isolating
each organization's data from others.

## Decision
Add organizationId to every domain entity from Phase 4 onwards.
organizationId is extracted from the JWT token by the API Gateway
and forwarded as x-organization-id header to all downstream
services. Services never trust organizationId from request bodies
— only from the verified gateway header.

Every query is scoped by organizationId:
incidents belong to an organization, not just a user.
Logs belong to an organization.
AI analyses belong to an organization.

## Why from Phase 4 and not earlier
Auth Service (Phase 1) manages users — users can belong to an
organization but the auth system itself is cross-organization.
API Gateway (Phase 2) is infrastructure — organization-agnostic.
Dashboard (Phase 3) reads organizationId from the JWT and passes
it automatically via the gateway.

Domain services (Incident, Log, AI, Notification) all need
organizationId because they manage business data that must
be isolated between organizations.

## How organizations are created
Phase 4 adds a simple organizationId field defaulting to 'default'
for the initial single-tenant use case. A full organization
registration flow (companies sign up, get API keys, manage members)
is planned as a post-Phase-14 extension that transforms this into
a true SaaS platform.

## SDK and Agent implications
The SDK and Agent will include organizationId in every API call
via the API key — the key maps to an organization server-side.
External applications never send organizationId directly —
they authenticate with an API key and the platform resolves
the organizationId automatically.

## Tradeoffs
Adds a required field to every domain entity and every query.
Small overhead per request. Accepted because building multi-tenancy
in from the start is far cheaper than retrofitting it later —
retrofitting would require a database migration touching every
table and changing every query across all services.

## Alternatives considered
Separate database per organization — rejected as operationally
complex and expensive at scale. Schema-per-organization in
PostgreSQL — rejected for same reason. Row-level security in
PostgreSQL — considered for future enhancement on top of
application-level organizationId filtering.