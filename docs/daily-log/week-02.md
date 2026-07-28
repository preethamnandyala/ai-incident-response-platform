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

---

# Day 15 — 12 June 2026

## Goal
Build Phase 8 — AI Service (FastAPI/Python).
AI-powered root cause analysis for incidents using
Anthropic's Claude API. Consumes incident.created events
from RabbitMQ and stores analysis in PostgreSQL.

## Work Completed

### AI Service setup (services/ai-service-fastapi/)
- Deleted .gitkeep placeholder
- Created virtual environment and activated it
- Installed packages:
  fastapi, uvicorn, pika, httpx, sqlalchemy, psycopg2-binary,
  python-dotenv, openai, pydantic, pytest, pytest-asyncio,
  anthropic, httpx2
- Saved requirements.txt
- Created folder structure:
  app/ with __init__.py in every subfolder
  app/api/, app/services/, app/repositories/
  app/models/, app/consumers/, app/config/
  tests/ folder
- Created .env with all configuration
- Created .gitignore: venv/, __pycache__/, *.pyc, .env, *.db
- Created pytest.ini with asyncio_mode = auto

### Files written

**app/config/settings.py:**
Settings class reading all config from .env via os.getenv()
Fields: debug, secret_key, port, database_url,
rabbitmq_host/port/user/password, anthropic_api_key,
log_service_url, incident_service_url,
incident_created_queue, ai_exchange, ai_analysis_routing_key
settings singleton exported at module level

**app/config/database.py:**
SQLAlchemy engine from DATABASE_URL
SessionLocal session factory
declarative_base() for model inheritance
get_db() generator — yields session, closes after request
create_tables() — creates all tables on startup
Fixed: changed from sqlalchemy.ext.declarative to
sqlalchemy.orm.declarative_base (SQLAlchemy 2.0)

**app/models/analysis.py:**
AIAnalysis SQLAlchemy model → ai_analyses table
Columns: id(UUID auto-generated), incident_id, organization_id,
root_cause(Text), confidence(Float), possible_causes(JSON),
suggested_actions(JSON), similar_incidents(JSON),
raw_response(Text), model_used(String),
created_at(DateTime server default), updated_at(DateTime onupdate)

**app/repositories/analysis_repository.py:**
AnalysisRepository class with db: Session injected
create() — inserts new analysis, commits, refreshes
find_by_incident_id() — finds by incident_id + organization_id
find_by_organization() — lists analyses sorted by created_at desc

**app/services/ai_service.py:**
fetch_related_logs() — async httpx call to Log Service directly
  params: service_name, limit=20
  headers: X-Organization-Id
  returns: list of log documents
build_analysis_prompt() — builds structured prompt for Claude
  includes incident details and last 10 logs
  requests JSON response with specific schema
  rootCause, confidence, possibleCauses, suggestedActions
analyze_incident() — async Anthropic API call
  model: claude-sonnet-4-6, max_tokens: 1000
  parses JSON response with regex fallback
  returns structured analysis dict
  graceful failure — returns default analysis on error

**app/consumers/incident_consumer.py:**
get_incident_details() — sync httpx call to Incident Service
handle_incident_created() — pika callback function
  reads event: incidentId, organizationId
  fetches incident details
  runs async analyze_incident() via asyncio.new_event_loop()
  stores analysis in PostgreSQL via AnalysisRepository
  basic_ack on success, basic_nack(requeue=False) on failure
start_consumer() — pika BlockingConnection, queue declare,
  basic_qos(prefetch_count=1), basic_consume, start_consuming
start_consumer_thread() — runs start_consumer in daemon thread

**app/api/routes.py:**
GET /health → health check with model info
GET /analyses/{incident_id} → get analysis by incident
POST /analyses/{incident_id}/trigger → manual AI trigger
  fetches incident from Incident Service
  calls analyze_incident()
  stores and returns result
GET /analyses → list all analyses for organization
All routes use Depends(get_db) for database session injection

**app/main.py:**
FastAPI app with lifespan context manager
Startup: create_tables() + start_consumer_thread()
app.include_router(router, prefix='/api/ai')
Root health check at /health

### Tests (10 passing)
tests/test_ai_service.py:
  TestBuildAnalysisPrompt (4 tests):
    test_includes_incident_title
    test_includes_service_name
    test_includes_logs_when_provided
    test_requests_json_output
  TestAnalyzeIncident (2 async tests):
    test_returns_analysis_structure (mocked Anthropic)
    test_handles_api_failure_gracefully

tests/test_routes.py (4 tests):
    test_health_check
    test_ai_health_check
    test_get_analysis_not_found
    test_list_analyses_returns_empty

### Anthropic API key
Created account at platform.claude.com
Individual organization, $5 free credits
Created API key with no expiration
Added to .env as ANTHROPIC_API_KEY

## What I Learned

### Why FastAPI over Django for AI Service
AI Service is I/O-bound — most time spent waiting for:
→ Anthropic API response (2-5 seconds)
→ Log Service HTTP call
→ PostgreSQL write
Django is synchronous — one thread blocks while waiting.
FastAPI is async — single thread handles multiple requests
simultaneously using async/await. While waiting for OpenAI
response for incident 1, it starts processing incident 2.
10 concurrent incidents: Django needs 10 threads,
FastAPI handles all 10 with one thread.

### Direct service-to-service vs through Gateway
Gateway: designed for external traffic, requires JWT,
has rate limiting, adds unnecessary network hop.
Direct: internal traffic, trusted network, faster,
no JWT needed, no rate limiting between services.
AI Service calls Log Service and Incident Service directly
using internal URLs (localhost in dev, Docker network in prod).

### gRPC vs REST for service communication
REST: simple, JSON readable, any language supports it,
easy to debug with curl. Best for most microservices.
gRPC: binary protocol, HTTP/2, faster, strongly typed
protobuf contracts, auto-generated clients, streaming support.
Best for extremely high throughput or real-time streaming.
Our platform uses REST — request volume does not justify
gRPC complexity. Would consider gRPC for real-time log
tailing or if processing 100,000+ incidents per second.

### What is a thread
A thread is an independent sequence of instructions
running concurrently within the same process.
AI Service needs two things simultaneously:
Main thread: FastAPI HTTP server (handles API requests)
Background thread: RabbitMQ consumer (listens forever)
pika's start_consuming() blocks forever — if run in main thread,
HTTP server never starts. daemon=True means thread dies
automatically when main process exits — clean shutdown.

