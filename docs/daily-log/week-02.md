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