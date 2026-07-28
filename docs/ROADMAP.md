# IncidentAI Platform — Product Roadmap

Last updated: 31 July 2026

---

## Completed Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Project setup, monorepo, Docker | ✅ Complete |
| Phase 1a | Auth Service — signup, login, JWT | ✅ Complete |
| Phase 1b | Auth Service — email verification OTP | ✅ Complete |
| Phase 1c | Auth Service — Google OAuth | ✅ Complete |
| Phase 2 | API Gateway — JWT verification, proxying | ✅ Complete |
| Phase 3 | Log Service — Django, MongoDB | ✅ Complete |
| Phase 4 | Incident Service — Spring Boot, PostgreSQL | ✅ Complete |
| Phase 5 | AI Service — FastAPI, Anthropic Claude | ✅ Complete |
| Phase 6 | Notification Service — Flask, RabbitMQ | ✅ Complete |
| Phase 7 | SDK — Node.js, npm package | ✅ Complete |
| Phase 8 | Docker Compose — full platform | ✅ Complete |
| Phase 9 | Demo apps — payment, user, inventory | ✅ Complete |
| Phase 10 | Frontend — Next.js, auth flows | ✅ Complete |
| Phase 11 | Frontend — dashboard, incidents, logs | ✅ Complete |
| Phase 12 | Testing — 255 tests across all services | ✅ Complete |

---

## Upcoming Phases

### Phase 13 — CI/CD Pipeline
**Goal:** Automated testing and deployment pipeline
**Timeline:** 2 sessions

Tools:
→ GitHub Actions
→ SonarQube (code quality)

