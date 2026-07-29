```markdown
# IncidentAI Platform — Product Roadmap

Last updated: 29 July 2026

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

**What we build:**
```
.github/workflows/ci.yml
.github/workflows/cd.yml
```

**CI pipeline (every push to feature/* and develop):**
→ Run all unit tests for all services (255 tests)
→ Run integration tests
→ Run AI eval gate (block if accuracy < 70%)
→ SonarQube code quality scan
→ Build Docker images
→ Report results on every PR
→ Block merge if any step fails

**CD pipeline (merge to main):**
→ Build production Docker images
→ Push to AWS ECR
→ Deploy to ECS staging automatically
→ Run smoke tests on staging
→ Manual approval gate before production
→ Deploy to production

**AI eval gate (new — blocks bad AI regressions):**
→ Run 20 golden incident examples through AI Service
→ Verify classification accuracy >= 70%
→ Block deploy if accuracy drops
→ Report per-category accuracy

**Tests added this phase:**
→ Pipeline smoke tests (5 tests)
→ Verify all services healthy after deploy
→ Verify JWT flow works end to end
→ Verify log ingestion works
→ Verify incident creation works

**Deliverables:**
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`
- `docs/CI_CD.md`
- SonarQube configuration (optional)

---

### Phase 13.5 — Real LLM Classification
**Goal:** Replace keyword matching with Claude classification
**Timeline:** 1 session

**The problem:**
```
Current approach (not real AI):
→ SDK sets level=CRITICAL
→ We trust the label
→ No independent detection

Better approach:
→ Raw log arrives (any level)
→ Claude classifies it independently
→ Detects problems even without severity field
→ Handles inconsistent log formats
```

**Structured output (Pydantic):**
```python
class LogClassification(BaseModel):
    severity: Literal['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    sev_level: Literal['SEV1', 'SEV2', 'SEV3', 'SEV4']
    category: Literal[
        'database', 'network', 'auth',
        'performance', 'memory', 'deployment', 'unknown'
    ]
    confidence: float  # 0.0 to 1.0
    reasoning: str
    should_create_incident: bool
```

**Rate-based detection (Redis):**
```
> 10 errors/minute → SEV2 incident
> 50 errors/minute → SEV1 incident
Same error repeated 10x in 5 min → incident
Sliding window algorithm
```

**Severity-based notifications:**
```
SEV1 (CRITICAL): PagerDuty + SMS + Slack + email
SEV2 (HIGH):     Slack + email
SEV3 (MEDIUM):   Slack only
SEV4 (LOW):      Dashboard only
```

**Tests added this phase:**

Unit tests (15):
→ test_classify_database_error()
→ test_classify_auth_error()
→ test_classify_unknown_log()
→ test_structured_output_schema()
→ test_confidence_threshold()
→ test_rate_detection_sev1()
→ test_rate_detection_sev2()
→ test_rate_detection_no_trigger()
→ test_sliding_window_reset()
→ test_different_services_tracked_separately()
→ test_sev1_notification_routing()
→ test_sev2_notification_routing()
→ test_sev3_notification_routing()
→ test_sev4_dashboard_only()
→ test_low_confidence_no_incident()

Integration tests (8):
→ Send raw log → Claude classifies it
→ Send 15 errors in 60 seconds → SEV2 incident created
→ Send unknown format log → fallback works
→ Redis counter increments correctly
→ Threshold triggers correct severity
→ Counter expires after window
→ SEV1 triggers SMS + Slack + email
→ SEV2 triggers Slack + email only

**Deliverables:**
- Updated AI Service with LLM classification
- Updated Notification Service with severity routing
- Redis rate detection logic

---

### Phase 13.6 — Rate-Based Detection
**Goal:** Detect incidents from patterns not just labels
**Timeline:** 0.5 sessions

**What we build:**
```
Redis-backed sliding window counters
Per service per minute error tracking
Pattern-based incident creation
```

**Detection rules:**
```
Rule 1 — Error rate spike:
  > 10 errors/minute → SEV2
  > 50 errors/minute → SEV1

Rule 2 — Repeated same error:
  Same error message 10x in 5 min → SEV2

Rule 3 — Rapid escalation:
  INFO → WARNING → ERROR in same service
  Within 2 minutes → SEV2

Rule 4 — Service completely silent:
  Service sending logs → suddenly stops
  30 seconds silence → SEV1 (service may be down)
```

