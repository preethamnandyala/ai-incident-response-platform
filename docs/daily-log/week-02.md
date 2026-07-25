# Week 02 — Daily Log

---

# Day 8 — 5 June 2026

## Goal
Complete Phase 1c — OAuth2 Google login. Build OAuthService,
Passport.js configuration, OAuthController, routes, and verify
end-to-end flow with real Google credentials.

## Work Completed
- Created ADR-005 documenting OAuth2 duplicate email handling decision
- Added googleId and emailVerified fields to UserRecord interface
- Added findByGoogleId, linkGoogleAccount, createGoogleUser,
  saveEmailVerificationOTP, findEmailVerificationOTP,
  markEmailVerificationOTPUsed, markEmailVerified repository methods
- Updated findByEmail and findById SELECT queries to include
  new fields with correct column aliasing
- Created shared test fixtures file (tests/fixtures.ts) with
  mockUserRecord, mockUnverifiedUser, mockGoogleUser
- Updated all 4 service test files to use shared fixtures —
  applying DRY principle to test data
- Updated jest.config.js to exclude repositories and routes
  from coverage collection
- Built OAuthService with handleGoogleCallback — 4 scenarios:
  create new user, issue JWT to existing Google user, link Google
  to verified email account, reject unverified email account
- Installed passport and passport-google-oauth20
- Built Passport.js configuration in src/config/passport.ts —
  registered GoogleStrategy with verify callback
- Built OAuthController with googleCallback — sets refreshToken
  as HTTP-only cookie, redirects browser to frontend with
  accessToken in URL query parameter
- Built oauth.routes.ts — /google initiates flow, /google/callback
  handles Google's redirect with Passport middleware
- Registered passport.initialize() and oauthRoutes in app.ts
- Registered real Google credentials in .env
- Verified complete OAuth flow end-to-end in real browser:
  browser → Google login → callback → OAuthService → database
  (database fails as expected, failureRedirect to frontend works)
- Fixed failureRedirect to use frontend URL not server URL
- Fixed verify callback to use done(null, false) instead of
  done(error) so failureRedirect triggers correctly
- 96 tests passing, 11 test suites, 100% coverage

## What I Learned

### OAuth2 complete flow file by file
server.ts receives request → app.ts runs middleware chain →
passport.initialize() attaches passport context to req →
oauth.routes.ts matches route → passport.authenticate() builds
Google URL and redirects browser → browser navigates to Google →
user logs in → Google redirects to callback with code= →
passport.authenticate() exchanges code with Google server-to-server →
Google returns profile → passport.ts verify function called →
oauth.service.ts handleGoogleCallback runs decision tree →
user.repository.ts queries database → LoginResult returned →
done(null, result) attaches result to req.user → next() called →
oauth.controller.ts sets HTTP-only cookie, redirects to frontend →
frontend reads accessToken from URL query parameter

### Why passport.initialize() runs on every request
app.use() without a path applies middleware to every request.
passport.initialize() attaches a small internal context object
to req that Passport needs when it runs later on specific routes.
It is lightweight — no expensive work, just object attachment.
Without it, passport.authenticate() on any route would crash.

### Why OAuth uses res.redirect() not res.json()
Normal API calls: frontend makes fetch() → server returns JSON
OAuth callback: browser is NAVIGATING between servers, not calling
fetch(). The browser follows redirects automatically. You cannot
return JSON to a navigating browser — it would just display the
JSON text. Instead, res.redirect() sends the browser to the
frontend URL with the accessToken in the URL query parameter.

### How to get Google OAuth credentials
Register app at console.cloud.google.com → create project →
OAuth consent screen → Credentials → OAuth 2.0 Client ID →
Web application → add authorized redirect URIs →
receive CLIENT_ID and CLIENT_SECRET.
CLIENT_ID is public (safe in frontend).
CLIENT_SECRET is private (server only, never committed).

### done(null, false) vs done(error) in Passport verify callback
done(error) → passes error to Express error handler → returns JSON
done(null, false) → signals auth failure to Passport →
                    triggers failureRedirect correctly
Always use done(null, false) for expected auth failures inside
the verify callback so Passport handles the redirect properly.

### Shared test fixtures — DRY applied to test data
Before: every service test file defined its own inline user objects
        adding a field to UserRecord required updating many files
After: one fixtures.ts file exports mockUserRecord, mockUnverifiedUser,
       mockGoogleUser — all tests import from there
       Adding a new field = update fixtures.ts once, done everywhere

### OAuth duplicate email — safe linking requires email verification
Auto-linking a Google account to an existing email is only safe if
emailVerified = true. Without verification, an attacker who creates
a Google account with someone else's email could link it to their
platform account without knowing their password. This is the core
security reasoning behind ADR-005.

### Federated identity risk — inherited attack surface
Delegating auth to Google means inheriting Google's attack surface.
If a user's Gmail is compromised, their platform account is too.
Mitigations: login notifications, OAuth revocation, 2FA for
sensitive actions. Documented in ADR-005 as known tradeoff.

## Problems Faced
- OAuth callback returned JSON instead of redirecting — caused by
  done(error) routing to Express error handler instead of
  Passport's failureRedirect
- failureRedirect pointed to server URL not frontend URL

## How I Solved Them
- Changed verify callback catch block from done(error as Error)
  to done(null, false, { message: 'Authentication failed' })
- Updated failureRedirect to use env.frontendUrl prefix

## Security Rules Learned
- OAuth CLIENT_SECRET lives in .env only, never in frontend code,
  never committed to GitHub
- State parameter prevents OAuth CSRF — Passport handles this
  automatically, do not bypass it
- Tokens should not stay in URL history — frontend must remove
  accessToken from URL after reading it (history.replaceState)
- done(null, false) for auth failures inside verify callbacks,
  not done(error), so Passport handles redirects correctly

## Test Coverage

96 tests passing

11 test suites

100% statements, branches, functions, lines

## Commands Used
```bash
npm install passport passport-google-oauth20
npm install --save-dev @types/passport @types/passport-google-oauth20
npm test
npm run dev
git add .
git commit -m "feat(auth): add OAuthService, shared test fixtures, fix UserRecord schema"
git commit -m "feat(auth): add Passport.js OAuth2 config, OAuthController, routes"
git commit -m "feat(auth): complete Phase 1c OAuth2 — verified end-to-end flow"
git commit -m "fix(auth): use done(null,false) for OAuth errors, fix failureRedirect URL"
git push origin feature/auth-oauth2
```

## Git Branch
feature/auth-oauth2

## Next Step
Phase 2 — API Gateway (Express).
The API Gateway is the single entry point for ALL requests
from the frontend and demo apps. It routes requests to the
correct backend service, verifies JWT tokens, applies rate
limiting, and logs every request. This is the layer that
connects the frontend to all the microservices we will build.


---

# Day 9 — 6 June 2026

## Goal
Build Phase 2 — API Gateway. Single entry point for all requests
with JWT verification, rate limiting, request logging, and proxy
routing to all downstream services.

## Work Completed
- Created api-gateway-express service from scratch
- Installed and configured Express, helmet, cors, morgan,
  http-proxy-middleware, express-rate-limit, cookie-parser
- Resolved multiple ESM vs CommonJS conflicts:
  downgraded http-proxy-middleware to 2.0.6
  replaced uuid with Node built-in crypto.randomUUID()
  downgraded TypeScript to 6.0.3 to match auth service
  downgraded @types/express to 4.17.21
- Built env.ts with JWT secret and 5 downstream service URLs
- Built authenticateJWT middleware — verifies JWT and attaches
  userId and role to x-user-id and x-user-role request headers
  instead of req.user (because headers cross network boundaries,
  req.user does not)
- Built requestId middleware — generates UUID per request,
  attaches to request and response headers for distributed tracing
- Built Morgan logger middleware — logs method, URL, status,
  response time, request ID on every request
- Built rateLimiter middleware — 100 requests per minute per IP
  using express-rate-limit