### asyncio.new_event_loop() bridge
RabbitMQ consumer (pika) is synchronous.
analyze_incident() is async.
Cannot await async function from sync context directly.
Solution: create new event loop, run async function to
completion, close loop. Bridges sync/async boundary.
loop = asyncio.new_event_loop()
result = loop.run_until_complete(async_function())
loop.close()

### __init__.py — making folders into packages
Python requires __init__.py in every folder to treat it
as an importable package. Without it:
from app.services.ai_service import analyze_incident → ImportError
With empty __init__.py in every folder → import works.
Node.js treats folders as importable automatically.
Python requires explicit declaration — stricter.

### pytest.ini asyncio_mode = auto
pytest is synchronous by default.
Without asyncio_mode = auto: async tests silently do nothing
or crash with "coroutine was never awaited".
With asyncio_mode = auto: pytest-asyncio automatically
detects and runs all async test functions.
Equivalent to Jest which handles async tests natively.

### SQLAlchemy session pattern
get_db() uses yield — generator function.
FastAPI calls everything before yield (opens session),
runs the route handler, then calls everything after yield
(closes session). Automatic cleanup on every request.
Equivalent to Express middleware that opens/closes connections.

### Dependency injection in FastAPI
db: Session = Depends(get_db)
FastAPI calls get_db() before the route handler runs
and passes the result as the db argument.
Equivalent to Spring Boot's @Autowired but explicit.
Makes database session available in any route with one line.

### JSON columns in SQLAlchemy
possible_causes = Column(JSON, nullable=False, default=list)
Stores Python lists directly in PostgreSQL JSON column.
SQLAlchemy serializes list → JSON on write.
SQLAlchemy deserializes JSON → list on read.
Perfect for variable-length data like suggested actions.

### Prompt engineering for structured output
Key technique: tell the AI exactly what JSON schema to return.
"Respond ONLY with valid JSON. No additional text."
Two-level parsing: try json.loads() first, then regex fallback.
Regex: re.search(r'\{.*\}', response, re.DOTALL)
Makes parsing robust against minor formatting variations.

### basic_ack vs basic_nack
basic_ack: "I processed this successfully, delete from queue"
basic_nack(requeue=False): "I failed, do not retry"
Without ack: RabbitMQ keeps redelivering forever
With requeue=True on nack: infinite retry loop on bad messages
With requeue=False on nack: message discarded (goes to
dead letter queue in production)

### Why Anthropic over OpenAI
Claude excels at analytical reasoning and structured JSON output.
Consistent formatting makes parsing more reliable.
Free $5 credits without credit card requirement.
Already using Claude — understand its strengths.
Can explain the choice confidently in interviews.

## Problems Faced
- declarative_base() deprecation warning in SQLAlchemy 2.0
- httpx deprecation warning in FastAPI TestClient

## How I Solved Them
- Changed import from sqlalchemy.ext.declarative to
  sqlalchemy.orm for declarative_base()
- pip install httpx2

## Test Results

AI Service: 10 tests passing in 6.12s — zero warnings
4 prompt building tests
2 async AI service tests (mocked Anthropic)
4 route tests (health, 404, empty list)

## Commands Used
```bash
python -m venv venv
source venv/Scripts/activate
pip install fastapi uvicorn pika httpx sqlalchemy psycopg2-binary python-dotenv openai pydantic pytest pytest-asyncio httpx anthropic
pip install httpx2
pip freeze > requirements.txt
python -c "import secrets; print(secrets.token_urlsafe(50))"
pytest tests/ -v
git add services/ai-service-fastapi/
git commit -m "feat(ai): add AI Service with FastAPI — Anthropic Claude integration, RabbitMQ consumer, PostgreSQL storage, 10 tests passing"
git push origin feature/ai-service
```

## Git Branch
feature/ai-service

## Next Step
Phase 9 — Notification Service (Flask/Python).
Build email and Slack notification system.
Consumes incident.created events from RabbitMQ.
Sends email alerts to on-call engineers.
Sends Slack webhook notifications.
Simple Flask service — focused single responsibility.

---

# Day 16 — 13 June 2026

## Goal
Build Phase 9 — Notification Service (Flask/Python).
Send email and Slack alerts when CRITICAL incidents are created.
Complete the full monitoring pipeline with real notifications.

## Work Completed

### Notification Service setup (services/notification-service-flask/)
- Deleted .gitkeep placeholder
- Created virtual environment and activated it
- Installed: flask, pika, requests, python-dotenv, pytest
- Saved requirements.txt
- Created files: app.py, consumer.py, notifier.py
- Created tests/ folder with test_notifier.py
- Created .env with SMTP and Slack configuration
- Created .gitignore: venv/, __pycache__/, *.pyc, .env

### External services configured
- Gmail App Password created at myaccount.google.com/apppasswords
  2-Step Verification already enabled
  Generated 16-character app password for IncidentAI
  No spaces in password when added to .env
- Slack workspace created: IncidentAI
  Slack app created: IncidentAI (Blank app)
  Incoming Webhooks enabled
  Webhook added to #all-incidentai channel
  Webhook URL copied to .env

### Files written

**notifier.py:**
NotificationSettings class — reads all config from .env
get_severity_emoji() — maps severity to emoji
  CRITICAL→🔴, HIGH→🟠, MEDIUM→🟡, LOW→🟢, UNKNOWN→⚪
send_email() — sends multipart/alternative email via Gmail SMTP
  plain text version for old clients
  HTML version with red banner, table, blue button
  uses smtplib.SMTP with starttls() for TLS encryption
  returns True/False
send_slack() — sends formatted Block Kit message via webhook
  header block with severity and emoji
  section blocks with service name and severity
  action block with "View Incident →" button
  skips silently if webhook not configured
  returns True/False
notify() — calls both send_email and send_slack
  returns dict: {'email': bool, 'slack': bool}

**consumer.py:**
handle_incident_created() — pika callback
  reads event: incidentId, title, severity, serviceName, organizationId
  calls notify() with incident data
  basic_ack on success, basic_nack(requeue=False) on failure