**Tests added this phase:**

Unit tests (10):
→ test_sliding_window_counter_increment()
→ test_sliding_window_counter_ttl()
→ test_threshold_sev1_50_errors()
→ test_threshold_sev2_10_errors()
→ test_threshold_no_incident_5_errors()
→ test_window_reset_after_60_seconds()
→ test_repeated_same_error_detection()
→ test_rapid_escalation_detection()
→ test_service_silence_detection()
→ test_different_services_independent()

Integration tests (5):
→ Send error burst → incident created at correct severity
→ Verify Redis counters correct
→ Verify window expiry resets counter
→ Different services tracked independently
→ Pattern detection triggers correct notification

---

### Phase 14 — Monitoring + AI Tracing
**Goal:** Real-time platform observability including AI decisions
**Timeline:** 2 sessions

**Infrastructure metrics (Prometheus + Grafana):**
→ Request rate per service
→ Error rate per service
→ Response time p50/p95/p99
→ CPU and memory per container
→ RabbitMQ queue depth
→ Database connection pool usage
→ Redis memory usage

**AI-specific metrics (OpenTelemetry — new):**
→ Classification accuracy over time
→ Average LLM response time
→ Cost per classification ($)
→ RAG retrieval confidence scores
→ Agent tool call counts and latency
→ False positive/negative rates
→ Incidents created per hour
→ Mean time to classify (MTTC)

**Grafana dashboards:**
→ Platform health overview
→ AI performance dashboard (new)
→ Per-service health
→ Cost tracking dashboard (new)
→ Incident creation rate

**Tests added this phase:**

Unit tests (10):
→ test_metrics_endpoint_exists() (all 7 services)
→ test_prometheus_format_valid()
→ test_classification_counter_increments()
→ test_cost_tracking_per_call()
→ test_otel_span_created_for_classification()
→ test_otel_span_attributes_correct()
→ test_grafana_datasource_connected()
→ test_prometheus_scrape_successful()
→ test_ai_metrics_recorded()
→ test_cost_alert_threshold()

Integration tests (5):
→ Prometheus scrapes all /metrics endpoints
→ Grafana queries Prometheus data
→ OpenTelemetry spans recorded for agent
→ Cost tracking accumulates correctly
→ Alert fires when threshold crossed

**Deliverables:**
- `monitoring/prometheus.yml`
- `monitoring/grafana/dashboards/`
- `/metrics` endpoint on all services
- Docker Compose monitoring profile
- OpenTelemetry instrumentation in AI Service

---

### Phase 14.5 — Knowledge Base + RAG
**Goal:** AI retrieves similar past incidents for better analysis
**Timeline:** 2 sessions

**Knowledge base bootstrap sources:**
```
1. Our 22 sessions of bug fixes → 20-30 runbooks
   (ON CONFLICT fix, JWT secret mismatch, etc.)
2. Google SRE Book patterns → 50 runbooks
3. Public postmortems (Cloudflare, GitHub) → 30 runbooks
4. LogHub public dataset → 100 example incidents
Total bootstrap: ~200 entries
```

**RAG implementation:**
```
Storage: ChromaDB (file-based, no new infra)
Retrieval: Hybrid (BM25 + embeddings)
→ BM25 handles exact keywords (service names, error codes)
→ Embeddings handle semantic similarity
→ Combined score = final ranking
```

**Confidence-based gap handling:**
```
Retrieval confidence > 0.75:
→ RAG assisted analysis
→ "Found 3 similar past incidents"

Confidence 0.40-0.75:
→ RAG + web search (Brave/Tavily API)
→ "Partial match + web augmentation"

Confidence < 0.40:
→ Web search + first principles
→ Escalate to human (treat as SEV1)
→ "New error pattern — human review required"
```

**Knowledge base growth:**
```
Phase 1 (bootstrap): ~200 entries
Phase 2 (organic): +10-20 entries/month from resolved incidents
Phase 3 (community): anonymized cross-org sharing
```

**Auto-KB entry on resolution:**
```
Incident resolved → "Add to knowledge base?" prompt
Engineer confirms + adds notes
ChromaDB updated
Next similar incident finds it
```

**RAG eval suite (CI gate):**
```
20 golden incidents with known correct root causes
Run on every AI Service deploy
Block if accuracy < 70%
Report per-category accuracy
```

**Tests added this phase:**