- Built app.ts wiring all middleware and proxy routes
- Auth routes proxied without JWT (public)
- Incident, Log, AI, Notify routes proxied WITH JWT verification
- 502 error handlers for when downstream services are unavailable
- Built server.ts — starts on port 3000, logs all routing on startup
- Fixed tsconfig to include tests/ and add jest/node types
- Wrote 12 tests across 3 test files — auth middleware, logger
  middleware, rate limiter middleware
- Verified end-to-end: signup validation error proxied correctly
  from Auth Service through Gateway. Protected route blocked at
  Gateway with 401 in 1.874ms (never reached Incident Service)
- Created ADR-006 documenting secrets management strategy —
  .env for local development, AWS Secrets Manager for production,
  centralized in env.ts for easy migration

## What I Learned

### Why API Gateway exists — 6 problems it solves
Without a gateway the frontend must know every service address,
JWT verification is duplicated across all services, CORS must
be configured on every service, rate limiting must be implemented
everywhere, there is no single place for request logging, and
adding a new service requires frontend changes. The gateway
solves all six in one place.

### Why headers not req.user in the gateway
req.user is a JavaScript object in memory — it only exists
within a single Node.js process. When the gateway proxies a
request to the Incident Service, the request crosses a network
boundary to a completely different process. Only HTTP headers
travel across the network. So the gateway attaches userId and
role to x-user-id and x-user-role headers which downstream
services read directly.

### Request IDs for distributed tracing
Every request gets a unique UUID (crypto.randomUUID()) attached
as x-request-id header on both the request and response. This
ID is forwarded to every downstream service and appears in every
log line. When debugging a failure, you search all logs for
the request ID and see the complete journey across every service
that touched that request.

### Why Auth Service shows no HTTP request logs
Auth Service has no Morgan middleware — intentionally. The gateway
is the single point of HTTP observability. Downstream services
only receive traffic from the gateway (internal network), so
logging at the gateway level captures all external traffic.
Each service logs business events (OTP generated, user created)
separately. These are different concerns: HTTP traffic vs
business logic events.

### 502 Bad Gateway vs 500 Internal Server Error
502 means "I am a proxy and the upstream server I tried to reach
was unavailable or returned an invalid response." 500 means
"something went wrong inside THIS service." When a downstream
service is down, the gateway correctly returns 502, not 500.
This tells the client exactly what happened: the gateway itself
is fine, a specific upstream service is unavailable.

### ESM vs CommonJS conflicts
Modern npm packages are shipping as ES Modules (ESM) only, but
our project uses CommonJS (ts-node compiles to require()).
Solution: pin packages to older versions that still support
CommonJS (http-proxy-middleware@2.0.6), or use Node built-ins
that are already available globally (crypto.randomUUID() instead
of uuid package). These conflicts will become less common as
the ecosystem migrates, but require awareness now.

### crypto.randomUUID() — built into Node 18+
No package needed. Available as a global in any Node.js 18+
environment. Generates a cryptographically secure UUID v4.
Replaces the uuid npm package entirely for simple use cases.

### Why gateway has no service, repository, or validator layer
The gateway has no business logic — it does not know what an
incident or a log or a user is. It never reads or writes a
database. It validates nothing (downstream services own their
validation). Its only jobs are verify → attach headers → forward
→ return response. Adding layers that do not exist yet is
over-engineering. The thinner the gateway, the better.

### AWS Secrets Manager vs .env files
.env files are correct for local development (never committed
to Git). In production, secrets are stored in AWS Secrets Manager
and fetched at startup via the AWS SDK. Centralizing config in
env.ts means switching secret sources is a one-file change per
service. IAM roles restrict which services can access which
secrets. Full audit trail of access. Automatic rotation available.

## Problems Faced
- ERR_REQUIRE_ESM from http-proxy-middleware (latest version ESM only)
- ERR_REQUIRE_ESM from uuid (version 10 ESM only)
- TypeScript peer dependency conflict (TypeScript 7 vs ts-jest needing <7)
- @types/express v5 conflict with http-proxy-middleware@2.0.6
- Custom keyGenerator IPv6 validation error from express-rate-limit
- @types/jest not in tsconfig types array causing describe/it/expect errors
- on: {} syntax removed in http-proxy-middleware 2.x

## How I Solved Them
- Pinned http-proxy-middleware to 2.0.6 (CommonJS compatible)
- Replaced uuid with crypto.randomUUID() (Node built-in, no package)
- Downgraded TypeScript to 6.0.3 to match auth service
- Downgraded @types/express to 4.17.21
- Removed custom keyGenerator — express-rate-limit handles IPv6 by default
- Added "types": ["jest", "node"] and "tests/**/*" to tsconfig
- Changed on: { error: ... } to onError: ... in proxy config

## Security Rules Learned
- JWT verification belongs at the gateway edge — downstream services
  trust what the gateway says, never re-verify independently
- Rate limiting at the gateway protects ALL services simultaneously —
  an attacker cannot bypass it by targeting services directly
  (services only accept internal traffic in production)
- x-user-id and x-user-role headers must NEVER come from the client
  directly — the gateway strips and rewrites them after JWT verification
  so downstream services can trust them completely

## Test Coverage

12 tests passing
3 test suites
Coverage thresholds met across all middleware files
app.ts excluded from coverage (proxy wiring, tested manually)

## Commands Used
```bash
mkdir api-gateway-express
cd api-gateway-express
npm init -y
npm install express cors helmet morgan http-proxy-middleware@2.0.6
npm install express-rate-limit jsonwebtoken dotenv cookie-parser
npm install --save-dev typescript@6.0.3 ts-node-dev @types/express@4.17.21
npm install --save-dev @types/cors @types/morgan @types/jsonwebtoken
npm install --save-dev @types/cookie-parser jest ts-jest @types/jest
npm test
npm run dev
git add .
git commit -m "feat(gateway): initialize API Gateway service with config, env, and JWT middleware"
git commit -m "feat(gateway): add rate limiter, logger, proxy middleware, app.ts, server.ts"
git commit -m "feat(gateway): add middleware tests, fix tsconfig, use crypto.randomUUID"
git commit -m "docs(decisions): add ADR-006 secrets management strategy"
git push origin feature/api-gateway
```

## Git Branch
feature/api-gateway

## Next Step
Phase 3 — Next.js Dashboard.
Build the frontend application: login page, signup page,
OAuth callback handler, dashboard overview, incidents list,
incident detail with AI analysis, log viewer, settings page.
Uses shadcn/ui components and Recharts for data visualization.
Calls our real Auth Service API through the API Gateway.


---

# Day 10 — 7 June 2026

## Goal
Build Phase 3 — Next.js Dashboard. Create the frontend
application with auth pages, dashboard layout, protected routes,
and API integration layer.

## Work Completed
- Created Next.js 16 app at apps/web-nextjs using App Router
- Removed empty admin-react folder, used existing web-nextjs folder
- Configured shadcn/ui with Nova preset and Base component library
- Installed shadcn components: button, input, label, card, form,
  sonner, badge
- Installed axios, zustand, react-hook-form, @hookform/resolvers,
  zod, lucide-react
- Resolved multiple dependency conflicts:
  downgraded TypeScript to match backend services
  fixed Node version warnings (harmless, not blocking)
- Built folder structure using Next.js App Router route groups:
  (auth)/ for auth pages — centered card layout, no sidebar
  (dashboard)/ for dashboard pages — sidebar + topbar layout
- Created src/lib/api.ts — Axios instance with:
  request interceptor (auto-attaches Bearer token)
  response interceptor (auto-refreshes token on 401,
  prevents infinite retry loop with _retry flag)
- Created src/store/auth.store.ts — Zustand store with:
  accessToken (null, stored in memory only)
  user object (id, name, email, role)
  isAuthenticated boolean
  setAccessToken, setUser, logout actions