start_consumer() — pika BlockingConnection
  declares exchange: incident_platform (topic, durable)
  declares queue: incident.created.queue (durable)
  basic_qos(prefetch_count=1)
  basic_consume + start_consuming
start_consumer_thread() — daemon thread for consumer

**app.py:**
Flask app with two health endpoints:
  GET /health
  GET /api/notify/health
Starts consumer thread on startup
Runs on port 3005

### Tests (12 passing)
TestGetSeverityEmoji (5 tests):
  CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN emoji mapping
TestSendEmail (2 tests):
  sends email successfully (mocked smtplib.SMTP)
  returns False on SMTP error
TestSendSlack (3 tests):
  sends Slack successfully (mocked requests.post)
  skips when webhook not configured
  returns False on connection error
TestNotify (2 tests):
  calls both email and Slack
  returns correct results dict

### End-to-end test — PASSED
Full pipeline verified with all services running:
CRITICAL log sent via curl
→ API Gateway → Log Service → MongoDB
→ RabbitMQ critical.log.detected
→ Incident Service → PostgreSQL → incident.created
→ Notification Service:
  Email sent: preethamnexus@gmail.com ✓
  Slack sent: #all-incidentai channel ✓
  Multiple notifications received from queued messages

## What I Learned

### Why Flask for Notification Service
Notification Service has one job: receive event, send notification.
No database models needed, no admin panel, no complex queries,
no high concurrency. Flask is minimal and lightweight — perfect.
Django would add 400 lines of unnecessary code.
FastAPI would add async complexity with no benefit.
Flask handles this in 100 lines. Simpler is better.

### Gmail App Password vs regular password
Google blocks regular passwords for SMTP access.
App Password is a 16-character password generated specifically
for one application. Remove spaces before adding to .env.
Requires 2-Step Verification to be enabled first.
More secure — can revoke one app without changing main password.

### Slack Incoming Webhooks
A webhook URL that accepts POST requests with JSON payload.
No authentication needed — the URL itself is the secret.
Block Kit: Slack's JSON-based message formatting system.
Supports headers, sections, fields, buttons, images.
More powerful than plain text — creates rich formatted messages.
If webhook not configured → skip silently (optional integration).

### multipart/alternative email
Professional emails include both plain text and HTML versions.
Email client chooses which to display:
Gmail/Outlook → shows HTML (beautiful formatted)
Old clients → shows plain text (readable)
msg.attach(MIMEText(text, 'plain'))
msg.attach(MIMEText(html, 'html'))
starttls() → upgrades connection to TLS before sending credentials.

### RabbitMQ guaranteed delivery
Messages sit in durable queues until consumed.
Even if consumer is offline for days → messages wait.
When Notification Service started → consumed ALL queued messages
from previous sessions → sent notifications for every one.
This is correct behaviour — no incident notification ever lost.
In production: purge queues between development sessions.
In real deployment: this guarantees engineers are always notified.

### Why no SECRET_KEY in Notification Service
Auth Service needs it: signs JWT tokens
Log Service needs it: Django requires it
AI Service needs it: best practice
Notification Service: no user sessions, no JWT, no cookies
Just receives events and sends notifications.
Pure background service — no cryptographic operations needed.

### On-call routing — current vs future
Current: one configured email for all notifications
Future: service_configs table maps each service to team email
payment-service → payments team email + Slack channel
user-service → auth team email + Slack channel
get_notification_targets() function designed for easy extension —
one function to change when service ownership is added.

### PagerDuty integration pattern
PagerDuty gives each service an integration email address.
Our platform sends email to that address.
PagerDuty handles: who is on-call, escalation, acknowledgement.
We focus on detection and analysis — PagerDuty handles alerting.
Same principle: use specialized tools, do not reinvent the wheel.

### Accumulated queue messages
Previous sessions sent CRITICAL logs → incidents created
→ incident.created events published to RabbitMQ
→ nobody consuming yet → messages accumulated
Phase 9 Notification Service started → consumed all at once
→ 13 Slack messages + 13 emails received
Solution: purge queues between dev sessions at localhost:15672
Or: docker stop clears in-memory state

### Flask development server warning
"This is a development server. Do not use in production."
Flask's built-in server is single-threaded, not optimized.
In production (Phase 14): replace with Gunicorn
gunicorn --workers 4 app:app
Same concept as replacing ts-node-dev with proper Node.js
process manager in production.

## Problems Faced
- Received 13 Slack/email notifications instead of 1
- Could not access localhost:15672 to purge queues

## How I Solved Them
- Explained: accumulated RabbitMQ messages from previous sessions
  consumed all at once when Notification Service started
- docker stop clears everything — fresh start next session

## Test Results

Notification Service: 12 tests passing in 0.34s
End-to-end: FULL PIPELINE VERIFIED
Email received in Gmail ✓
Slack messages in #all-incidentai ✓
Correct incident details in both ✓
🔴 CRITICAL emoji displayed

## Complete pipeline (all 9 phases working together)

Demo app (payment-demo)
→ SDK (@incidentai/sdk)
→ POST /api/logs/ingest
→ API Gateway (3000) — routes to Log Service
→ Log Service (3003) — saves to MongoDB
→ Detects CRITICAL → publishes critical.log.detected
→ RabbitMQ (5672)
→ Incident Service (3002) — creates incident in PostgreSQL
→ publishes incident.created
→ Notification Service (3005):
Email → Gmail ✓
Slack → #all-incidentai ✓
→ AI Service (3004):
fetches logs → calls Claude → stores analysis

## Commands Used
```bash
python -m venv venv
source venv/Scripts/activate
pip install flask pika requests python-dotenv pytest
pip freeze > requirements.txt
python app.py
pytest tests/ -v
docker start rabbitmq mongodb postgres
docker stop rabbitmq mongodb postgres
curl -X POST http://localhost:3000/api/logs/ingest \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: org_default" \
  -d '{"level":"CRITICAL","message":"Payment database completely lost","service_name":"payment-service"}'
git add services/notification-service-flask/
git commit -m "feat(notification): add Notification Service with Flask — email and Slack alerts, RabbitMQ consumer, 12 tests passing"
git push origin feature/notification-service
```

## Git Branch
feature/notification-service