Unit tests (15):
→ test_chunk_document_correct_size()
→ test_embed_document_correct_dimensions()
→ test_bm25_keyword_search()
→ test_semantic_search_returns_relevant()
→ test_hybrid_retrieval_combines_scores()
→ test_confidence_threshold_rag_assisted()
→ test_confidence_threshold_hybrid()
→ test_confidence_threshold_escalate()
→ test_kb_entry_creation_from_incident()
→ test_kb_entry_searchable_after_creation()
→ test_web_search_called_on_low_confidence()
→ test_no_hallucinated_context_injected()
→ test_rag_improves_analysis_quality()
→ test_duplicate_kb_entry_not_created()
→ test_kb_grows_after_resolution()

Integration tests (10):
→ Add runbook → search for it → found
→ Unknown error → web search triggered
→ Known error → RAG finds similar incident
→ RAG context improves Claude analysis
→ Low confidence → human escalation triggered
→ Resolved incident → KB entry created
→ Next similar incident → KB entry retrieved
→ Hybrid retrieval beats pure semantic on keywords
→ ChromaDB persists across restarts
→ RAG eval golden dataset → accuracy >= 70%

RAG eval suite (20 golden tests):
→ 20 incidents with known correct root causes
→ Scored automatically
→ Block CI if accuracy < 70%

---

### Phase 14.6 — Triage Agent + LangGraph
**Goal:** Agent reasons with tools before deciding on severity
**Timeline:** 2 sessions

**Agent tools:**
```
get_recent_logs(service, minutes)
→ Fetch recent logs for context

get_error_rate(service, minutes)
→ Current error rate from Redis

get_similar_incidents(description)
→ RAG search for past incidents

get_service_health(service)
→ Is service responding?

get_recent_deployments(service)
→ Was there a recent deploy? (common cause)

web_search(query)
→ Search for error online (Brave/Tavily API)
```

**Agent loop (LangGraph):**
```
State: {incident, context, tools_called, verdict}

Step 1 — gather_context:
→ get_recent_logs() → what happened?
→ get_error_rate() → how bad is it?

Step 2 — search_knowledge:
→ get_similar_incidents() → past incidents?

Step 3 — check_deployment:
→ get_recent_deployments() → recent deploy?
→ Most common cause of incidents

Step 4 — reason_and_verdict:
→ Claude reasons with all context
→ Structured verdict:
{
    likely_cause: string,
    confidence: float,
    sev_level: SEV1-SEV4,
    suggested_actions: string[],
    similar_past_incident: string | null,
    resolution_from_kb: string | null
}

Step 5 — verification_gate:
→ Second Claude call reviews reasoning
→ "Was this grounded in tools called?"
→ "Did agent hallucinate any facts?"
→ If verification fails → lower confidence
→ Flag for human review
```

**Confidence-based routing:**
```
confidence > 0.85 → auto-create incident, AI handles
confidence 0.60-0.85 → create incident, flag for review
confidence 0.40-0.60 → create incident, requires human triage
confidence < 0.40 → page on-call immediately
```

**Tests added this phase:**

Unit tests (15):
→ test_tool_get_recent_logs()
→ test_tool_get_error_rate()
→ test_tool_get_similar_incidents()
→ test_tool_get_service_health()
→ test_tool_get_recent_deployments()
→ test_tool_web_search()
→ test_agent_calls_tools_in_correct_order()
→ test_verification_gate_passes_grounded()
→ test_verification_gate_fails_hallucination()
→ test_low_confidence_escalation()
→ test_high_confidence_auto_incident()
→ test_agent_handles_tool_failure_gracefully()
→ test_structured_verdict_schema()
→ test_suggested_actions_not_empty()
→ test_langgraph_state_transitions()

Integration tests (10):
→ Real incident → agent runs all tools → verdict produced
→ Unknown incident → web search called
→ Known incident → RAG retrieves past incident
→ Recent deployment → agent identifies as likely cause
→ Verification gate catches hallucination
→ Low confidence → human escalation triggered
→ High confidence → incident auto-created with verdict
→ Agent traces recorded in OpenTelemetry
→ Tool failures don't crash agent
→ Verdict stored in incident analysis

---

### Phase 14.7 — MCP Server + Mobile Alerts
**Goal:** Claude Desktop can query platform; engineers alerted on mobile
**Timeline:** 1.5 sessions