- Created src/types/index.ts — User, AuthResponse, ApiError types
- Added getErrorMessage utility to src/lib/utils.ts
- Created .env.local with NEXT_PUBLIC_API_URL and
  NEXT_PUBLIC_GOOGLE_CLIENT_ID
- Changed Next.js dev port to 3006 (3000 taken by API Gateway)
- Updated Auth Service FRONTEND_URL to http://localhost:3006
- Built auth layout — centered card, gray background, max-w-md
- Built login page — email + password form, Google OAuth button,
  forgot password link, sign up link, IncidentAI logo
- Built signup page — name, email, password, confirm password,
  .refine() for password match validation, Google OAuth button
- Built forgot password page — email form, success state shows
  "check your email" message with link to reset page
- Built reset password page — email, OTP, new password,
  confirm password, same .refine() for password match
- Built OAuth callback page — reads accessToken from URL query
  param, calls /api/auth/me, stores user, redirects to dashboard
- Built dashboard layout — sidebar with logo, nav items,
  user info, logout button. Topbar with dynamic page title.
  Protected route logic redirects to /login if not authenticated
- Built dashboard page — 3 stat cards (placeholder), recent
  incidents placeholder
- Built incidents page — placeholder for Phase 4
- Built logs page — placeholder for Phase 5
- Verified all pages load correctly and navigation works
- Verified protected route redirects unauthenticated users to login
- Changed Next.js dev server to port 3006

## What I Learned

### Next.js App Router vs plain React
Plain React sends an empty HTML div — browser downloads JavaScript,
runs it, then builds the page (slow, bad for SEO). Next.js sends
fully built HTML from the server — users see content immediately.
File-based routing means creating a file IS the route — no router
configuration needed. Route groups with (parentheses) organize
files without affecting URLs.

### Route groups — (auth) and (dashboard)
Folders with parentheses in Next.js App Router are invisible to
the URL system. (auth)/login/page.tsx → /login, not /auth/login.
They exist only for code organization and to allow different
layouts — auth pages get centered card layout, dashboard pages
get sidebar + topbar layout. Without route groups, one root
layout would apply to everything.

### NEXT_PUBLIC_ prefix requirement
Next.js builds code for two environments: server (Node.js) and
browser. Without NEXT_PUBLIC_, all environment variables are
server-only and never included in browser JavaScript bundles —
protecting secrets like database passwords and JWT secrets from
being exposed in devtools. NEXT_PUBLIC_ is an explicit opt-in
saying "I know this value will be visible in the browser and
that is intentional." Only truly public values (API URL,
Google Client ID) get this prefix.

### Axios interceptors
Interceptors sit between your code and HTTP requests.
Request interceptor runs before every request — reads access
token from Zustand store and attaches Authorization header
automatically, so components never manually add auth headers.
Response interceptor runs after every response — catches 401
errors, automatically calls /api/auth/refresh (refresh token
sent as HTTP-only cookie automatically by browser), updates
the stored access token, retries the original request.
Without interceptors, every API call would need manual token
handling — dozens of repetitive lines.

### Why _retry flag prevents infinite loops
Without it: 401 → try refresh → refresh returns 401 →
interceptor catches that 401 → try refresh again → infinite loop.
With _retry = true: first 401 tries refresh. If refresh also
returns 401, the interceptor sees _retry is already true,
skips the refresh attempt, calls logout() and redirects to /login.
One attempt, clean exit.

### Zustand vs React Context vs Redux
React Context re-renders all consumers on any change, complex
with nested providers. Redux is powerful but massive boilerplate.
Zustand is 1kb, simple API, only re-renders components that use
changed values. Critical advantage: getState() and setState()
work outside React components — needed for Axios interceptors
which run outside any component tree.

### Why confirmPassword is not sent to the API
confirmPassword is a frontend-only UX concern — it exists to
catch typos before submission. The backend only needs the final
password. Sending confirmPassword would be unnecessary data the
backend ignores. The .refine() method on the Zod schema validates
that both fields match before the form can be submitted.

### Zod .refine() for cross-field validation
Individual field validators only see their own value. When you
need to compare two fields (password === confirmPassword), you
use .refine() on the entire schema object — it receives all form
data and can compare any fields. path: ['confirmPassword'] tells
Zod which field to attach the error to in the UI.

### Port conflict resolution
API Gateway runs on port 3000. Next.js defaults to 3000.
Solution: run Next.js on port 3006 (next dev -p 3006).
Auth Service FRONTEND_URL updated to localhost:3006 so OAuth
redirects land on the correct port. In production, no conflict
exists — each service runs on its own Cloud Run instance with
its own domain.

### Frontend testing deferred to Phase 11
Backend unit tests are high value without a database because
services have pure, testable business logic. Frontend E2E tests
(the most valuable kind — testing full user journeys) require
the entire stack running including the database. Phase 10
(Docker) connects everything. Phase 11 adds Playwright E2E
tests and component tests once the full stack is available.

## Problems Faced
- Stray ? character caused build error in dashboard layout
- Port conflict between Next.js (3000) and API Gateway (3000)
- Windows Git Bash cannot create files with parentheses in path
  without double-quoting the path
- Various Node version warnings from newer packages (harmless)

## How I Solved Them
- Deleted the stray ? character from layout.tsx
- Changed Next.js dev port to 3006, updated FRONTEND_URL in
  Auth Service .env
- Wrapped all paths containing parentheses in double quotes:
  touch "src/app/(auth)/login/page.tsx"
- Ignored Node version warnings — they are informational only

## Pages Built

/login           → email + password + Google OAuth
/signup          → registration with confirm password
/forgot-password → request OTP, success state
/reset-password  → OTP + new password
/auth/callback   → OAuth redirect handler
/dashboard       → stat cards placeholder
/incidents       → placeholder
/logs            → placeholder

## Next Step
Phase 4 — Incident Service (Spring Boot).
First backend service in a different language (Java).
Will build: create incident, list incidents, get incident,
update status, assign to user, incident timeline.
When complete, wire up the incidents page in the dashboard
with real data from this service.

---

# Day 11 — 8 June 2026

## Goal
Build Phase 4 — Incident Service using Spring Boot (Java).
First service in a different language. Introduce multi-tenancy
with organizationId across all domain entities.

## Work Completed
- Generated Spring Boot 3.5.0 project via Spring Initializr
  with dependencies: web, data-jpa, postgresql, lombok, validation
- Created folder structure:
  controller, service, repository, entity, dto, exception
- Configured application.properties for port 3002 and PostgreSQL
- Built Incident entity with:
  id (UUID auto-generated), title, description, severity (enum),
  status (enum), serviceName, assignedTo, createdBy,
  organizationId, createdAt, updatedAt
  Lombok @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor
- Built IncidentRepository extending JpaRepository with
  derived query methods:
  findByOrganizationIdOrderByCreatedAtDesc
  findByOrganizationIdAndStatus
  findByOrganizationIdAndSeverity
  findByOrganizationIdAndAssignedTo
  findByOrganizationIdAndServiceName
- Built DTOs: CreateIncidentRequest, UpdateStatusRequest,
  AssignIncidentRequest, IncidentResponse with static from() factory
- Built IncidentNotFoundException and GlobalExceptionHandler
  (@RestControllerAdvice) handling 404, 400, 500
- Built IncidentService with organization isolation check on
  every operation — throws IncidentNotFoundException (not 403)
  when organization does not match, preventing enumeration
- Built IncidentController reading x-user-id and
  x-organization-id from request headers (set by API Gateway)
- Added H2 in-memory database for tests
- Created application-test.properties with H2 config
- Wrote 24 tests:
  9 integration tests (@SpringBootTest + MockMvc)
  11 unit tests (@ExtendWith MockitoExtension)
  4 repository slice tests (@DataJpaTest)
  1 context load test
- Added organizationId to Auth Service UserRecord interface
- Updated findByEmail, findById SELECT queries to include
  organization_id column