## Next Step
Phase 10 — Docker Compose.
Write docker-compose.yml that starts ALL services together:
PostgreSQL, MongoDB, Redis, RabbitMQ, all 6 microservices.
One command: docker-compose up → everything running.
This replaces manual startup of 7+ terminals.
Also adds Dockerfiles for each service.
First time the entire platform runs as a unified system.

---

# Day 17 — 26 July 2026

## Goal
Build Phase 10 — Docker Compose.
Containerize all services and run the entire platform
with a single command. Verify full end-to-end pipeline
works inside Docker containers.

## Work Completed

### docker-compose.yml (root of monorepo)
- Removed obsolete `version: '3.9'` attribute
- Defined private network: incident-platform (bridge driver)
- Defined named volumes: postgres-data, mongodb-data, redis-data
- Defined 4 infrastructure services:
  postgres:15 with healthcheck (pg_isready)
  mongo:7 with healthcheck (mongosh ping)
  redis:7-alpine with healthcheck (redis-cli ping)
  rabbitmq:3-management with healthcheck (rabbitmq-diagnostics ping)
- Defined 7 application services:
  auth-service, api-gateway, incident-service, log-service,
  ai-service, notification-service, web
- All services on incident-platform network
- depends_on with condition: service_healthy for databases
- Environment variables using ${VAR} from .env.docker

### .env.docker (root — not committed)
- Contains all secrets: JWT secrets, Google OAuth,
  Anthropic API key, Gmail credentials, Slack webhook
- Added to .gitignore — verified not committed
- docker-compose.yml references via ${VAR} syntax

### Dockerfiles created (7 total)

**services/auth-service-express/Dockerfile:**
FROM node:20-alpine
npm ci (all deps including TypeScript)
npm run build (compiles TypeScript)
npm prune --production (removes dev deps)
CMD node dist/server.js
Fixed: tsconfig.json exclude tests/ to prevent TS6059 error

**services/api-gateway-express/Dockerfile:**
Same pattern as auth-service
FROM node:20-alpine, npm ci, build, prune
CMD node dist/server.js

**services/incident-service/Dockerfile:**
Multi-stage build:
Stage 1 (build): maven:3.9-eclipse-temurin-17
  mvn dependency:go-offline
  mvn package -DskipTests
Stage 2 (runtime): eclipse-temurin:17-jre-alpine
  COPY --from=build app.jar
  CMD java -jar app.jar
Final image: 180MB instead of 500MB

**services/log-service-django/Dockerfile:**
FROM python:3.12-slim (changed from 3.11 — Django 6 requires 3.12)
pip install --no-cache-dir -r requirements.txt
CMD python manage.py runserver 0.0.0.0:3003

**services/ai-service-fastapi/Dockerfile:**
FROM python:3.12-slim
pip install --no-cache-dir -r requirements.txt
CMD uvicorn app.main:app --host 0.0.0.0 --port 3004

**services/notification-service-flask/Dockerfile:**
FROM python:3.11-slim
pip install --no-cache-dir -r requirements.txt
CMD python app.py

**apps/web-nextjs/Dockerfile:**
Multi-stage build:
Stage 1 (build): node:20-alpine, npm ci, npm run build
Stage 2 (runtime): node:20-alpine
  COPY .next, node_modules, package.json, public
  CMD npm start
Fixed: useSearchParams() wrapped in Suspense boundary
  Created AuthCallbackContent.tsx separate component
  page.tsx wraps it with <Suspense fallback={...}>

### .dockerignore files (7 total)
Node.js services: node_modules, dist, .env, .git, coverage
Python services: venv, __pycache__, *.pyc, .env, *.db, .git
Java service: target, .env, .git, *.md

### Build results
All 7 Docker images built successfully:
notification-service → 33.7s
log-service          → 43.3s (after fixing Python 3.11→3.12)
ai-service           → 60.0s
incident-service     → 135.4s (Maven multi-stage)
auth-service         → 75.4s (after fixing tsconfig exclude)
api-gateway          → 75.4s (built together with auth)
web                  → 159.1s (after fixing Suspense boundary)

### End-to-end test inside Docker — PASSED
docker-compose up -d → all 11 containers started
Health checks verified:
  localhost:3000/health → API Gateway healthy ✓
  localhost:3001/health → Auth Service healthy ✓
  localhost:3002/api/incidents/health → Incident healthy ✓
  localhost:3003/api/logs/health/ → Log Service healthy ✓
  localhost:3004/api/ai/health → AI Service healthy ✓
  localhost:3005/api/notify/health → Notification healthy ✓
  localhost:3006 → Next.js serving ✓

Full pipeline test:
curl POST /api/logs/ingest (CRITICAL)
→ Log Service saved to MongoDB ✓
→ Published critical.log.detected to RabbitMQ ✓
→ Incident Service auto-created incident ✓
→ Incident published incident.created ✓
→ Notification Service sent email ✓
→ Notification Service sent Slack ✓
→ Gmail received ✓
→ Slack received ✓

## What I Learned

### Why localhost breaks in Docker
Each container has its own isolated localhost.
AI Service calling http://localhost:3003 looks for Log Service
on its OWN localhost — nothing there → connection refused.
Docker Compose creates a private network where each container
is reachable by its service name:
http://log-service:3003 → Docker DNS resolves to container IP
All inter-service URLs use service names not localhost.
Environment variables handle this — no code changes needed.

### Docker Image vs Container
Image: blueprint/recipe, read-only, created by docker build
Container: running instance of image, created by docker run/up
Same image can run as many containers simultaneously.
Images stored locally, deployed to registries (AWS ECR, Docker Hub).

### Why Docker Compose
Without: 10 terminals, manual startup order, error-prone
With: docker-compose up → everything starts in correct order
      healthchecks ensure databases ready before services start
      One command for entire platform

### Volumes — data persistence
Without volumes: docker-compose down deletes all data
With named volumes: data persists between restarts
postgres-data, mongodb-data, redis-data defined in compose file
Production: use managed databases (AWS RDS, Atlas) instead

### Healthchecks and depends_on
healthcheck: runs a command to verify service is truly ready
depends_on with condition: service_healthy:
→ waits for healthcheck to pass before starting dependent service
→ prevents race conditions (app starting before DB is ready)
→ pg_isready, mongosh ping, redis-cli ping, rabbitmq-diagnostics

### Multi-stage Docker builds
Two FROM statements in one Dockerfile:
Stage 1 (build): large image with build tools
  Maven/JDK compiles Java → produces JAR
  Node.js builds TypeScript → produces dist/
