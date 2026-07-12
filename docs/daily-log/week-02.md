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