- Updated create() and createGoogleUser() to set org_default
- Updated login() and handleGoogleCallback() to include
  organizationId in JWT payload
- Updated fixtures.ts with organizationId: 'org_default'
- Updated API Gateway auth middleware to forward
  x-organization-id header from decoded JWT
- Updated gateway tests to assert x-organization-id header
- Created ADR-007 documenting multi-tenancy strategy
- Auth service tests: 96 passing, 100% coverage
- Gateway tests: 12 passing, all green
- Incident service tests: 24 passing, BUILD SUCCESS
- Verified connection refused to PostgreSQL (expected,
  confirms wiring correct, Phase 10 adds database)

## What I Learned

### Java vs TypeScript — key differences
Java is strongly typed from the ground up — no TypeScript layer
needed on top. Annotations drive framework behavior instead of
manual wiring. @RestController, @Service, @Repository tell Spring
Boot what each class is. Spring automatically creates and injects
dependencies (same as our constructor injection, just automated).

### Lombok — eliminating Java boilerplate
Without Lombok, a Java class with 10 fields needs 50+ lines of
getters, setters, constructors, toString, equals, hashCode.
@Data generates all of these automatically. @Builder generates
the builder pattern. @RequiredArgsConstructor generates
constructor injection. Lombok is not magic — it generates real
Java code at compile time that you can inspect.

### JPA derived query methods
Spring Data JPA reads method names and generates SQL automatically.
findByOrganizationIdOrderByCreatedAtDesc →
SELECT * FROM incidents WHERE organization_id = ? ORDER BY created_at DESC
No SQL written manually for basic queries. Only write @Query for
complex operations JPA cannot infer from the method name.

### Optional and orElseThrow
Java's Optional<T> is equivalent to TypeScript's T | null.
findById() returns Optional<Incident> — might or might not exist.
.orElseThrow(() -> new IncidentNotFoundException(id)) means:
if present return the value, if empty throw this exception.
Cleaner than null checks everywhere.

### Java streams
.stream().map(IncidentResponse::from).collect(Collectors.toList())
is equivalent to JavaScript's .map(i => IncidentResponse.from(i))
:: is method reference syntax — shorthand for a lambda that
calls one method. Streams are lazy — they only process elements
when a terminal operation (collect) is called.

### Three test types in Spring Boot
Pure unit test (@ExtendWith MockitoExtension): no Spring context,
no database, all dependencies mocked, tests logic only, runs in
milliseconds. Slice test (@DataJpaTest): partial Spring context,
real H2 database, tests JPA queries generate correct SQL, catches
typos in derived query method names. Integration test
(@SpringBootTest): full Spring context, real H2, real MockMvc
HTTP requests, tests entire stack end to end.

### Why repository tests are NOT unit tests
A pure unit test has zero external dependencies. Repository slice
tests use a real H2 database — data actually inserts and queries.
They test that JPA method names generate correct SQL, which
service unit tests cannot catch because they mock the repository.

### Multi-tenancy design decision
organizationId added to every domain entity from Phase 4.
Extracted from JWT by API Gateway, forwarded as x-organization-id
header. Services never trust organizationId from request bodies —
only from gateway headers. Organization isolation enforced by
throwing IncidentNotFoundException (not 403) when org does not
match — same user enumeration prevention principle from auth.

### Why throw 404 not 403 for wrong organization
If we returned 403 Forbidden when an organization tries to access
another organization's incident, we would reveal that the incident
EXISTS but they cannot access it. Returning 404 reveals nothing —
the incident simply does not exist for this organization. Same
principle as our login error message ("Invalid email or password"
instead of "Email not found").

### H2 in-memory database
Behaves like PostgreSQL for testing — supports same SQL, same JPA.
Runs entirely in memory, no installation needed, destroyed after
tests. Configured via application-test.properties with
@ActiveProfiles("test"). Without it, tests would require a real
PostgreSQL running on every machine and CI/CD pipeline.

### Why we deviated from TDD and why it was wrong
Wrote production code before tests because Spring Boot's compile
and context-boot cycle makes TDD feel slower. This was the wrong
call — tests prove organization isolation works, @Valid fires
correctly, gateway headers are read properly. Without tests,
these are assumptions not facts. Correct approach: write tests
even for Spring Boot, use H2 to avoid database dependency,
use @DataJpaTest and @ExtendWith for fast feedback cycles.

### SDK vs Agent
SDK: installed inside your application code, you call it
explicitly (monitor.error('DB timeout')). Agent: runs as a
separate process alongside your application, collects metrics
automatically without code changes (CPU, memory, disk, crashes).
We build the SDK in Phase 7, basic agent in Phase 10 as a Docker
sidecar container. Together they make the platform usable by
any real application.

### This project as a real product
The platform is designed to serve any company, not just demo apps.
Multi-tenancy (organizationId on every entity) means Uber's
incidents never mix with Amazon's. The SDK (Phase 7) lets any
Node.js application send logs by installing @incidentai/sdk.
Same positioning as Grafana (open source Datadog alternative) or
Sentry (open source error tracking) — same category, self-hosted
open source model, different price point.

## Problems Faced
- Spring Boot 3.2.0 no longer supported by Spring Initializr
  (minimum is now 3.5.0)
- Tests failed with IllegalState/Failed to load ApplicationContext
  because IncidentServiceApplicationTests missing @ActiveProfiles
- Auth service tests failed after adding organizationId to
  UserRecord (TypeScript required the new field in all mock objects)
- Gateway middleware TypeScript error: organizationId not in
  decoded type

## How I Solved Them
- Changed bootVersion to 3.5.0 in Spring Initializr curl command
- Added @ActiveProfiles("test") to IncidentServiceApplicationTests
  so it uses H2 config instead of PostgreSQL
- Added organizationId: 'org_default' to mockUserRecord in
  fixtures.ts — all other mocks inherit it via spread operator
- Added organizationId?: string to the decoded type assertion
  in gateway auth middleware

## Test Results

Auth Service:     96 tests, 100% coverage
API Gateway:      12 tests, all passing
Incident Service: 24 tests, BUILD SUCCESS

9 integration tests
11 unit tests
4 repository slice tests
1 context load test

## Commands Used
```bash
curl https://start.spring.io/starter.zip -d bootVersion=3.5.0 ...
unzip incident-service.zip
./mvnw clean package -DskipTests
./mvnw test
./mvnw spring-boot:run
git add .
git commit -m "feat(incident): add Spring Boot Incident Service with multi-tenant isolation and integration tests"
git commit -m "test(incident): add unit tests for service layer and repository tests — 24 tests passing"
git commit -m "feat(auth): add organizationId to UserRecord, JWT payload, and fixtures"
git commit -m "feat(gateway): forward x-organization-id header for multi-tenancy"
git commit -m "docs(decisions): add ADR-007 multi-tenancy strategy"
git push origin feature/incident-service
```

## Git Branch
feature/incident-service

## Next Step
Phase 5 — Log Service (Django/Python).
Build log ingestion, MongoDB storage, OpenSearch indexing,
critical event detection, and RabbitMQ event publishing.
First Python service. First NoSQL database (MongoDB).


---

# Day 12 — 9 June 2026

## Goal
Complete Phase 5 — Log Service (Django/Python).
Also complete missing Incident Service timeline feature.
Ensure both services have full layered architecture and all APIs.

## Work Completed

### Log Service (Django)
- Created virtual environment and activated it
- Installed: django, djangorestframework, pymongo,
  django-environ, pytest, pytest-django
- Generated Django project with django-admin startproject
- Created logs app with python manage.py startapp logs
- Configured settings.py:
  removed admin app, added django.contrib.auth and contenttypes,
  configured SQLite for Django internals,
  configured MongoDB via MONGODB_URI and MONGODB_NAME,
  disabled DRF authentication (DEFAULT_AUTHENTICATION_CLASSES: []),
  set UNAUTHENTICATED_USER: None
