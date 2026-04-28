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

**Frontend:** Next.js, TypeScript, Tailwind CSS  
**Backend:** Express, Spring Boot, Django, FastAPI, Flask  
**Databases:** PostgreSQL, MongoDB, Redis  
**Messaging:** RabbitMQ  
**DevOps:** Docker, GitHub Actions, GCP Cloud Run  
**Monitoring:** Prometheus, Grafana  

## Project structure

apps/          → Frontend applications
services/      → Backend microservices
demo-apps/     → Applications that generate logs for monitoring
packages/      → Shared code across services
infra/         → Docker, Kubernetes, Terraform, monitoring configs
docs/          → Architecture, decisions, daily logs, API contracts

## Getting started

Documentation in progress. See docs/ folder.

## Build phases

- [x] Phase 0 — Project setup
- [ ] Phase 1 — Auth service
- [ ] Phase 2 — API Gateway
- [ ] Phase 3 — Next.js dashboard
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

## Author

Built as a project-based learning system to practice full-stack engineering,
microservices architecture, DevOps, and AI integration.