**MCP Server tools:**
```
Read-only (no auth required):
→ get_incident(id)
→ list_open_incidents(org_id, severity?)
→ get_service_logs(service, timeframe)
→ get_ai_analysis(incident_id)
→ search_knowledge_base(query)

Mutating (API key required):
→ create_incident(title, severity, service)
→ update_incident_status(id, status)
→ acknowledge_incident(id)
```

**MCP governance:**
```
→ Read-only tools: accessible without auth
→ Mutating tools: require API key
→ Mutating tools show confirmation before executing
→ All tool calls logged for audit
→ Rate limiting per API key
```

**Demo moment:**
```
Open Claude Desktop
Type: "Show me all open SEV1 incidents"
→ Claude calls list_open_incidents MCP tool
→ Returns real data from your platform
→ Live, interactive, genuinely impressive
```

**Mobile alerts:**
```
SEV1 (CRITICAL):
→ Twilio SMS (immediate, bypasses silent mode)
→ PagerDuty phone call
→ Slack #incidents
→ Email

SEV2 (HIGH):
→ Slack #incidents
→ Email
→ Push notification (FCM)

SEV3 (MEDIUM):
→ Slack #incidents-low-priority

SEV4 (LOW):
→ Dashboard only
```

**Escalation policy:**
```
SEV1 fires:
→ T+0min: SMS + Slack + email to on-call
→ T+5min: No acknowledgement → SMS next engineer
→ T+15min: Still no response → SMS manager
→ T+30min: Full team bridge opened

Acknowledgement from mobile:
→ Reply to SMS with "ACK"
→ Tap notification → opens dashboard
→ /incident ack {id} in Slack
```

**Alert fatigue prevention:**
```
→ Deduplication: same error within 5 min = one incident
→ Flapping detection: alert/resolve/alert cycle suppressed
→ Suppression windows: "quiet hours 2am-6am" (SEV2/3 only)
→ Max 3 pages per hour per service (SEV2)
→ SEV1 always pages regardless of suppression
```

**Tests added this phase:**

MCP Server unit tests (10):
→ test_get_incident_returns_correct_data()
→ test_get_incident_not_found_404()
→ test_list_open_incidents_filters_correctly()
→ test_create_incident_requires_auth()
→ test_read_only_tools_no_auth_needed()
→ test_mutating_tools_require_api_key()
→ test_tool_calls_logged_for_audit()
→ test_rate_limiting_per_api_key()
→ test_unknown_tool_rejected()
→ test_mcp_server_lists_all_tools()

MCP Server integration tests (5):
→ MCP server starts and tools discoverable
→ Claude Desktop connects successfully
→ get_incident returns real database data
→ create_incident creates real incident
→ Auth enforced on mutating tools

Mobile alerts unit tests (10):
→ test_sev1_triggers_sms()
→ test_sev1_triggers_pagerduty()
→ test_sev2_no_sms_no_pagerduty()
→ test_sev3_slack_only()
→ test_sev4_no_notification()
→ test_escalation_scheduled_on_sev1()
→ test_escalation_cancelled_on_acknowledge()
→ test_deduplication_same_error_one_incident()
→ test_flapping_detection_suppresses()
→ test_quiet_hours_suppress_sev2()

Mobile alerts integration tests (5):
→ SEV1 incident → Twilio SMS received
→ SEV2 incident → Slack + email only
→ Acknowledged → escalation timer cancelled
→ Unacknowledged 5 min → next engineer notified
→ Deduplication prevents duplicate incidents

---

### Phase 15 — AWS Deployment
**Goal:** Production deployment on AWS
**Timeline:** 4 sessions

**AWS Services:**
```
ECR — container registry (store Docker images)
ECS Fargate — run containers without managing servers
RDS t3.micro — managed PostgreSQL (free tier)
MongoDB Atlas — managed MongoDB (free tier)
ElastiCache t3.micro — managed Redis
ALB — Application Load Balancer (single entry point)
Route53 — DNS management
ACM — SSL certificates (free)
Secrets Manager — encrypted secrets storage
CloudWatch — logs + infrastructure alerts
```

**Infrastructure as Code (Terraform):**
```
terraform/
  environments/
    staging/
    production/
  modules/
    ecs/
    rds/
    redis/
    alb/
    ecr/
    monitoring/
```

**Environments:**
```
staging.incidentai.com  → auto-deploy on merge to main
app.incidentai.com      → manual approval required
```