- Created logs/mongodb.py — singleton MongoDB connection
  with lazy initialization (function not module-level variable)
- Created logs/repository.py — LogRepository with:
  insert_log, find_logs, find_by_id, insert_many_logs,
  get_distinct_services
- Created logs/service.py — LogService with:
  create_log, create_bulk_logs, get_logs, get_log_by_id,
  get_services, _handle_critical_log, _serialize_log
- Created logs/serializers.py:
  LogCreateSerializer, LogFilterSerializer, BulkLogCreateSerializer
- Created logs/views.py:
  LogListCreateView (POST + GET), LogBulkCreateView,
  LogDetailView, LogServicesView, LogSearchView, health_check
- Created logs/urls.py with all 7 routes
- Created log_service/urls.py root URL config
- Created .env with SECRET_KEY, MONGODB_URI, MONGODB_NAME, PORT
- Added venv/, __pycache__/, *.pyc, .env, db.sqlite3 to .gitignore
- Ran python manage.py migrate (creates SQLite tables for Django auth)
- Wrote 20 tests:
  6 serializer tests, 5 service tests, 4 view tests,
  2 detail view tests, 2 search tests, 1 health check test
- Verified: health check 200, invalid level 400,
  POST without MongoDB 500 (expected — no database yet)

### Incident Service (Spring Boot)
- Added IncidentTimeline entity:
  id, incidentId, action, performedBy, details,
  organizationId, createdAt
- Added IncidentTimelineRepository with derived query method:
  findByIncidentIdAndOrganizationIdOrderByCreatedAtAsc
- Added TimelineResponse DTO with static from() factory
- Updated IncidentService to record timeline entries:
  INCIDENT_CREATED on createIncident
  STATUS_CHANGED on updateStatus
  INCIDENT_ASSIGNED on assignIncident
- Added getTimeline() method to service
- Added GET /api/incidents/:id/timeline endpoint to controller
- Fixed UnnecessaryStubbingException by moving timeline stubs
  from @BeforeEach to individual tests that need them
- Updated IncidentServiceUnitTest — 12 unit tests now passing
- All 26 tests passing: BUILD SUCCESS

## What I Learned

### Django project structure vs Express
Django has two levels: Project (log_service/) and App (logs/).
Project = overall configuration (settings, root URLs, wsgi).
App = self-contained feature module (views, urls, serializers, tests).
One project can contain many apps. Equivalent Express mapping:
app.ts → settings.py + log_service/urls.py
routes/ → logs/urls.py
controllers/ → logs/views.py
validators/ → logs/serializers.py
repositories/ → logs/repository.py (custom, not Django ORM)

### manage.py — Django CLI tool
Django's command line interface. Equivalent of npm run scripts.
python manage.py runserver 3003 → start dev server on port 3003
python manage.py check          → validate configuration
python manage.py migrate        → run database migrations
python manage.py test logs      → run tests for logs app
Never edit this file — just run commands through it.

### Virtual environment (venv)
Isolated Python installation per project. Prevents package
version conflicts between projects. Created with:
python -m venv venv
Activated with: source venv/Scripts/activate
(venv) appears in prompt when active.
requirements.txt committed (not venv folder) — equivalent
to package.json listing dependencies.
deactivate exits the virtual environment.

### MongoDB collection vs PostgreSQL table
PostgreSQL: Database → Tables → Rows (fixed schema)
MongoDB: Database → Collections → Documents (flexible schema)
Collection is a bucket for documents. No fixed schema — each
document can have completely different fields. Perfect for logs
because payment-service, auth-service, and database-service
all send different metadata fields.

### Why lazy initialization for MongoDB connection
Module-level code runs immediately when file is imported.
If MongoDB is unavailable at startup, module-level connection
crashes the entire app before it starts.
Function-level code runs only when called — first request
triggers the connection. App starts successfully even if
MongoDB is down. Only the specific request that needs MongoDB
fails, not the entire service. Health check still responds.

### DRF Serializers vs Express validators
Both validate incoming request data. DRF serializers also:
→ Convert Python objects to JSON (serialization)
→ Convert JSON to Python objects (deserialization)
→ Support nested validation with ListField and DictField
serializer.is_valid() → runs validation
serializer.validated_data → clean, safe data
serializer.errors → field-level error messages

### Why we disabled DRF authentication
DRF's default auth system checks for Django session cookies
and Basic auth headers. It tries to load django.contrib.auth
models. Our Log Service does not use Django's user system —
identity comes from x-user-id and x-organization-id headers
set by the API Gateway after JWT verification. DRF auth
would crash trying to find users in a table we do not use.
Solution: DEFAULT_AUTHENTICATION_CLASSES: [], UNAUTHENTICATED_USER: None

### Why we needed SQLite even though we use MongoDB
Django requires a database backend to start — even for internal
operations like running tests. django.contrib.auth and
django.contrib.contenttypes need tables to exist. SQLite gives
Django what it needs for internals. MongoDB handles our actual
log data via pymongo directly. SQLite tables sit unused for
our business logic — only Django's internal framework uses them.
python manage.py migrate creates these internal tables.

### Python mocking vs Jest mocking
JavaScript: jest.mock('../mongodb', () => ({ getCollection: jest.fn() }))
Python:     @patch('logs.views.get_logs_collection')
            def test_something(self, mock_get_collection):
Both replace real dependencies with fakes during tests.
MagicMock() in Python = jest.fn() in JavaScript.
mock.return_value = MagicMock() configures what the mock returns.
@patch decorator applies the mock only for that test's duration.

### HTTP headers in Django test client
Django test client reads headers with HTTP_ prefix and
uppercase with underscores replacing hyphens:
X-Organization-Id → HTTP_X_ORGANIZATION_ID
** unpacks a dict as keyword arguments to a function call.

### auto-detection pipeline
CRITICAL log arrives → Log Service detects level
→ publishes critical.log.detected to RabbitMQ (Phase 6)
→ Incident Service creates incident automatically
→ Notification Service alerts the team
→ AI Service analyzes logs and suggests root cause
→ Dashboard shows complete picture to developer
Not just storage — active monitoring that creates incidents
and sends alerts without human intervention.

### metadata field for flexible log structure
Different applications send different fields.
All application-specific data goes inside metadata dict.
DictField with JSONField children accepts any JSON structure.
SDK wraps application data into metadata automatically.
MongoDB stores it as-is — no schema changes needed when
new applications are onboarded.

### Mockito UnnecessaryStubbingException
Mockito strict mode fails if you set up a stub in @BeforeEach
but a specific test does not call that method.
Solution: only stub in the specific tests that use it.
This is good practice — precise tests, no false assumptions.
Tests that do not call timelineRepository.save() should not
stub it — doing so suggests the test setup is wrong.

### Incident timeline
Every action on an incident is recorded:
INCIDENT_CREATED — when incident is created
STATUS_CHANGED — {"from": "OPEN", "to": "INVESTIGATING"}
INCIDENT_ASSIGNED — {"assignedTo": "user_456"}
Stored in incident_timelines table, scoped by organizationId.
Gives developers complete audit trail of what happened and when.
GET /api/incidents/:id/timeline returns entries in chronological order.

### Framework selection reasoning
Express: minimal, full control, good for API Gateway and Auth
Spring Boot: enterprise Java, JPA, multi-threaded, good for
             complex domain (Incident Service)
Django: batteries included, fast development, good for
        Log Service with complex filtering and aggregation
FastAPI: async Python, good for AI Service (OpenAI calls)
Flask: minimal Python, good for simple Notification Service
Each chosen for specific reasons — not randomly.

## Problems Faced
- admin URL in urls.py after removing django.contrib.admin
  from INSTALLED_APPS
- RuntimeError: django.contrib.auth.models.Permission not in
  INSTALLED_APPS (DRF tries to load auth models internally)
- ImportError: BulkLogCreateSerializer not in serializers.py
  (updated views.py before adding the serializer class)
