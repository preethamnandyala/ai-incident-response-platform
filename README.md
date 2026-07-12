# AI Incident Response Platform

A production-style microservices platform for monitoring applications, detecting failures, creating incidents and using AI to analyze root causes.

## What this is

This platform simulates a real-world incident management system similar to Datadog + PagerDuty. It collects logs from demo applications, detects critical failures, creates incidents automatically, sends notifications, and uses AI to suggest root causes.

## Services

| Service | Technology | Responsibility |
|---|---|---|
| API Gateway | Express.js | Single entry point, JWT verification, routing |
| Auth Service | Express.js | Signup, login, JWT, RBAC |
| Incident Service | Spring Boot | Create and manage incidents |
| Log Service | Django | Ingest and store logs, detect critical events |
| AI Service | FastAPI | Summarize incidents, suggest root causes |
| Notification Service | Flask | Send alerts via email and webhook |

## Tech stack

**Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Zustand
**Backend:** Express, Spring Boot, Django, FastAPI, Flask
**Databases:** PostgreSQL, MongoDB, Redis
**Messaging:** RabbitMQ
**DevOps:** Docker, GitHub Actions, AWS ECS Fargate
**Monitoring:** Prometheus, Grafana, CloudWatch

## Project structure

apps/          → Frontend applications (Next.js dashboard)
services/      → Backend microservices
demo-apps/     → Applications that generate logs for monitoring
packages/      → Shared code across services
infra/         → Docker, Kubernetes, Terraform, monitoring configs
docs/          → Architecture, decisions, daily logs, API contracts

## Getting started

Documentation in progress. See docs/ folder.
Full local setup available after Phase 10 (Docker).

## Build phases

- [x] Phase 0 — Project setup
- [x] Phase 1 — Auth service (1a core auth, 1b password management, 1c OAuth2)
- [x] Phase 2 — API Gateway
- [x] Phase 3 — Next.js dashboard
- [ ] Phase 4 — Incident service
- [ ] Phase 5 — Log service
- [ ] Phase 6 — RabbitMQ event system
- [ ] Phase 7 — Demo applications
- [ ] Phase 8 — AI service
- [ ] Phase 9 — Notification service
- [ ] Phase 10 — Docker
- [ ] Phase 11 — Testing
- [ ] Phase 12 — CI/CD
- [ ] Phase 13 — Monitoring
- [ ] Phase 14 — Deployment

## Current status

**Active development** — Phase 4 (Incident Service) in progress.

Completed:
- Phase 0 — Monorepo structure, Git workflow, documentation system
- Phase 1a — Auth service: signup, login, logout, refresh, JWT, bcrypt
- Phase 1b — Password management: OTP-based forgot/reset password, email verification
- Phase 1c — OAuth2: Google login with Passport.js, duplicate email handling
- Phase 2 — API Gateway: JWT verification at edge, rate limiting,
             request logging with IDs, proxy routing to 5 services
- Phase 3 — Next.js dashboard: auth pages, dashboard layout,
             protected routes, Zustand auth store, Axios interceptors,
             shadcn/ui components

Tech decisions documented in docs/decisions/ (6 ADRs).
96 unit tests, 100% coverage on auth service.
12 middleware tests on API Gateway.
Frontend E2E tests planned for Phase 11.

## Author

Built as a project-based learning system to practice full-stack engineering,
microservices architecture, DevOps, and AI integration.