**Cost estimate:**
```
Demo mode (~10 hours/month): ~$30-50/month
24/7 production:             ~$130-200/month
```

**Smoke tests (run after every deployment):**
```
→ GET /health → 200 on all 7 services
→ POST /api/auth/signup → works
→ POST /api/logs/ingest → works
→ GET /api/incidents → works with JWT
→ LLM classification working
→ RabbitMQ queues healthy
→ All consumers connected
→ SSL certificate valid
→ DNS resolving correctly
```

**Load tests (before launch):**
```
Tools: k6 or Locust
→ 100 concurrent log ingestion requests
→ 50 concurrent dashboard users
→ 10 concurrent AI classifications
→ Verify no memory leaks under load
→ Verify rate limiting works under load
```

**Tests added this phase:**
→ 15 smoke tests (post-deployment verification)
→ 10 load tests (pre-launch stress testing)
→ 5 infrastructure tests (Terraform state verification)

**Deliverables:**
- `terraform/` with all AWS resources
- `terraform/environments/staging/`
- `terraform/environments/production/`
- `docs/DEPLOYMENT.md` runbook
- `scripts/smoke-test.sh`

---

## Pre-Launch Checklist

### Security (must complete before going public)
```
□ Redis-backed rate limiting in API Gateway
□ Signup rate limit per IP (max 5/hour)
□ LLM cost cap per org per day (max 100 calls)
□ Global daily LLM budget alert ($10/day warning)
□ Secrets audit — no keys in error messages
□ No JWT secrets in client-side code
□ HTTPS everywhere (ACM + ALB)
□ CORS properly configured
□ Input validation on all endpoints
□ SQL injection prevention (parameterized queries ✓)
```

### Demo experience
```
□ Demo account: demo@incidentai.com / Demo123!
□ Clean seed data (10-15 realistic incidents)
□ Nightly reset script for demo data
□ Guided walkthrough tooltip on first login
□ Loading states on all pages
□ Friendly error messages (no stack traces)
□ Mobile responsive
□ Page load < 3 seconds
□ Tested from incognito window
□ Tested on mobile device
□ Tested on slow 3G connection
```

### Monitoring
```
□ UptimeRobot configured (free tier)
□ AWS billing alert ($50/month threshold)
□ Anthropic cost alert configured
□ Error alerting to Slack
□ CloudWatch alarms on ECS failures
```

### Content
```
□ README.md polished with architecture diagram
□ Demo video recorded (2-3 minutes)
□ GIF of key feature (incident + AI analysis)
□ Domain purchased (incidentai.com)
□ SSL certificate active
□ LinkedIn post drafted
```

---

## Self-Monitoring Strategy (Dogfooding)

```
Instead of fake log generators:
Instrument our OWN 7 services

Auth Service real logs:
→ Failed login attempts
→ JWT verification failures
→ Rate limit hits
→ DB connection issues

API Gateway real logs:
→ Upstream service timeouts
→ Rate limit triggers
→ Invalid route requests

Incident Service real logs:
→ RabbitMQ reconnections
→ Slow database queries
→ Duplicate incident detection

These are REAL logs from REAL operations.
Platform monitors itself (dogfooding).
Supplement with LogHub public dataset for variety.
```

---

## Test Count Projection

```
Current (Phase 12 complete):     255 tests

Phase 13 (CI/CD):                +5
Phase 13.5 (LLM classification): +23
Phase 13.6 (rate detection):     +15
Phase 14 (monitoring):           +15
Phase 14.5 (RAG):                +45
Phase 14.6 (triage agent):       +25
Phase 14.7 (MCP + mobile):       +30
Phase 15 (deployment):           +30
─────────────────────────────────────
Total projected:                 ~443 tests
```

---

## Post-Phase-15 Roadmap

### Product Features

#### Organization Registration
```
Priority: HIGH
Timeline: 2 weeks after Phase 15

→ Company signs up → unique org ID (org_abc123)
→ Gets API key for SDK integration
→ Billing plan selection
→ Team member invitations
→ Organization settings page
```

#### API Key Management
```
Priority: HIGH
Timeline: alongside org registration

→ Generate multiple API keys per org
→ Key rotation (invalidate old, issue new)
→ Key scoping (read-only, write-only, admin)
→ Usage tracking per key
→ Keys stored hashed in database
```