- UnnecessaryStubbingException in Mockito (timeline stub in
  @BeforeEach used by some tests but not all)
- venv activated when trying to run Maven (different terminal
  session, needed to deactivate first)

## How I Solved Them
- Replaced admin URL with just our logs routes in urls.py
- Added django.contrib.auth and django.contrib.contenttypes
  back to INSTALLED_APPS, ran migrate to create their tables
- Added BulkLogCreateSerializer class to serializers.py
- Moved timelineRepository.save() stub from @BeforeEach to
  individual test methods that actually call it
- Ran deactivate to exit venv, then cd to incident-service

## Test Results

Log Service: 20 tests, 0 failures, OK in 0.032s
Incident Service: 26 tests, 0 failures, BUILD SUCCESS

9 integration tests (@SpringBootTest)
12 unit tests (@ExtendWith MockitoExtension)
4 repository tests (@DataJpaTest)
1 context load test

## APIs Built

Log Service (Django):
POST /api/logs/ → ingest single log
POST /api/logs/bulk/ → ingest multiple logs
GET /api/logs/ → list with filters and pagination
GET /api/logs/search/ → full-text search placeholder
GET /api/logs/services/ → list all services
GET /api/logs/health/ → health check
GET /api/logs/<id>/ → get single log by ID

Incident Service (Spring Boot) — added:
GET /api/incidents/:id/timeline → incident timeline

## Commands Used
```bash
python -m venv venv
source venv/Scripts/activate
pip install django djangorestframework pymongo django-environ pytest pytest-django
pip freeze > requirements.txt
django-admin startproject log_service .
python manage.py startapp logs
python manage.py check
python manage.py migrate
python manage.py test logs
python manage.py runserver 3003
deactivate
cd ../incident-service
./mvnw test
git add .
git commit -m "feat(log): complete Phase 5 — Django Log Service with full layered architecture, all APIs, 20 tests"
git commit -m "feat(incident): add timeline entity, repository, service methods, controller endpoint — 26 tests passing"
git push origin feature/log-service
```

## Git Branch
feature/log-service

## Next Step
Phase 6 — RabbitMQ event system.
Replace print statements in Log Service with real event publishing.
critical.log.detected event → Incident Service auto-creates incident.
incident.created event → AI Service and Notification Service consume.
This is the event-driven architecture that connects all services.

---

# Day 13 — 10 June 2026

## Goal
Build Phase 6 — RabbitMQ event system. Connect Log Service
and Incident Service so critical logs automatically trigger
incident creation without direct HTTP calls between services.

## Work Completed

### Infrastructure
- Started RabbitMQ via Docker:
  docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672
  rabbitmq:3-management
- Started MongoDB via Docker for end-to-end testing:
  docker run -d --name mongodb -p 27017:27017 mongo:7
- Started PostgreSQL via Docker for end-to-end testing:
  docker run -d --name postgres -e POSTGRES_PASSWORD=postgres
  -e POSTGRES_DB=incident_platform -p 5432:5432 postgres:15
- Verified RabbitMQ management UI at http://localhost:15672

### Incident Service (Spring Boot) — RabbitMQ
- Added spring-boot-starter-amqp to pom.xml
- Created RabbitMQConfig.java:
  TopicExchange 'incident_platform' (durable)
  Queue 'log.critical.queue' (durable)
  Queue 'incident.created.queue' (durable)
  Binding: critical.log.detected → log.critical.queue
  Binding: incident.created → incident.created.queue
  Jackson2JsonMessageConverter for JSON serialization
  RabbitTemplate with JSON converter
- Created EventPublisher.java:
  publishIncidentCreated() — publishes incident.created event
  to exchange with routing key 'incident.created'
- Created EventConsumer.java:
  @RabbitListener on log.critical.queue
  handleCriticalLog() — reads event, creates incident automatically,
  records timeline, publishes incident.created event
- Updated application.properties with RabbitMQ and PostgreSQL config

### Log Service (Django) — RabbitMQ
- Installed pika 1.4.2 (Python RabbitMQ client)
- Updated requirements.txt
- Added RabbitMQ config to settings.py:
  RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASSWORD
- Added RabbitMQ env vars to .env
- Created logs/events.py:
  get_rabbitmq_connection() — creates pika connection
  publish_critical_log_detected() — connects, declares exchange,
  publishes event with delivery_mode=2 (persistent), closes connection
- Updated logs/service.py:
  replaced print statements in _handle_critical_log with real
  RabbitMQ publish via publish_critical_log_detected()
  added log_id parameter to _handle_critical_log
  added proper logging with logger.critical and logger.info
- Fixed ObjectId serialization bug:
  log_document.pop('_id', None) after MongoDB insert
- Fixed test: updated assert_called_once_with to include log_id

### End-to-end test — PASSED
Full pipeline verified with all infrastructure running:
1. curl POST /api/logs/ with CRITICAL level
2. Log Service saved to MongoDB
3. Log Service published critical.log.detected to RabbitMQ
4. Message sat in log.critical.queue
5. Incident Service started, connected to RabbitMQ
6. Consumed both queued messages immediately
7. Auto-created 2 incidents in PostgreSQL
8. Recorded timeline entries
9. Published incident.created events
10. curl GET /api/incidents returned both auto-created incidents

curl response confirmed:
[
  { "title": "CRITICAL: Database connection pool exhausted
    in payment-service", "severity": "CRITICAL",
    "status": "OPEN", "createdBy": "system" },
  { ... second incident ... }
]

## What I Learned

### Why RabbitMQ instead of direct HTTP calls
Five problems with direct HTTP calls between services:
1. Tight coupling — Log Service must know about every other service
2. Cascading failures — if Incident Service is down, Log Service fails
3. Slow responses — client waits for all downstream calls to complete
4. Adding services requires modifying Log Service code
5. No retry mechanism — failed calls are lost forever
RabbitMQ solves all five: loose coupling, fault isolation,
async processing, open/closed principle, guaranteed delivery.

### RabbitMQ vs Kafka — when to use which
RabbitMQ: task queues, message deleted after consumption,
push-based, best for tens of thousands of messages/day,
simple routing, our use case (create incident, send notification).
Kafka: event streaming, message kept for days/weeks,
pull-based, best for millions of messages/second, replay events,
multiple independent consumers, analytics pipelines.
We chose RabbitMQ because our use case is task-based processing,
not event streaming. EventPublisher abstraction means we can
switch to Kafka by changing one file per service.

### Exchange, Queue, Binding
Exchange: routing hub — publishers send to exchange, never directly
          to queues. Topic exchange routes by routing key pattern.
Queue: message storage — messages sit here until consumed.
       Durable queues survive RabbitMQ restarts.
Binding: rule connecting exchange to queue.
         'critical.log.detected' routing key → log.critical.queue

### @RabbitListener annotation
Spring AMQP annotation that starts a background listener thread.
When a message arrives in the queue, Spring automatically calls
the annotated method and converts JSON to Java Map.
Equivalent to: channel.consume('queue', (msg) => handleMsg(msg))
The main application keeps running while this waits for messages.

### delivery_mode=2 — persistent messages
delivery_mode=1: transient — stored in memory, lost on restart
delivery_mode=2: persistent — written to disk, survives restart
Combined with durable queue = guaranteed delivery.
Critical for incident events — losing a CRITICAL log event
would mean an incident is never created.

### Jackson2JsonMessageConverter
Converts Java objects to JSON automatically when publishing.
Converts JSON back to Java objects when consuming.
Without it: raw bytes — manual serialization required.
With it: publish a Map, receive a Map — no serialization code needed.

### pika — Python RabbitMQ client
BlockingConnection creates a synchronous connection.
channel.exchange_declare ensures exchange exists before publishing.
channel.basic_publish sends the message with routing key.
Pika connects, publishes, disconnects — no persistent connection.
This is correct for a web service — connections are cheap,
keeping them open wastes resources.