Stage 2 (runtime): small image with only what runs
  Only the JAR or dist/ copied from build stage
  No Maven, no TypeScript compiler in final image
Result: much smaller final image (180MB vs 500MB for Java)
Smaller = faster deployment, less storage cost, smaller attack surface

### Docker layer caching
COPY package*.json ./   ← separate step
RUN npm ci              ← cached if package.json unchanged
COPY . .                ← only rebuilds when source changes
Saves minutes on each rebuild — npm ci only runs when needed

### npm ci vs npm install in Docker
npm install: updates package-lock.json, non-deterministic
npm ci: reads package-lock.json exactly, deterministic
Always use npm ci in Docker for reproducible builds

### npm prune --production
Removes devDependencies after building
TypeScript and ts-jest not needed at runtime
Reduces final image size significantly

### Why Redis included but not OpenSearch/pgvector
Redis: infrastructure ready for future features (rate limiting,
caching, error rate detection) — easy to add now
OpenSearch: requires dual-write code changes in Log Service
pgvector: requires PostgreSQL extension + AI Service changes
Both deferred to post-Phase-14 with code implementation

### Django 6 requires Python 3.12
Django 6.0.7 minimum Python version is 3.12
Dockerfile used python:3.11-slim → pip install failed
Fix: changed to python:3.12-slim
Always check framework Python version requirements

### TypeScript tests outside rootDir
tsconfig.json had rootDir: ./src but tests/ was being included
Docker build ran tsc which found tests/fixtures.ts outside rootDir
Fix: add "include": ["src/**/*"] to tsconfig.json
Excludes tests from production TypeScript compilation

### useSearchParams Suspense requirement
Next.js 16 requires useSearchParams() wrapped in Suspense
during static generation (production build)
Fix: extract component to AuthCallbackContent.tsx
Parent page.tsx wraps with <Suspense fallback={...}>
Works in development (lenient) but fails in production build

### Google OAuth in Docker
Auth Service needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
These were in local .env but not passed to Docker container
docker logs incident-auth revealed the error immediately
Fix: add to docker-compose.yml environment + .env.docker

### docker logs command
Shows container output same as terminal when running manually
Essential for debugging containers running in background (-d)
docker logs incident-auth → see auth service startup logs
docker logs incident-incidents → see Spring Boot logs

### Demo apps not in Docker Compose
Platform = services that process data (in Docker)
Demo apps = fake clients that USE the platform (run locally)
Demo apps point to localhost:3000 (API Gateway in Docker)
Works perfectly — no need to containerize the test clients

## Problems Faced
- version attribute obsolete warning in docker-compose.yml
- Log Service build failed: Django==6.0.7 requires Python >=3.12
- Auth/Gateway build failed: tsc not found (only prod deps installed)
- Auth/Gateway build failed: tests/fixtures.ts outside rootDir
- Web build failed: useSearchParams() needs Suspense boundary
- Auth Service failed: Google OAuth credentials not in docker-compose
- touch command failed for path with parentheses on Windows

## How I Solved Them
- Removed version: '3.9' from docker-compose.yml
- Changed FROM python:3.11-slim to python:3.12-slim
- Changed npm ci --only=production to npm ci (install all deps)
  Added npm prune --production after build
- Added "include": ["src/**/*"] to tsconfig.json
- Created AuthCallbackContent.tsx, wrapped in Suspense in page.tsx
- Added GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to compose + .env.docker
- Used quotes around path: touch "apps/.../AuthCallbackContent.tsx"
  Or created file directly in VS Code

## Final State

docker-compose --env-file .env.docker up -d
→ 11 containers running
→ 4 infrastructure (postgres, mongo, rabbitmq, redis)
→ 7 services (auth, gateway, incidents, logs, ai, notify, web)
→ Full pipeline verified end-to-end inside Docker
→ Email and Slack notifications received

## Commands Used
```bash
docker-compose --env-file .env.docker config
docker-compose --env-compose .env.docker up postgres mongodb rabbitmq redis -d
docker-compose --env-file .env.docker build notification-service
docker-compose --env-file .env.docker build log-service
docker-compose --env-file .env.docker build ai-service
docker-compose --env-file .env.docker build incident-service
docker-compose --env-file .env.docker build auth-service api-gateway
docker-compose --env-file .env.docker build web
docker-compose --env-file .env.docker up -d
docker-compose --env-file .env.docker up -d --no-deps auth-service
docker ps
docker logs incident-auth
docker logs incident-logs
docker logs incident-incidents
docker logs incident-notifications
docker-compose --env-file .env.docker down
git add .
git commit -m "feat(docker): add Docker Compose, Dockerfiles for all services"
git push origin feature/docker
```

## Git Branch
feature/docker

## Next Step
Phase 11 — Frontend completion.
Build the full dashboard that connects to all backend APIs:
/dashboard → overview stats, recent incidents
/incidents → list all incidents with filters
/incidents/:id → single incident with AI analysis and timeline
/logs → log viewer with search and filters
All pages connect to real APIs running in Docker.

---

# Day 18 — 27 July 2026

## Goal
Complete Phase 11 — Frontend completion.
Build all dashboard pages with real data, fix auth flows,
add form validation, OTP verification, session persistence.

## Work Completed

### Types and Hooks
**src/types/index.ts — added:**
Severity, IncidentStatus, LogLevel types
Incident, IncidentTimeline, AIAnalysis, Log,
PaginatedLogs, DashboardStats interfaces

**src/hooks/useIncidents.ts:**
useIncidents() — fetches all incidents, depends on isAuthenticated
useIncident(id) — fetches single incident + timeline
updateStatus() — PATCH /api/incidents/:id/status

**src/hooks/useLogs.ts:**
useLogs(filters) — fetches paginated logs with level/service filters
useServices() — fetches unique service names for filter dropdown

**src/hooks/useAIAnalysis.ts:**
useAIAnalysis(incidentId) — fetches AI analysis for incident
triggerAnalysis() — POST /api/ai/analyses/:id/trigger

### Dashboard pages

**src/app/(dashboard)/dashboard/page.tsx:**
Stats: Active Incidents, Critical Incidents, Resolved
Recent Incidents table with severity/status badges
Clickable rows → /incidents/:id
isAuthenticated dependency to prevent race condition