#### On-Call Rotation
```
Priority: HIGH
Timeline: 1 month after Phase 15

→ Define weekly on-call schedules
→ Auto-assign incidents to on-call engineer
→ Escalation: 5 min → next engineer
→ Escalation: 15 min → manager
→ PagerDuty integration
→ Handoff notes between engineers
```

#### Custom Alert Rules
```
Priority: MEDIUM
Timeline: 1 month after Phase 15

→ "Alert if error rate > 5% for 5 minutes"
→ "Alert if response time > 2 seconds"
→ "Suppress alerts between 2am-6am"
→ Per-service thresholds
→ Alert routing to specific teams
→ Max N pages per hour per service
```

#### Severity-Based Notification Routing
```
Priority: HIGH
Timeline: Phase 14.7 (before Phase 15)

SEV1 (CRITICAL):
→ PagerDuty phone call + SMS + Slack + email
→ Escalates if unacknowledged after 5 minutes

SEV2 (HIGH):
→ Slack + email + push notification

SEV3 (MEDIUM):
→ Slack only

SEV4 (LOW):
→ Dashboard only

Respects on-call engineer sleep.
Industry standard behavior.
Required for enterprise customers.
```

#### Service Ownership Routing
```
Priority: MEDIUM
Timeline: 2 months after Phase 15

→ payment-service → payments team
→ user-service → auth team
→ Incidents auto-routed to correct team
→ Reduces alert noise
→ Per-service on-call schedules
```

#### Real-time WebSockets
```
Priority: HIGH
Timeline: 2 months after Phase 15

→ Dashboard updates in real time
→ New incident appears instantly
→ No page refresh needed
→ Socket.io or native WebSockets
→ Like Slack messages appearing in real time
```

#### Stripe Billing
```
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
```

#### Webhook Support
```
Priority: HIGH
Timeline: 1 month after Phase 15

→ POST to any URL on incident creation
→ Integrate with any tool
→ Custom automations
→ Zapier/Make.com compatible
```

---

### SDKs

#### Python SDK
```
Priority: HIGH
Timeline: 1 month after Phase 15

pip install incidentai

from incidentai import IncidentAI
monitor = IncidentAI(api_key='pk_live_xxx', service='payment-service')
monitor.critical('Database down', {'error': str(e)})

Published to: PyPI
```

#### Java SDK
```
Priority: HIGH
Timeline: 1 month after Phase 15

<dependency>
    <groupId>com.incidentai</groupId>
    <artifactId>incidentai-sdk</artifactId>
    <version>1.0.0</version>
</dependency>

Published to: Maven Central
```

#### Go SDK
```
Priority: MEDIUM
Timeline: 2 months after Phase 15

go get github.com/incidentai/sdk-go

Published to: pkg.go.dev
```

#### .NET SDK
```
Priority: LOW
Timeline: 3 months after Phase 15

Install-Package IncidentAI

Published to: NuGet
```

#### Docker Sidecar Agent
```
Priority: MEDIUM
Timeline: 3 months after Phase 15

Zero code changes needed.
Deploy alongside any container.
Monitors: CPU, memory, disk, process health.
Like Datadog Agent.
```

---

### Infrastructure Improvements

#### Kubernetes
```
Priority: MEDIUM
Timeline: 3 months after Phase 15

→ Auto-scaling based on load
→ Self-healing containers
→ Rolling deployments (zero downtime)
→ Horizontal pod autoscaling
→ Migrate from ECS to EKS
```

#### OpenSearch Integration
```
Priority: MEDIUM
Timeline: 2 months after Phase 15

→ Full-text search across all logs
→ "Find logs containing timeout last 24 hours"
→ Faster than MongoDB text search at scale
→ AWS OpenSearch Service
```

#### pgvector Similarity Search
```
Priority: LOW
Timeline: 4 months after Phase 15

→ Find similar incidents using AI embeddings
→ "Show incidents similar to this one"
→ Prevents duplicate incident investigation
→ PostgreSQL pgvector extension
```

#### Dead Letter Queues
```
Priority: MEDIUM
Timeline: 1 month after Phase 15

→ Failed RabbitMQ messages → DLQ
→ Retry failed messages
→ Alert on DLQ depth
→ Message replay capability
```

---

### Security & Compliance