### RabbitMQ message acknowledgement
When EventConsumer processes a message successfully, Spring AMQP
automatically sends an acknowledgement to RabbitMQ.
RabbitMQ then deletes the message from the queue.
If processing fails and exception is re-thrown, message goes
back to queue for retry. We catch exceptions to prevent
infinite retry loops when downstream services are unavailable.

### ObjectId not JSON serializable
MongoDB stores _id as ObjectId (binary type, not string).
When returning the log document as JSON, ObjectId cannot be
serialized by Python's json module.
Fix: log_document.pop('_id', None) removes _id before returning,
and log_document['id'] = log_id adds the string version.

### Messages queue when consumer is offline
Two CRITICAL logs sent before Incident Service started.
Messages sat in log.critical.queue.
When Incident Service started — consumed both immediately.
This is guaranteed delivery — messages are never lost even if
the consumer is temporarily offline. This is the core value
of RabbitMQ over direct HTTP calls.

### The event chain
critical.log.detected → Incident Service creates incident
                      → publishes incident.created
incident.created     → AI Service will analyze (Phase 8)
                      → Notification Service will alert (Phase 9)
Each phase adds a new consumer without modifying existing services.

## Problems Faced
- pom.xml malformed due to backtick character when pasting dependency
- PostgreSQL authentication failed: SCRAM-based auth, no password
- ObjectId not JSON serializable when returning log response
- Test failure: assert_called_once_with missing log_id argument
- MongoDB not running when first testing CRITICAL log endpoint

## How I Solved Them
- Opened pom.xml in VS Code, removed backtick character, recompiled
- Added spring.datasource.password=postgres to application.properties
- Added log_document.pop('_id', None) in service.py create_log
- Updated test assertion to include 'abc123' as fourth argument
- Started MongoDB with Docker: docker run -d mongo:7 -p 27017:27017

## Test Results

Log Service: 20 tests passing (after fixing assert signature)
Incident Service: 26 tests passing — BUILD SUCCESS
RabbitMQ connection verified in test output:
"Created new connection: amqp://guest@127.0.0.1:5672/"
End-to-end: FULL PIPELINE VERIFIED
2 auto-created incidents confirmed via GET /api/incidents

## Complete file flow (end-to-end)

curl POST /api/logs/
→ log_service/urls.py
→ logs/urls.py
→ logs/views.py (LogListCreateView.post)
→ logs/serializers.py (LogCreateSerializer.is_valid)
→ logs/service.py (LogService.create_log)
→ logs/repository.py (LogRepository.insert_log)
→ logs/mongodb.py (get_logs_collection)
→ MongoDB (document inserted)
→ logs/service.py (_handle_critical_log)
→ logs/events.py (publish_critical_log_detected)
→ RabbitMQ log.critical.queue
→ incident-service/config/RabbitMQConfig.java
→ incident-service/events/EventConsumer.java (handleCriticalLog)
→ incident-service/service/IncidentService.java (createIncident)
→ incident-service/repository/IncidentRepository.java (save)
→ PostgreSQL incidents table
→ incident-service/repository/IncidentTimelineRepository.java (save)
→ PostgreSQL incident_timelines table
→ incident-service/events/EventPublisher.java (publishIncidentCreated)
→ RabbitMQ incident.created.queue
(waiting for Phase 8 AI Service and Phase 9 Notification Service)


## Commands Used
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
docker run -d --name mongodb -p 27017:27017 mongo:7
docker run -d --name postgres -e POSTGRES_USER=postgres
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=incident_platform
  -p 5432:5432 postgres:15
pip install pika
pip freeze > requirements.txt
python manage.py test logs
python manage.py runserver 3003
./mvnw compile
./mvnw test
./mvnw spring-boot:run
docker stop mongodb postgres rabbitmq
git add .
git commit -m "feat(incident): add RabbitMQ consumer — auto-creates incident on critical.log.detected"
git commit -m "feat(log): add RabbitMQ publisher — publishes critical.log.detected on CRITICAL log"
git commit -m "config(incident): add PostgreSQL password and RabbitMQ connection properties"
git push origin feature/rabbitmq
```

## Git Branch
feature/rabbitmq

## Next Step
Phase 7 — Demo Applications.
Build payment-demo, user-demo, inventory-demo.
Each uses @incidentai/sdk to send logs automatically.
Build the SDK in packages/sdk/nodejs/.
Demo apps generate realistic logs including CRITICAL events
to prove the full pipeline end to end.

Commit the daily log:

bash
git add .
git commit -m "docs(daily-log): add day 13 session log"
git push origin feature/rabbitmq

Update project-status.md:

markdown
# Project Status

Date: 10 June 2026
Current phase: Phase 7 — Demo Applications
Completed phases: Phase 0, Phase 1a, Phase 1b, Phase 1c,
                  Phase 2, Phase 3, Phase 4, Phase 5, Phase 6
In progress: Not started
Last commit: docs(daily-log): add day 13 session log
Decisions made:
  ADR-001 — use monorepo structure
  ADR-002 — auth service phase split
  ADR-003 — separate password service
  ADR-004 — email verification design
  ADR-005 — OAuth2 duplicate email handling
  ADR-006 — secrets management strategy
  ADR-007 — multi-tenancy strategy
Blockers: none
My biggest confusion right now: none
bash
git add .
git commit -m "docs(status): update project status — Phase 6 complete"
git push origin feature/rabbitmq

Then open PR feature/rabbitmq → develop, self-review, merge.

See you at Session 14 for Phase 7 — Demo Applications and SDK.

## Commands Used
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
docker run -d --name mongodb -p 27017:27017 mongo:7
docker run -d --name postgres -e POSTGRES_USER=postgres
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=incident_platform
  -p 5432:5432 postgres:15
pip install pika
pip freeze > requirements.txt
python manage.py test logs
python manage.py runserver 3003
./mvnw compile
./mvnw test
./mvnw spring-boot:run
docker stop mongodb postgres rabbitmq
git add .
git commit -m "feat(incident): add RabbitMQ consumer — auto-creates incident on critical.log.detected"
git commit -m "feat(log): add RabbitMQ publisher — publishes critical.log.detected on CRITICAL log"
git commit -m "config(incident): add PostgreSQL password and RabbitMQ connection properties"
git push origin feature/rabbitmq
```

## Git Branch
feature/rabbitmq

## Next Step
Phase 7 — Demo Applications.
Build payment-demo, user-demo, inventory-demo.
Each uses @incidentai/sdk to send logs automatically.
Build the SDK in packages/sdk/nodejs/.
Demo apps generate realistic logs including CRITICAL events
to prove the full pipeline end to end.


---

# Day 14 — 11 June 2026

## Goal
Build Phase 7 — SDK and Demo Applications.
Create @incidentai/sdk npm package and three demo applications
that use it to send realistic logs to the platform automatically.

## Work Completed

### @incidentai/sdk (packages/sdk/nodejs/)
- Created npm package with name @incidentai/sdk
- Installed: axios, typescript@5.4.5, ts-jest, jest, @types/node
- Created src/types.ts:
  LogLevel type (INFO | WARNING | ERROR | CRITICAL)
  IncidentAIConfig interface (apiKey, service, apiUrl, timeout, silent)
  LogPayload interface
  LogResponse interface
- Created src/logger.ts — IncidentAI class with:
  constructor creates axios instance with base URL and headers
  info(), warning(), error(), critical() public methods
  private log() method builds payload and calls POST /api/logs/ingest
  silent: true default — never throws, never crashes the app
  silent: false option — throws errors for testing
- Created src/index.ts — exports IncidentAI and all types
- Created jest.config.js
- Wrote 8 tests in tests/logger.test.ts:
  should send INFO log with correct payload
  should send WARNING log with correct payload
  should send ERROR log with correct payload
  should send CRITICAL log with correct payload
  should send empty metadata when not provided
  should not throw when API call fails in silent mode
  should throw when API call fails and silent is false
  should use service name from config in every log