**src/app/(dashboard)/incidents/page.tsx:**
Filter by severity and status dropdowns
Incident list with title, service, badges, timestamp
Clickable rows → /incidents/:id

**src/app/(dashboard)/incidents/[id]/page.tsx:**
Left column: Details (service, created by, assigned to, description)
AI Analysis: root cause, confidence %, possible causes,
suggested actions, "Analyze with AI" button
Right column: Status update buttons (OPEN/INVESTIGATING/RESOLVED/CLOSED)
Timeline: chronological list of actions
Fixed: (analysis.possibleCauses || []) for undefined arrays

**src/app/(dashboard)/logs/page.tsx:**
Table: level badge, service, message, timestamp
Filter by level and service dropdowns
Pagination with previous/next buttons

**src/app/(dashboard)/settings/page.tsx:**
Organization ID with copy button
User info (name, email, role)
Quick Setup: code snippet pre-filled with organizationId
Copy code button
Notifications section

### Auth flow fixes

**Signup page improvements:**
Stronger password validation:
  min 8 chars, uppercase, number, special character
Real-time validation (mode: onChange)
Red/green border feedback on fields
Password show/hide toggle (Eye/EyeOff icons)
Redirect to /verify-email?email=... after signup
Fixed z.string().email() deprecation → regex refine

**Email verification OTP page (new file):**
src/app/(auth)/verify-email/page.tsx
6 individual digit input boxes
Auto-focus next box on input
Backspace moves to previous box
Paste support for full 6-digit code
POST /api/auth/verify-email
Resend code button → POST /api/auth/resend-verification
Wrapped in Suspense for useSearchParams

**Login page improvements:**
Password show/hide toggle
serverError state for invalid credentials
Both fields turn red on wrong credentials
Error message stays until next submit attempt
mode removed (validates on submit only)

**Forgot password page:**
Passes email as query param to reset password page
Shows email in "Check your email" confirmation

**Reset password page:**
Reads email from URL query param (pre-filled)
Password show/hide toggles on both password fields
Stronger password validation
Wrapped in Suspense for useSearchParams

**Google OAuth:**
Added http://localhost:3000/api/auth/google/callback
to Google Console authorized redirect URIs
OAuth flow working end to end

### Session persistence fix
src/app/(dashboard)/layout.tsx:
Added tryRefresh() on mount:
  → if isAuthenticated: skip
  → else: POST /api/auth/refresh (uses httpOnly cookie)
  → on success: setAccessToken + fetch user info
  → on failure: redirect to login
Added checking state → shows spinner while verifying
Fixes logout on page refresh

### Auth Service fixes

**services/auth-service-express/src/config/migrate.ts:**
Inline SQL schema (no file reading)
Tables: users, refresh_tokens,
email_verification_otps, password_reset_otps
Correct column: email_verified (not is_verified)
Runs on startup via server.ts → runMigrations()

**services/auth-service-express/src/server.ts:**
Added async start() function
Calls runMigrations() before app.listen()
process.exit(1) if migration fails

**services/auth-service-express/src/services/auth.service.ts:**
Fixed refresh token missing organizationId bug (line 151)
Added organizationId to refresh token JWT payload
Before: { userId, role }
After: { userId, role, organizationId }

**docker-compose.yml:**
Fixed auth-service environment:
Changed DATABASE_URL to separate:
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
Added GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
GOOGLE_CALLBACK_URL

### AuthCallbackContent.tsx (Phase 10 fix carried forward)
src/app/(auth)/auth/callback/AuthCallbackContent.tsx
Extracted from page.tsx for Suspense boundary
page.tsx wraps with <Suspense fallback={spinner}>

### Settings sidebar
Added Settings link to dashboard layout
import Settings from lucide-react
navItems includes /settings with Settings icon

## What I Learned

### Race condition — isAuthenticated dependency
Problem: Dashboard page mounts simultaneously with layout
Layout runs tryRefresh() async
Page immediately calls api.get('/api/incidents')
No token yet → 401 → empty result
tryRefresh() completes → token set → but page already rendered

Fix: Add isAuthenticated to useEffect dependency array
useEffect(() => {
    if (!isAuthenticated) return
    fetchIncidents()
}, [isAuthenticated])
→ Fetches only AFTER token is set → correct data

### Refresh token missing organizationId
Login → JWT has organizationId ✓
15 minutes → token expires
Refresh → new JWT missing organizationId ✗
Gateway → decoded.organizationId undefined → fallback 'default'
Incident Service → queries org 'default' → empty []
Fix: add organizationId to refresh JWT payload
This is a real production bug — only surfaces after 15 minutes

### Silent token refresh on page load
Access token in Zustand memory → lost on refresh
Refresh token in httpOnly cookie → survives refresh
Solution: on dashboard mount, try POST /api/auth/refresh
If cookie exists → get new access token → restore session
If not → redirect to login
Pattern used by: GitHub, Notion, Linear, every SaaS

### React-hook-form mode
mode: 'onChange' → validates on every keystroke
mode: 'onBlur' → validates when leaving field
mode: 'all' → validates on both
no mode → validates only on submit
Login: no mode (submit only) — simpler for login form
Signup: mode: 'onChange' — real-time feedback for password strength

### OTP input UX pattern
6 individual inputs instead of one text field
Better UX: auto-advance, backspace-navigate, paste support
Used by: Google, Apple, GitHub 2FA
useRef array for programmatic focus control
inputRefs.current[index + 1]?.focus()

### useSearchParams requires Suspense
Next.js 16 production build requirement
useSearchParams() must be in a component wrapped by Suspense
Fix: extract to XxxContent component
Parent page wraps with <Suspense fallback={...}>
Applies to: verify-email, reset-password, auth/callback

### Docker postgres auth service connection
AUTH Service uses: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
Not: DATABASE_URL (that is for other services)
docker exec incident-auth env | grep DATABASE
→ revealed correct env var but wrong variable name used
docker logs incident-auth → revealed connection refused error

### Schema migration inline SQL
CREATE TABLE IF NOT EXISTS — skips if table exists
Problem: old wrong table exists → migration skips → wrong columns
Fix: DROP TABLE first, then restart → migrations recreate correctly
Better approach: inline SQL in TypeScript → compiled into dist
No file reading → no ENOENT errors in Docker

