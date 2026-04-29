# ADR-001: Use Monorepo Structure

## Status
Accepted

## Date
28 April 2026

## Context
We are building multiple services: API Gateway, Auth, Incident, Log, AI,
and Notification. Plus a Next.js frontend and demo applications. Each service
uses a different technology (Express, Spring Boot, Django, FastAPI, Flask).

## Decision
Use a monorepo — one single GitHub repository containing all services,
frontend apps, demo apps, infrastructure configs, and documentation.

## Reason
- Easier to manage as a solo developer learning multiple technologies
- All documentation lives in one place
- Easier to run locally with Docker Compose
- Simpler CI/CD pipeline to set up initially
- Shared packages can be reused across services

## Tradeoffs
- The repository becomes large over time
- In a real company with large teams, separate repos per service
  (polyrepo) would be more common
- We accept this tradeoff because learning depth matters more than
  production-scale repo management at this stage

## Alternatives considered
Polyrepo — one repo per service. Rejected because it adds overhead
that slows learning without adding meaningful benefit at this scale.