- Built SDK with npm run build → dist/ folder created
- Used npm link to make @incidentai/sdk available locally
  without publishing to npm

### API Gateway — new route
- Added /api/logs/ingest — public endpoint, no JWT required
  pathRewrite: { '^/api/logs/ingest': '/api/logs/' }
  → SDK sends to /api/logs/ingest
  → Gateway rewrites path to /api/logs/
  → Log Service receives /api/logs/
- /api/logs/ still protected with JWT for dashboard use
- 12 gateway tests still passing after change

### payment-demo (demo-apps/payment-demo/)
- TypeScript Express app using @incidentai/sdk
- 5 normal scenarios: payment processed, refund issued,
  retry attempt, card declined, gateway timeout
- 3 critical scenarios: database lost, gateway unreachable,
  fraud detection down
- Sends log every 5 seconds
- Sends CRITICAL every 10 iterations (50 seconds)
- Graceful shutdown on Ctrl+C with process.on('SIGINT')
- npm link @incidentai/sdk — imports as real npm package

### user-demo (demo-apps/user-demo/)
- Same structure as payment-demo
- 5 normal scenarios: login, register, failed attempt,
  password reset, session expired
- 3 critical scenarios: auth database lost, JWT secret
  rotation failed, mass login failures detected
- Sends log every 7 seconds
- Sends CRITICAL every 10 iterations (70 seconds)

### inventory-demo (demo-apps/inventory-demo/)
- Same structure as payment-demo
- 5 normal scenarios: stock updated, order fulfilled,
  low stock alert, warehouse sync delayed, stock update failed
- 3 critical scenarios: database corrupted, warehouse
  system unreachable, stock mismatch detected
- Sends log every 9 seconds
- Sends CRITICAL every 10 iterations (90 seconds)

### End-to-end test — PASSED
Full pipeline verified with payment-demo running:
payment-demo → SDK → POST /api/logs/ingest
→ API Gateway proxies to Log Service
→ Log Service saves to MongoDB
→ CRITICAL detected → published to RabbitMQ
→ Incident Service auto-creates incident in PostgreSQL

## What I Learned

### What an SDK is
SDK (Software Development Kit) — a package that wraps your API
and gives developers a simple interface. Without SDK, developers
write HTTP calls manually in every file. With SDK, they call
monitor.critical('message') and the SDK handles everything.
Same concept as Stripe SDK, AWS SDK, Firebase SDK.

### Why silent: true is the default
The monitoring tool must NEVER crash the application it monitors.
If our platform goes down temporarily and the SDK throws an error,
it could crash a payment service mid-transaction. Silent mode
catches all errors internally and logs nothing — the app keeps
running. Monitoring should never be more dangerous than the
problem it is monitoring.

### npm link — local package development
npm link in the SDK folder creates a global symlink.
npm link @incidentai/sdk in the demo app creates a local symlink
pointing to the global one. Demo app imports @incidentai/sdk
as if it were installed from npm — but actually uses local files.
This is how monorepo packages work before publishing to npm.
When we publish: npm publish → npm install @incidentai/sdk →
import stays identical — zero code changes needed.

### Why separate /api/logs/ingest route
Applications sending logs use API keys, not JWT.
JWT is for human users logging into the dashboard.
Having one /api/logs/ route protected by JWT would block
all SDK requests (401 Unauthorized).
Solution: /api/logs/ingest — public, SDK uses this.
          /api/logs/ — JWT protected, dashboard uses this.
Post-Phase-14: /api/logs/ingest validates X-Api-Key header
against api_keys table in database.

### pathRewrite in http-proxy-middleware
pathRewrite: { '^/api/logs/ingest': '/api/logs/' }
Gateway receives: POST /api/logs/ingest
Gateway rewrites to: POST /api/logs/
Log Service receives: POST /api/logs/
Log Service does not need to know about /ingest path.
This is path normalization — external URLs can differ from
internal service routes.

### Django logging levels
Django's default logging level is WARNING.
logger.info() messages are suppressed by default.
"Published critical.log.detected to RabbitMQ" uses logger.info()
→ was always working, just not visible.
Adding LOGGING config with level: DEBUG revealed it.
Lesson: "it is not working" often means "the logs are hidden".

### Why staggered demo app intervals
payment-demo:   5 seconds (payments are frequent)
user-demo:      7 seconds (user events less frequent)
inventory-demo: 9 seconds (inventory changes slowly)
Staggered intervals = logs arrive at different times.
More realistic than three services logging simultaneously.
Shows the platform handling multiple services independently.

### SDK apiKey as organizationId (temporary)
Full production: API Gateway queries api_keys table,
resolves organizationId from key, validates key is active.
Current approach: apiKey value used directly as organizationId.
Works for demo apps because we control both sides.
Post-Phase-14 feature to implement properly.
X-Api-Key header forwarded to Log Service for future validation.

### Three ways any app can use our platform
1. SDK (easiest) — npm install @incidentai/sdk, 3 lines of code
2. Direct HTTP API — any language, just HTTP calls to /api/logs/
3. Agent (Phase 10) — no code changes, monitors infrastructure
SDK is Node.js only now. Python/Java SDKs follow identical pattern.
HTTP API works for every language ever created.

### Open source security model
/api/logs/ingest is currently public for development.
Production protections: API key validation (post-Phase-14),
rate limiting per IP already built (100 req/min),
input validation rejects invalid payloads,
organization isolation prevents cross-tenant access,
storage quotas per organization (post-Phase-14).
Self-hosted users add their own network controls.

## Problems Faced
- TypeScript 7 incompatible with ts-jest (same issue as before)
- Cannot find module @incidentai/sdk (relative path vs npm link)
- POST /api/logs/ returning 401 (SDK requests need no JWT)
- Cannot find name process/console/setTimeout in inventory-demo
  (missing tsconfig.json and @types/node)
- Published to RabbitMQ message not visible in logs
  (Django default logging level suppressed INFO messages)

## How I Solved Them
- Downgraded typescript to 5.4.5 in SDK package.json
- Used npm link instead of relative path import
- Added /api/logs/ingest public route to API Gateway
- Created tsconfig.json with "types": ["node"] in inventory-demo
- Added LOGGING config to settings.py with level: DEBUG
  then changed to WARNING/INFO to reduce noise

## Test Results

@incidentai/sdk: 8 tests passing
API Gateway: 12 tests passing
End-to-end: FULL PIPELINE VERIFIED
payment-demo → SDK → Gateway → Log Service → MongoDB
→ RabbitMQ → Incident Service → PostgreSQL
CRITICAL auto-incident confirmed

## Commands Used
```bash
cd packages/sdk/nodejs
npm init -y
npm install axios
npm install --save-dev typescript@5.4.5 @types/node ts-jest jest @types/jest
npm test
npm run build
npm link

cd demo-apps/payment-demo
npm init -y
npm install
npm link @incidentai/sdk
npm start

cd demo-apps/user-demo
npm init -y
npm install
npm link @incidentai/sdk

cd demo-apps/inventory-demo
npm init -y
npm install
npm link @incidentai/sdk

cd services/api-gateway-express
npm test

docker start rabbitmq mongodb postgres
docker stop rabbitmq mongodb postgres

git add .
git commit -m "feat(demo): add payment-demo with SDK integration"
git commit -m "feat(demo): add user-demo and inventory-demo applications"
git commit -m "feat(demo): complete Phase 7 — SDK, payment-demo, user-demo, inventory-demo"
git push origin feature/demo-apps
```

## Git Branch
feature/demo-apps

## Next Step
Phase 8 — AI Service (FastAPI/Python).
Build AI-powered root cause analysis.
Consumes incident.created events from RabbitMQ.
Calls OpenAI API to analyze logs and suggest root causes.
Stores analysis in PostgreSQL with pgvector for similarity search.
Adds AI analysis tab to incidents in the dashboard.