### Multi-tenancy in practice
Every user gets organization_id = org_default currently
JWT contains organizationId
API Gateway extracts from JWT → x-organization-id header
Every service filters by organization_id
Full isolation works — demonstrated by querying different orgs
Organization registration (post-Phase-14) assigns unique IDs

### SDK integration across languages
Node.js: npm install @incidentai/sdk — 3 lines
Java: direct REST HTTP calls → future Maven SDK
Python: direct REST calls → future PyPI SDK
All follow same pattern: init once at entry, use everywhere
silent: true ensures SDK never crashes monitored app
Docker sidecar agent (post-Phase-14): zero code changes needed

## Problems Faced
- Port 3006 already in use (Docker web container running)
- Auth Service connecting to localhost:5432 in Docker
- Tables did not exist (migration not running)
- Wrong column name: is_verified instead of email_verified
- Missing tables: email_verification_otps, password_reset_otps
- Old wrong tables existed — CREATE TABLE IF NOT EXISTS skipped
- Schema.sql file not found in dist/ folder
- Incidents returning empty [] after token refresh
- Refresh token missing organizationId
- Logout on page refresh
- serverError disappearing too quickly on login
- useSearchParams without Suspense in production build

## How I Solved Them
- docker-compose stop web → run Next.js locally
- Changed DATABASE_URL to DB_HOST/PORT/NAME/USER/PASSWORD
- Created migrate.ts with inline SQL, called in server.ts
- Updated schema: email_verified column
- Added email_verification_otps and password_reset_otps tables
- docker exec psql DROP TABLE → restart → migration recreates
- Moved SQL inline in TypeScript → no file reading needed
- Added isAuthenticated dependency to all data fetch hooks
- Added organizationId to refresh token JWT sign
- Added tryRefresh() in dashboard layout useEffect
- Removed mode: 'onBlur', removed onChange clearing serverError
- Extracted AuthCallbackContent, verify-email, reset-password
  into separate components wrapped in Suspense

## Test Results

All auth flows verified end to end:
✓ Signup → OTP verification → login → dashboard
✓ Login with wrong credentials → red error stays
✓ Forgot password → OTP → reset → login
✓ Google OAuth → dashboard
✓ Page refresh → session persists
✓ Dashboard shows real incident data
✓ Incidents list with filters working
✓ Incident detail with AI analysis working
✓ Status update → timeline updates
✓ Logs page with filters working
✓ Settings page with copy buttons working

## Commands Used
```bash
docker-compose --env-file .env.docker up -d
docker-compose --env-file .env.docker stop web
docker-compose --env-file .env.docker build auth-service
docker-compose --env-file .env.docker up -d --no-deps auth-service
docker logs incident-auth --tail 20
docker exec incident-auth env | grep DATABASE
docker exec -it incident-postgres psql -U postgres -d incident_platform \
  -c "DROP TABLE IF EXISTS email_verification_tokens, \
      password_reset_tokens, refresh_tokens, users CASCADE;"
docker restart incident-auth
docker exec -it incident-postgres psql -U postgres -d incident_platform \
  -c "SELECT id, title, status FROM incidents;"
docker-compose --env-file .env.docker down
cd apps/web-nextjs
npm run dev
git add .
git commit -m "feat(frontend): complete Phase 11 — all auth flows, OTP verification, forgot/reset password, Google OAuth, dashboard, incidents, logs, settings, session persistence, refresh token fix"
git push origin feature/frontend
```

## Git Branch
feature/frontend

## Next Step
Phase 12 — Testing.
Write comprehensive test suite for all services.
Integration tests for full pipeline.
Frontend component tests.
CI/CD pipeline will run these tests automatically.
Gives confidence before deployment.

---

# Day 19 — 28 July 2026

## Goal
Begin Phase 12 — Comprehensive Testing.
Verify all existing tests pass across all services.
Fix RabbitMQ architecture bug discovered during testing.
Prepare foundation for integration tests next session.

## Work Completed

### RabbitMQ Architecture Fix (critical bug)
**Problem discovered:**
AI Service and Notification Service shared incident.created.queue.
RabbitMQ round-robin delivery → each message went to ONE consumer.
50% of incidents had no AI analysis, 50% had no notification.
Non-deterministic — hard to debug.

**Fix — separate queues per consumer:**
Added NOTIFICATION_INCIDENT_QUEUE to RabbitMQConfig.java
Added notificationIncidentBinding() to bind new queue
Updated Notification Service consumer.py to use notification.incident.queue
Added queue_bind() call to bind queue to exchange at runtime

**ADR-008 written:**
docs/adr/ADR-008-separate-rabbitmq-queues-per-consumer.md
Documents the pub/sub pattern decision and reasoning

### Consumer retry logic
Added retry loop to notification-service consumer.py:
retry_delay = 5 seconds
max_retries = 10 attempts
On connection failure → wait 5 seconds → retry
On connection drop mid-run → reconnects automatically
Prevents silent consumer death when RabbitMQ not ready at startup

### PYTHONUNBUFFERED fix
Added PYTHONUNBUFFERED: "1" to docker-compose.yml
for notification-service, log-service, ai-service
Python buffers output by default in Docker
Without this: print() statements not visible in docker logs
With this: every print() appears immediately

### Test verification — all 184 tests passing
Auth Service (96 tests):
  Fixed jest.config.js — updated globals syntax to transform syntax
  Created tsconfig.test.json with types: ["jest", "node"]
  Includes both src/**/* and tests/**/*
  All 96 tests passing, 100% coverage, zero warnings

API Gateway (12 tests): 12 passing ✓
Incident Service (26 tests): 26 passing, BUILD SUCCESS ✓
Log Service (20 tests): 20 passing ✓
AI Service (10 tests): 10 passing ✓
Notification Service (12 tests): 12 passing ✓
SDK (8 tests):
  Fixed tests/logger.test.ts — updated /api/logs/ to /api/logs/ingest
  Endpoint changed in Phase 7 but tests were never updated
  8 tests passing ✓

### Coverage files cleanup
Added coverage/ to .gitignore for:
  services/auth-service-express/
  services/api-gateway-express/
  packages/sdk/nodejs/
Untracked existing coverage files with git rm -r --cached
39 generated files removed from git tracking

## What I Learned