#### RBAC (Role-Based Access Control)
```
Priority: HIGH
Timeline: 2 months after Phase 15

Roles:
→ ADMIN: full access
→ DEVELOPER: create/view incidents
→ VIEWER: read only
→ Per-service permissions

Currently: all users are DEVELOPER
```

#### SSO (Single Sign-On)
```
Priority: MEDIUM
Timeline: 3 months after Phase 15

→ Login with company Google/Microsoft/Okta
→ SAML 2.0 integration
→ No separate password needed
→ Enterprise requirement
```

#### SOC2 Compliance
```
Priority: LOW (required for enterprise)
Timeline: 6 months after Phase 15

→ Security audit trail
→ Access controls documentation
→ Encryption at rest and in transit
→ Annual security audit
→ Required for Fortune 500 customers
```

#### Audit Logs
```
Priority: MEDIUM
Timeline: 2 months after Phase 15

→ "Who changed this incident status?"
→ "Who deleted this log?"
→ Immutable audit trail
→ Required for SOC2
```

---

### AI Improvements

#### Anomaly Detection
```
Priority: HIGH
Timeline: 2 months after Phase 15

→ "Error rate is 3x higher than usual"
→ Detects problems before CRITICAL label needed
→ Proactive alerting
→ ML-based baseline learning per service
```

#### Historical Pattern Matching
```
Priority: MEDIUM
Timeline: 3 months after Phase 15

→ "Last time this happened, the fix was X"
→ Reduces MTTR (Mean Time To Resolve)
→ Powered by growing knowledge base
```

#### Incident Prediction
```
Priority: LOW
Timeline: 4 months after Phase 15

→ "Memory trend → service crashes in 2 hours"
→ Prevent incidents before they happen
→ Proactive vs reactive monitoring
```

#### Auto-remediation
```
Priority: LOW
Timeline: 6 months after Phase 15

→ AI suggests fix → engineer approves
→ "Restart the service"
→ "Scale up instances"
→ "Roll back last deployment"
→ Runbook automation
```

---

### Developer Experience

#### CLI Tool
```
Priority: MEDIUM
Timeline: 3 months after Phase 15

incidentai logs --service payment-service --level CRITICAL
incidentai incidents list --status OPEN
incidentai incidents resolve abc-123
incidentai deploy --service payment-service
```

#### VS Code Extension
```
Priority: LOW
Timeline: 4 months after Phase 15

→ See incidents related to code you are editing
→ One-click to view logs from your service
→ AI analysis directly in editor
```

#### Slack App
```
Priority: MEDIUM
Timeline: 2 months after Phase 15

/incident list
/incident resolve abc-123
/incident assign abc-123 @preetham
Acknowledge incidents from Slack
```

---

### Mobile App
```
Priority: LOW
Timeline: 6 months after Phase 15

Platforms: iOS + Android (React Native)

Features:
→ Push notifications for CRITICAL incidents
→ Acknowledge incidents from phone
→ View incident details
→ On-call engineer response
→ View AI analysis
```

---

## 6-Month Startup Goal Checklist

```
Month 1-2 (Phases 13-15):
□ CI/CD pipeline with AI eval gate
□ LLM classification (real AI detection)
□ Rate-based detection (Redis)
□ Monitoring (Grafana + Prometheus + AI tracing)
□ Knowledge base + RAG
□ Triage agent (LangGraph)
□ MCP server (Claude Desktop integration)
□ Mobile alerts (Twilio SMS)
□ AWS deployment
□ incidentai.com live

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
□ Service ownership routing

Month 5:
□ OpenSearch full-text search
□ Anomaly detection
□ RBAC improvements
□ Audit logs
□ Dead letter queues

Month 6:
□ Mobile app (MVP)
□ SOC2 compliance start
□ Kubernetes migration
□ Auto-remediation (basic)
□ .NET + Go SDKs

Milestones:
→ Ship to first 10 customers by month 3
→ 100 customers by month 6
→ $10k MRR target by month 6
```

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
| ADR-009 | LLM classification over keyword matching |
| ADR-010 | Hybrid RAG retrieval (BM25 + embeddings) |
| ADR-011 | LangGraph for triage agent state management |
| ADR-012 | MCP server for external AI tool integration |
| ADR-013 | Twilio SMS for SEV1 mobile alerts |
| ADR-014 | ECS Fargate over EC2 for container management |
| ADR-015 | MongoDB Atlas over DocumentDB (cost) |
```

---