Pipeline steps:
→ Trigger on push to feature/* and develop
→ Run unit tests for all services
→ Run integration tests
→ SonarQube code quality scan
→ Build Docker images
→ Report results on PR
→ Block merge if tests fail

**Deliverables:**
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`
- SonarQube configuration (optional)

---

### Phase 14 — Monitoring
**Goal:** Real-time platform observability
**Timeline:** 2 sessions

Tools:
→ Prometheus — metrics collection
→ Grafana — metrics visualization
→ ELK/OpenSearch — log aggregation (optional)

Metrics tracked:
→ Request rate per service
→ Error rate per service
→ Response time (p50, p95, p99)
→ CPU and memory per container
→ RabbitMQ queue depth
→ Database connection pool usage

Dashboards:
→ Platform overview
→ Per-service health
→ Incident creation rate
→ AI analysis performance

**Deliverables:**
- `monitoring/prometheus.yml`
- `monitoring/grafana/dashboards/`
- Metrics endpoints on all services (`/metrics`)
- Docker Compose monitoring profile

---

### Phase 15 — AWS Deployment
**Goal:** Production deployment on AWS
**Timeline:** 4 sessions

AWS Services:
→ ECR — container registry
→ ECS Fargate — container management
→ RDS — managed PostgreSQL
→ DocumentDB — managed MongoDB
→ ElastiCache — managed Redis
→ ALB — Application Load Balancer
→ Route53 — DNS management
→ ACM — SSL certificates
→ Secrets Manager — secrets management
→ CloudWatch — logs and alerts

Infrastructure as Code:
→ Terraform for all AWS resources
→ Version controlled infrastructure
→ Same environment every time

Environments:
→ staging.incidentai.com
→ app.incidentai.com (production)

**Deliverables:**
- `terraform/` directory with all AWS resources
- `terraform/environments/staging/`
- `terraform/environments/production/`
- Deployment runbook

---

## Post-Phase-15 Roadmap

### Product Features

#### Organization Registration

Priority: HIGH
Timeline: 2 weeks after Phase 15

→ Company signs up → gets unique org ID (org_abc123)
→ Gets API key for SDK integration
→ Billing plan selection
→ Team member invitations
→ Organization settings page

#### API Key Management

Priority: HIGH
Timeline: alongside org registration

→ Generate multiple API keys per organization
→ Key rotation (invalidate old, issue new)
→ Key scoping (read-only, write-only, admin)
→ Usage tracking per key
→ Keys stored hashed in database

#### On-Call Rotation

Priority: HIGH
Timeline: 1 month after Phase 15

→ Define on-call schedules per team
→ Auto-escalation if no response in 15 minutes
→ PagerDuty integration
→ SMS + phone call for CRITICAL incidents

#### Custom Alert Rules

Priority: MEDIUM
Timeline: 1 month after Phase 15

→ "Alert if error rate > 5% for 5 minutes"
→ "Alert if response time > 2 seconds"
→ "Suppress alerts between 2am-6am"
→ Per-service thresholds
→ Alert routing to specific teams

#### Service Ownership Routing

Priority: MEDIUM
Timeline: 2 months after Phase 15

→ payment-service → payments team
→ user-service → auth team
→ Incidents auto-routed to correct team
→ Reduces alert noise

#### Real-time WebSockets

Priority: HIGH
Timeline: 2 months after Phase 15

→ Dashboard updates in real time
→ New incident appears instantly
→ No page refresh needed
→ Socket.io or native WebSockets
→ Like Slack messages in real time

#### Stripe Billing

Priority: HIGH
Timeline: 2 months after Phase 15

Plans:
→ Free: 1,000 logs/month, 1 service
→ Pro: $49/month, unlimited logs, 10 services
→ Enterprise: custom pricing, unlimited everything

Features:
→ Usage-based billing
→ Automatic invoicing
→ Credit card management
→ Usage dashboard
→ Overage alerts

---

### SDKs

#### Python SDK

Priority: HIGH
Timeline: 1 month after Phase 15

pip install incidentai

from incidentai import IncidentAI
monitor = IncidentAI(api_key='pk_live_xxx', service='payment-service')
monitor.critical('Database down', {'error': str(e)})

Published to: PyPI

#### Java SDK

Priority: HIGH
Timeline: 1 month after Phase 15

<dependency> <groupId>com.incidentai</groupId> <artifactId>incidentai-sdk</artifactId> <version>1.0.0</version> </dependency>

Published to: Maven Central

#### Go SDK

Priority: MEDIUM
Timeline: 2 months after Phase 15

go get github.com/incidentai/sdk-go

Published to: pkg.go.dev

#### .NET SDK

Priority: LOW
Timeline: 3 months after Phase 15

Install-Package IncidentAI

Published to: NuGet

#### Docker Sidecar Agent

Priority: MEDIUM
Timeline: 3 months after Phase 15

Zero code changes needed.
Deploy alongside any container.
Monitors: CPU, memory, disk, process health.
Like Datadog Agent.

---

### Infrastructure Improvements

#### Kubernetes

Priority: MEDIUM
Timeline: 3 months after Phase 15

→ Auto-scaling based on load
→ Self-healing containers
→ Rolling deployments (zero downtime)
→ Horizontal pod autoscaling
→ Migrate from ECS to EKS

#### OpenSearch Integration

Priority: MEDIUM
Timeline: 2 months after Phase 15

→ Full-text search across all logs
→ "Find logs containing timeout last 24 hours"
→ Faster than MongoDB text search at scale
→ AWS OpenSearch Service

Priority: LOW
Timeline: 4 months after Phase 15

→ Find similar incidents using AI embeddings
→ "Show incidents similar to this one"
→ Prevents duplicate incident investigation
→ PostgreSQL pgvector extension

#### Dead Letter Queues

Priority: MEDIUM
Timeline: 1 month after Phase 15

→ Failed RabbitMQ messages → DLQ
→ Retry failed messages
→ Alert on DLQ depth
→ Message replay capability

---

### Security & Compliance

#### RBAC (Role-Based Access Control)

Priority: HIGH
Timeline: 2 months after Phase 15

Roles:
→ ADMIN: full access
→ DEVELOPER: create/view incidents
→ VIEWER: read only
→ Per-service permissions

Currently: all users are DEVELOPER

#### SSO (Single Sign-On)

riority: MEDIUM
Timeline: 3 months after Phase 15

→ Login with company Google/Microsoft/Okta
→ SAML 2.0 integration
→ No separate password needed
→ Enterprise requirement

#### SOC2 Compliance

Priority: LOW (required for enterprise)
Timeline: 6 months after Phase 15

→ Security audit trail
→ Access controls documentation
→ Encryption at rest and in transit
→ Annual security audit
→ Required for Fortune 500 customers

#### Audit Logs

Priority: MEDIUM
Timeline: 2 months after Phase 15

→ "Who changed this incident status?"
→ "Who deleted this log?"
→ Immutable audit trail
→ Required for SOC2

---

### AI Improvements

#### Anomaly Detection

Priority: HIGH
Timeline: 2 months after Phase 15

→ "Error rate is 3x higher than usual"
→ Detects problems before CRITICAL
→ Proactive alerting
→ ML-based baseline learning

#### Historical Pattern Matching

Priority: MEDIUM
Timeline: 3 months after Phase 15

→ "Last time this happened, the fix was X"
→ Reduces MTTR (Mean Time To Resolve)
→ Knowledge base from past incidents

#### Incident Prediction

Priority: LOW
Timeline: 4 months after Phase 15

→ "Memory trend → service crashes in 2 hours"
→ Prevent incidents before they happen
→ Proactive vs reactive monitoring

#### Auto-remediation

Priority: LOW
Timeline: 6 months after Phase 15

→ AI suggests fix → engineer approves
→ "Restart the service"
→ "Scale up instances"
→ "Roll back last deployment"
→ Runbook automation

---

### Developer Experience

#### CLI Tool

Priority: MEDIUM
Timeline: 3 months after Phase 15

incidentai logs --service payment-service --level CRITICAL
incidentai incidents list --status OPEN
incidentai incidents resolve abc-123
incidentai deploy --service payment-service

#### VS Code Extension

Priority: LOW
Timeline: 4 months after Phase 15

→ See incidents related to code you are editing
→ One-click to view logs from your service
→ AI analysis directly in editor

#### Slack App

Priority: MEDIUM
Timeline: 2 months after Phase 15

/incident list
/incident resolve abc-123
/incident assign abc-123 @preetham
Acknowledge from Slack

#### Webhook Support

Priority: HIGH
Timeline: 1 month after Phase 15

→ POST to any URL on incident creation
→ Integrate with any tool
→ Custom automations
→ Zapier/Make.com compatible

---

### Mobile App

Priority: LOW
Timeline: 6 months after Phase 15

Platforms: iOS + Android (React Native)

Features:
→ Push notifications for CRITICAL incidents
→ Acknowledge incidents from phone
→ View incident details
→ On-call engineer response

---

## 6-Month Startup Goal Checklist

Month 1-2 (Phases 13-15):
✅ CI/CD pipeline
✅ Monitoring (Grafana + Prometheus)
✅ AWS deployment
✅ incidentai.com live

Month 3:
□ Organization registration
□ API key management
□ Python + Java SDKs
□ Webhook support
□ Stripe billing

Month 4:
□ Real-time WebSockets
□ On-call rotation
□ Custom alert rules
□ Slack app

Month 5:
□ OpenSearch full-text search
□ Anomaly detection
□ RBAC improvements
□ Audit logs

Month 6:
□ Mobile app (MVP)
□ SOC2 compliance start
□ Kubernetes migration
□ Auto-remediation (basic)

→ Ship to first 10 customers by month 3
→ 100 customers by month 6
→ $10k MRR target by month 6

---

## Architecture Decision Records

| ADR | Decision |
|-----|----------|
| ADR-001 | Monorepo structure |
| ADR-002 | Auth service phase split |
| ADR-003 | Separate password service |
| ADR-004 | Email verification design |
| ADR-005 | OAuth2 duplicate email handling |
| ADR-006 | Secrets management strategy |
| ADR-007 | Multi-tenancy strategy |
| ADR-008 | Separate RabbitMQ queues per consumer |