### Unit tests vs integration tests
Unit tests (what we have):
→ Mock all dependencies
→ Test one function in isolation
→ Fast — milliseconds each
→ No infrastructure needed
→ Cannot catch integration bugs

Integration tests (what we still need):
→ Real database, real network calls
→ Test full flow end to end
→ Slower — seconds each
→ Requires running infrastructure
→ Catches bugs unit tests miss
Example: refresh token missing organizationId bug
→ unit tests passed (mocked JWT)
→ only surfaced in real usage after 15 minutes

### Three challenges of integration tests
Challenge 1 — Test isolation:
Each test must use unique data or clean up after itself
Test A creates user@example.com
Test B tries to create user@example.com → conflict
Solution: unique email per test or clean DB between tests

Challenge 2 — Test ordering:
Some tests depend on previous state
test_login() needs user to exist
Solution: setup fixtures that create required data before test

Challenge 3 — Speed:
100 integration tests × 3 seconds = 5 minutes
Too slow for every code change
Solution: run unit tests always, integration tests on CI/CD only

### RabbitMQ pub/sub pattern
Wrong: one queue, multiple consumers → round-robin delivery
Right: one exchange, multiple queues, one consumer per queue
Exchange delivers copy to EVERY bound queue
Each service gets its own independent message stream
Adding new consumer = add new queue + binding
No changes to existing services needed

### PYTHONUNBUFFERED
Python buffers stdout by default:
print() → internal buffer → flushed when buffer full or process exits
In Docker: buffer never fills → logs appear only at container stop
PYTHONUNBUFFERED=1 → disables buffering → every print() immediate
Node.js: unbuffered by default
Java: uses logging framework that flushes immediately
Python: needs explicit PYTHONUNBUFFERED=1

### tsconfig.test.json pattern
Production tsconfig: rootDir = src, excludes tests
→ prevents tests from being compiled into dist/
→ Docker build uses this → correct
Test tsconfig: rootDir = ., includes tests/**/*
→ Jest uses this via jest.config.js transform setting
→ tests can import from src/, jest globals available
Two separate tsconfig files for two different purposes

### Coverage files in git
jest --coverage generates HTML, JSON, XML reports in coverage/
These are generated artifacts — never commit generated files
Add coverage/ to .gitignore
If already tracked: git rm -r --cached coverage/
→ removes from git tracking but keeps files on disk
Same principle: dist/, __pycache__/, target/, node_modules/
Never commit generated or compiled files

### SDK endpoint change
SDK sends to /api/logs/ingest (public, no JWT)
Tests expected /api/logs/ (old endpoint from Phase 5)
Changed in Phase 7 but tests not updated → 6 failures
Fix: update test assertions to match current implementation
Lesson: when changing an API endpoint, update tests immediately
sed -i 's|/api/logs/|/api/logs/ingest|g' tests/logger.test.ts

### Why separate test database
Integration tests write real data to real database
If using development database:
→ test data pollutes your development data
→ test cleanup might delete important development data
→ tests interfere with manual testing
Solution: use TEST_DATABASE_URL pointing to separate DB
Or: use Docker to spin up fresh database for tests
Incident Service already does this with H2 in-memory DB

## Problems Faced
- Auth service tests: Cannot find name 'jest' (TypeScript error)
- SDK tests: 6 failures — wrong endpoint /api/logs/ vs /api/logs/ingest
- 39 coverage files showing in git staging area
- Notification Service not receiving RabbitMQ events
- Consumer dying silently when RabbitMQ not ready
- Python logs not visible in docker logs

## How I Solved Them
- Created tsconfig.test.json, updated jest.config.js transform syntax
- Updated SDK tests: sed replace /api/logs/ → /api/logs/ingest
- Added coverage/ to .gitignore, git rm -r --cached to untrack
- Discovered round-robin bug: separate queues per consumer
- Added retry loop with 10 attempts and 5 second delay
- Added PYTHONUNBUFFERED=1 to docker-compose.yml environment

## Test Results

Before Phase 12 fixes:
Auth Service: TypeScript errors — cannot find jest/describe/it
SDK: 6 tests failing — wrong endpoint

After Phase 12 fixes:
Auth Service: 96 tests passing, 100% coverage ✓
API Gateway: 12 tests passing ✓
Incident Service: 26 tests passing ✓
Log Service: 20 tests passing ✓
AI Service: 10 tests passing ✓
Notification: 12 tests passing ✓
SDK: 8 tests passing ✓
Total: 184 tests passing ✓

## Commands Used
```bash
cd services/auth-service-express && npm test
cd services/api-gateway-express && npm test
cd services/incident-service && ./mvnw test
cd services/log-service-django && python manage.py test
cd services/ai-service-fastapi && pytest tests/ -v
cd services/notification-service-flask && pytest tests/ -v
cd packages/sdk/nodejs && npm test
sed -i 's|/api/logs/|/api/logs/ingest|g' packages/sdk/nodejs/tests/logger.test.ts
echo "coverage/" >> services/auth-service-express/.gitignore
echo "coverage/" >> services/api-gateway-express/.gitignore
echo "coverage/" >> packages/sdk/nodejs/.gitignore
git rm -r --cached services/auth-service-express/coverage/
git rm -r --cached services/api-gateway-express/coverage/
git rm -r --cached packages/sdk/nodejs/coverage/
docker-compose --env-file .env.docker build notification-service incident-service
docker-compose --env-file .env.docker down
docker-compose --env-file .env.docker up -d
docker logs incident-notifications
curl -X POST http://localhost:3000/api/logs/ingest \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: org_default" \
  -d '{"level":"CRITICAL","message":"Pipeline test","service_name":"payment-service"}'
git add .
git commit -m "fix(tests): fix jest config, update SDK tests, remove coverage from git tracking"
git commit -m "fix(rabbitmq): separate queues per consumer, retry logic, PYTHONUNBUFFERED"
git push origin feature/testing
```

## Git Branch
feature/testing

## Next Step
Phase 12 continues — Integration Tests.
Write integration tests for:
1. Auth Service — real HTTP calls, real database
   signup → verify email → login → refresh token flow
2. API Gateway — JWT forwarding, organizationId header
3. Pipeline integration test
   CRITICAL log → incident in PostgreSQL → notification triggered
4. End-to-end test script for pre-deployment verification
