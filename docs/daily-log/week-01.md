# Week 01 — Daily Log

---

# Day 1 — 28 April 2026

## Goal
Complete Phase 0 — set up the full monorepo structure, README,
PR template, .gitignore, ADR, and first pull request.

## Work Completed
- Created GitHub repository
- Built full monorepo folder structure from terminal using mkdir -p
- Wrote .gitignore and understood why .env files must never be committed
- Wrote README with service table and build phases checklist
- Created PR template in .github/pull_request_template.md
- Created ADR-001 — documented the decision to use a monorepo
- Created project-status.md
- Created feature/project-bootstrap branch
- Pushed branch to GitHub and opened first Pull Request into develop
- Did self-review, caught and fixed placeholder text in PR description
- Merged PR into develop
- Learned what every folder in the monorepo means and why it exists

## What I Learned

### Pull Requests
A Pull Request is not just merging code. It is a request for the codebase
to pull your changes in after review. The review step is a gate that
protects the main codebase from broken or unreviewed code. GitHub
automatically loads a template from .github/pull_request_template.md
on every PR you open.

### Why we use a monorepo
One repo for all services means one place to manage code, docs, and config.
As a solo developer learning multiple technologies simultaneously, this
reduces cognitive overhead. The tradeoff is the repo grows large over time.
In companies with large teams, polyrepo (one repo per service) is more common
because it gives teams full ownership and independence.

### What each folder means
- apps/ — frontend applications that users see and interact with
- services/ — the backend services that make up the platform itself
- demo-apps/ — fake applications that USE the platform by sending logs
- packages/ — shared code reused across multiple services
- infra/ — Docker, Kubernetes, Terraform, Nginx, monitoring configs
- docs/ — architecture decisions, daily logs, API contracts, design docs
- .github/ — GitHub Actions workflows and PR templates

### Key distinction
services/ IS the product.
demo-apps/ USES the product.
These are separated because they serve completely different purposes.

### Git concepts
- Local branches only exist on your machine until you push them
- git push -u origin branch-name sends the branch to GitHub
- The staging area exists so you can control exactly what goes into
  each commit — not everything you changed, just what belongs together
- Git history is permanent. Deleting a file does not remove it from history.
  This is why .env files must never be committed even once.

### Branch strategy
- main — production ready code only
- develop — active development, features collect here
- feature/* — one specific feature at a time, branches off develop

### Conventional commits
Format: type(scope): description
- chore — setup or config work
- feat — new feature
- fix — bug fix
- docs — documentation
- test — tests
- ci — pipeline changes
Lowercase, present tense, explains what it does not what you did.

## Problems Faced
- Could not see feature branch on GitHub after creating it locally
- PR description still had placeholder text when first submitted

## How I Solved Them
- Learned that local branches must be explicitly pushed with
  git push -u origin branch-name before GitHub can see them
- Edited PR description after submission using the pencil icon on GitHub
- Learned to always review your own PR before submitting, not after

## Commands Used
```bash
mkdir -p [folder]        # create folder and parents in one command
touch [file]             # create empty file
git init                 # initialize git in current folder
git remote add origin    # connect local repo to GitHub
git add .                # stage all changes
git status               # see what is staged and what is not
git commit -m "message"  # save snapshot with a message
git push -u origin       # push branch to GitHub and set upstream
git checkout -b [branch] # create and switch to new branch
git checkout [branch]    # switch to existing branch
git pull origin [branch] # bring remote changes to local machine
```

## Git Branch
feature/project-bootstrap

## Commits Made
- chore(repo): initialize AI incident platform monorepo
- docs(decisions): add ADR-001 monorepo decision
- docs(daily-log): add day 1 session log
- docs(status): update project status after phase 0

## PR
feature/project-bootstrap → develop
Status: Merged

## Next Step
Phase 1 — Begin Auth Service.
Understand what authentication is and why it exists.
Understand JWT, password hashing, bcrypt, and refresh tokens.
Set up auth service folder structure.
Write the first test before the first line of production code.


# Day 2 — 29 April 2026

## Important Decision
Repository integration tests are intentionally postponed until Phase 10
when Docker is set up. Unit tests mock the repository layer. Integration
tests require a real PostgreSQL instance which we will run in a Docker
container to ensure consistency across all environments including CI/CD.

---

# Day 2 — 29 April 2026

## Goal
Begin Phase 1a — Auth Service setup. Understand authentication, JWT,
password hashing, refresh tokens, XSS, CSRF, and write the first
tested service function using TDD.

## Work Completed
- Set up package.json with all production and dev dependencies
- Configured tsconfig.json for TypeScript compilation
- Configured jest.config.js for test coverage and TypeScript support
- Created database config with PostgreSQL connection pool
- Created UserRepository with findByEmail and create methods
- Created AuthService with signup function
- Wrote three test cases using TDD before writing service code
- Completed full red → green → refactor cycle
- Refactored magic strings to UserRole enum
- Created UserRole enum in src/types/index.ts
- All three tests passing with 100% coverage on auth.service.ts

## What I Learned
- TDD red green refactor cycle — write test first, watch it fail,
  write minimum code to pass, then refactor
- What mocking is and why it exists — replace real dependencies
  with fake versions so unit tests run without a real database
- The rule for mocking: always mock what the thing you are testing
  depends on, never mock the thing you are testing itself
- Why TypeScript interfaces disappear at runtime — they are type
  definitions only, compiled away to nothing in JavaScript
- The bootstrap problem — to create an admin you need an admin,
  solved by a seed script that creates the first admin on deployment
- Why throw stops execution — all lines after a throw never run,
  which is why Test 2 does not cover the password hashing line
- Why enums are safer than plain strings — typos cause compile
  errors instead of silent runtime bugs
- What parameterized queries are — passing values separately from
  SQL prevents SQL injection attacks completely
- What a connection pool is — reuses database connections instead
  of opening a new one for every query, much more efficient
- Why bcrypt salt rounds cannot be set too high — more rounds means
  slower hashing which protects against attackers but also slows
  down legitimate users, 10 rounds is the industry standard balance

## Problems Faced
- Tests failed with "Cannot find name 'describe'" and similar errors
- Coverage warning: functions coverage below 70% threshold

## How I Solved Them
- Added "types": ["jest", "node"] to tsconfig.json and included
  tests folder in TypeScript compilation scope
- Excluded repositories and config from coverage collection because
  repositories are mocked in unit tests and tested separately
  with integration tests in Phase 10 when Docker is set up

## Security Rules Learned
- Never concatenate user input into SQL queries, always use
  parameterized queries to prevent SQL injection
- Never return passwordHash to callers, explicitly construct
  return objects field by field
- Public signup endpoint always assigns lowest privilege role,
  higher roles granted by admins only
- Never hardcode secrets, always use environment variables

## Commands Used
```bash
npm init -y
npm install express jsonwebtoken bcryptjs dotenv cors helmet express-validator pg
npm install --save-dev typescript ts-node-dev @types/express @types/jsonwebtoken @types/bcryptjs @types/cors @types/pg jest ts-jest supertest @types/supertest @types/jest
npx tsc --init
npm test
```

## Git Branch
feature/auth-service-setup

## Commits Made
- docs(decisions): add ADR-002 auth service phase split
- feat(auth): add signup service with TDD and UserRepository

## Next Step
Phase 1a continues — build and test the login function.
Understand how login differs from signup, how we verify
passwords with bcrypt compare, and how we generate and
return JWT access and refresh tokens.

---

# Day 3 — 31 May 2026

## Goal
Complete Phase 1a service layer — build and test login, logout,
refresh, and me functions using TDD.

## Work Completed
- Added login service with bcrypt password verification
- Added JWT access token generation with environment config
- Added refresh token generation and database storage
- Added logout service with refresh token deletion
- Added refresh service with JWT verification and database lookup
- Added me service returning user profile without passwordHash
- Added findById, findRefreshToken, deleteRefreshToken to UserRepository
- Updated UserRecord interface to include passwordHash for login
- Added column aliasing in SQL queries for camelCase compatibility
- Created env.ts config file for centralised environment variable access
- Updated database.ts to use env.ts instead of process.env directly
- Added .env file with JWT secrets, database config, and port
- Added .env.example with empty values for other developers
- Written 14 tests covering all functions with 100% coverage
- Added edge case test — user deleted but refresh token still valid
- Completed full red green refactor cycle for all five functions

## What I Learned

### Salt in bcrypt
A salt is a random value added to each password before hashing.
Without salt, two users with the same password get the same hash.
With salt, every hash is unique even for identical passwords.
The salt is embedded inside the hash itself so bcrypt.compare
can extract it automatically during password verification.
Salt makes rainbow table attacks impossible.

### User enumeration attacks
Never return different error messages for different failure scenarios.
Login returns "Invalid email or password" for both wrong email AND
wrong password. This prevents attackers from discovering which
emails exist in the system by observing error messages.
Same principle applies to refresh token errors.

### Why middleware extracts userId not the request body
The me endpoint receives userId from the JWT token via middleware,
not from req.body. If userId came from the request body, anyone
could send any userId and access any account. The JWT middleware
extracts and verifies the userId from the signed token, proving
the user is who they claim to be.

### Why service layer does not set HTTP-only cookies
Service layer has no knowledge of HTTP. It just returns data.
The controller layer receives the refresh token from the service
and sets it as an HTTP-only cookie on the HTTP response.
Clean separation — service handles business logic,
controller handles HTTP concerns.

### Why refresh function needs both JWT verification and database lookup
JWT verification alone is not enough because a logged out token
could still have a valid signature. Database lookup alone is not
enough because anyone could insert a fake token. Both together
provide complete verification — JWT proves we issued the token,
database proves it was not revoked.

### Column aliasing in PostgreSQL queries
PostgreSQL uses snake_case column names (password_hash, created_at)
but TypeScript uses camelCase (passwordHash, createdAt).
Using AS in SELECT queries maps database names to TypeScript names:
SELECT password_hash as "passwordHash"
Without aliasing, user.passwordHash returns undefined silently.

### Why bcrypt hashing is the most important security decision
If the database is stolen, attackers get hashes not passwords.
Hashes cannot be reversed. Salt prevents rainbow table attacks.
10 rounds makes brute force attacks take years.
Developer privacy — even developers cannot see user passwords.
Everything else protects the session. Hashing protects identity.

### Scheduled cleanup for expired tokens
Expired refresh tokens accumulate in the database over time.
The solution is a scheduled cleanup job running nightly:
DELETE FROM refresh_tokens WHERE expires_at < NOW()
We implement this in Phase 13 monitoring and maintenance.

## Problems Faced
- bcrypt.compare returned false in login test because mock used
  a fake hash string instead of a real bcrypt hash
- Line 142 not covered — user deleted but refresh token still valid
  edge case was missing from tests

## How I Solved Them
- Generated a real bcrypt hash inside the test using bcrypt.hash()
  so bcrypt.compare has a genuine hash to verify against
- Added a fourth refresh test covering the user deleted edge case
  bringing coverage back to 100% on all metrics

## Security Rules Learned
- Never return specific error messages that reveal which check failed
- Password hashing is the foundation of all auth security
- Both JWT verification AND database lookup required for refresh
- Service layer must never handle HTTP concerns like cookies
- Expired tokens need scheduled cleanup not immediate deletion

## Commands Used
```bash
npm test
git add .
git commit -m "feat(auth): add logout, refresh, and me service methods"
git push origin feature/auth-service-setup
```

## Git Branch
feature/auth-service-setup

## Commits Made
- feat(auth): add login service with JWT generation and refresh token
- feat(auth): add logout, refresh, and me service methods with full test coverage

## Test Coverage
- 14 tests passing
- 100% statements
- 100% branches
- 100% functions
- 100% lines

## Next Step
Phase 1a continues — build validators layer.
Enforce password strength rules, email format validation,
name validation, and input sanitization against XSS.
Password policy: minimum 8 characters, uppercase, lowercase,
number, special character, no more than 2 consecutive repeating
characters, cannot contain name or email.


---

# Day 4 — 1 June 2026

## Goal
Build validators layer for signup and login, then begin controllers
layer starting with signup controller, using TDD throughout.

## Work Completed
- Created validateSignup and validateLogin validators using express-validator
- Implemented name validation: required, length, letters/spaces/hyphens/apostrophes
- Implemented email validation: required, valid format, normalized to lowercase
- Implemented password validation: length, uppercase, lowercase, number,
  special character, no more than 2 consecutive repeating characters
- Created shared password.utils.ts with PASSWORD_REGEX and
  hasRepeatingCharacters for reuse in future password reset
- Wrote 13 validator tests covering valid and invalid cases for both
  signup and login, including edge cases like apostrophes in names
  and special characters beyond the basic set
- Created custom error classes — AppError, ConflictError,
  UnauthorizedError, NotFoundError, BadRequestError — each carrying
  an HTTP status code
- Refactored auth.service.ts to throw custom error classes instead
  of plain Error objects
- Created AuthController with constructor-injected AuthService
- Built signup controller method with try/catch error handling
  mapping AppError instances to correct status codes and unknown
  errors to 500
- Wrote 3 controller tests mocking AuthService, req, and res
- All 30 tests passing across 3 test suites with 100% coverage

## What I Learned

### bail() in express-validator
bail() stops running further validation rules on a field once one
rule fails. Without it, a single invalid field produces multiple
error messages stacked together. With bail(), one field produces
one clear error message.

### Regex lookaheads for password validation
(?=.*[A-Z]) is a lookahead — it checks if an uppercase letter exists
anywhere in the string without consuming characters. Multiple
lookaheads combined let one regex check multiple independent
conditions on the same string.

### Repeating character detection
/(.)\1\1/ uses a capture group (.) and backreferences \1 to detect
any character repeated three times in a row, used to reject
passwords like "Seeecure1!"

### HTTP status codes — precise meanings
200 OK - success
201 Created - new resource created (signup)
400 Bad Request - invalid input from client
401 Unauthorized - identity not proven (wrong password, invalid token)
403 Forbidden - identity proven but action not permitted
404 Not Found - resource does not exist
409 Conflict - request conflicts with existing data (duplicate email)
500 Internal Server Error - unexpected server-side failure

### Custom error classes with status codes
AppError extends Error and adds a statusCode property. Subclasses
like ConflictError(409) and UnauthorizedError(401) let the service
layer throw meaningful errors that the controller can map directly
to HTTP responses using error.statusCode, instead of checking
error message strings everywhere.

### Object.setPrototypeOf and the prototype chain
The prototype chain is the sequence of linked objects JavaScript
searches through to find properties and methods. instanceof checks
whether a class's prototype exists in that chain. Extending the
built-in Error class in TypeScript can break this chain during
compilation, so Object.setPrototypeOf(this, AppError.prototype)
manually repairs it, guaranteeing instanceof AppError works
correctly in the error handler.

### Dependency injection in controllers
A controller that creates its own service instance internally
(const authService = new AuthService(...) at module level) can
never have that dependency replaced in a test — it is locked inside
the file. A controller that receives its dependency through the
constructor allows tests to pass in a mocked version completely.
The real instances are wired together in one place — app.ts —
called the composition root.

### Mocked class vs mocked instance
jest.mock() replaces an entire class including its constructor.
new MockedClass(anything) returns a mock instance regardless of
constructor arguments, because the real constructor never runs.
mockClass.prototype.methodName.mockResolvedValue() configures what
that mocked method returns for any instance created from it.

### Mocking res.status().json() method chaining
res.status(201).json(data) is method chaining. To mock this,
statusMock is a jest.fn() that returns { json: jsonMock }, so
calling statusMock(201) returns an object with a json method,
and .json(data) calls jsonMock(data). Both can then be asserted on.

### expect.objectContaining
Used to assert that a returned object contains specific key-value
pairs without requiring an exact match of every field, useful when
the full object has many fields but only some matter for the test.

## Problems Faced
- Confused about why module-level service instantiation in
  auth.controller.ts breaks testability
- Confused about difference between mockUserRepository (the class)
  and new UserRepository() (an instance) and why AuthService
  constructor requires the instance not the class

## How I Solved Them
- Used restaurant/chef analogy — a chef with his own locked supply
  closet cannot be tested with fake ingredients, but a chef handed
  a tray of ingredients can be tested with anything handed to him
- Clarified that AuthService constructor type is UserRepository
  (an instance type), so mockUserRepository (typeof UserRepository,
  the class) cannot be passed directly — only new UserRepository()
  produces a value of the correct instance type, while
  mockUserRepository.prototype is used separately to configure
  mock method return values

## Security Rules Learned
- Never expose internal error details (database errors, stack traces)
  to clients — always fall back to generic 500 for unknown errors
- Map specific known errors (AppError subclasses) to specific status
  codes, everything else becomes "Internal server error"

## Test Coverage

30 tests passing

3 test suites

100% statements, branches, functions, lines

## Commands Used
```bash
npm test
git add .
git commit -m "feat(auth): add signup and login validators with shared password rules"
git commit -m "refactor(auth): use custom error classes with status codes"
git commit -m "feat(auth): add signup controller with constructor injection and custom errors"
git push origin feature/auth-service-setup
```

## Git Branch
feature/auth-service-setup

## Commits Made
- feat(auth): add signup and login validators with shared password rules
- refactor(auth): use custom error classes with status codes
- feat(auth): add signup controller with constructor injection and custom errors

## Next Step
Phase 1a continues — build remaining controller methods:
login, logout, refresh, me. Each follows the same pattern as
signup controller. Then build routes layer, JWT middleware,
and finally app.ts and server.ts to wire everything together
and run the auth service for the first time.


---

# Day 5 — 2 June 2026

## Goal
Complete Phase 1a — build remaining controllers (login, logout,
refresh, me), middleware layer, routes layer, app.ts and server.ts.
Run the auth service for the first time.

## Work Completed
- Built login controller with HTTP-only cookie for refresh token
- Built logout controller with res.clearCookie
- Built refresh controller reading token from req.cookies
- Built me controller reading userId from req.user set by middleware
- Built validateRequest middleware — checks validation errors,
  sends 400 if found, calls next() if clean
- Built authenticateJWT middleware — reads Authorization header,
  verifies JWT signature and expiry, attaches decoded payload
  to req.user, sends 401 if token missing, invalid, or expired
- Built auth routes file mapping all 5 endpoints to controllers
  with validators and middleware in correct order
- Built app.ts configuring helmet, cors, cookie-parser,
  express.json, health check endpoint, routes, global error handler
- Built server.ts starting the HTTP server on port 3001
- Installed cookie-parser and @types/cookie-parser
- 47 tests passing across 4 test suites with 100% coverage
- Server running successfully — health check responding
- Validation working correctly in live server test
- 500 returned correctly when PostgreSQL not available (expected)

## What I Learned

### Why arrow function wrapper is needed in routes
Passing a class method directly to Express detaches it from its
instance, making `this` undefined inside the method. An arrow
function wrapper preserves the context by calling the method
as authController.signup(req, res) — a proper method call on
the object, not a standalone function call.

### The three-parameter middleware vs four-parameter error handler
Regular middleware: (req, res, next) → handles requests
Error handler: (err, req, res, next) → Express identifies it by
the four-parameter signature and routes unhandled errors there

### validateRequest — why return after res.json()
If return is missing, execution continues after sending a 400
response and calls next(), which proceeds to the controller.
The controller sends another response. Express throws:
"Cannot set headers after they are sent to the client"
Always return immediately after sending any response in middleware.

### authenticateJWT middleware flow
Reads Authorization header → checks Bearer format → extracts
token → jwt.verify checks signature AND expiry simultaneously →
attaches decoded payload to req.user → calls next()
If any check fails → returns 401 immediately, controller never runs

### (req as any).user?.userId explained
Express Request type has no user property by default.
(req as any) bypasses TypeScript's type check temporarily.
?.userId uses optional chaining — safely returns undefined
if user is not attached instead of crashing with TypeError.
Will be properly typed when we extend the Request interface.

### Why app.ts and server.ts are separate files
app.ts creates and configures Express without starting it.
server.ts imports app and starts listening on a port.
Separation allows integration tests to import app directly
via supertest without starting a real server, preventing
port conflicts and making tests faster and more reliable.

### What app.ts configures and why each piece matters
helmet()        → 12 security headers on every response
cors()          → allows frontend origin to make requests,
                  credentials:true allows cookies cross-origin
express.json()  → parses JSON request bodies into req.body
cookieParser()  → parses Cookie header into req.cookies
/health         → endpoint for Docker, Kubernetes, monitoring
/api/auth       → mounts auth router at this prefix

### Cookie parsing
Without cookie-parser middleware, req.cookies is always undefined.
Our logout and refresh controllers read req.cookies.refreshToken —
without this middleware they would always receive undefined and
the service layer would throw BadRequestError every time.

### Optional chaining ?.
obj?.property → returns undefined if obj is null or undefined
                instead of throwing TypeError
Safe to use when a value might not exist yet

## Problems Faced
- TypeScript strict mode rejected implicit any types on arrow
  function parameters in routes file
- Copy-paste formatting issue with terminal commands causing
  [200~curl errors

## How I Solved Them
- Added explicit Request and Response types to every arrow
  function parameter in auth.routes.ts
- Typed commands manually instead of copy-pasting

## Security Rules Learned
- JWT middleware must check BOTH signature validity AND expiry —
  jwt.verify does both simultaneously and throws if either fails
- Never expose which JWT check failed — same 401 message for
  expired, tampered, and missing tokens
- Health check endpoint needs no authentication — it only
  proves the service is alive, contains no sensitive data
- Global error handler catches unexpected errors and returns
  generic 500 — never expose stack traces or internal details

## Test Coverage

47 tests passing

4 test suites

100% statements, branches, functions, lines

## Commands Used
```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
npm run dev
curl http://localhost:3001/health
npm test
git add .
git commit -m "feat(auth): add logout, refresh, and me controllers with full test coverage"
git commit -m "feat(auth): add routes, JWT middleware, and validateRequest middleware"
git commit -m "feat(auth): add app.ts and server.ts, auth service fully wired"
git push origin feature/auth-service-setup
```

## Git Branch
feature/auth-service-setup

## Commits Made
- feat(auth): add logout, refresh, and me controllers with full test coverage
- feat(auth): add routes, JWT middleware, and validateRequest middleware  
- feat(auth): add app.ts and server.ts, auth service fully wired

## Next Step
Phase 1b — Password management.
Build forgot password, reset password, change password,
email verification, and resend verification email.
These build on top of the Phase 1a foundation —
users must exist before passwords can be reset.
Email sending will be a placeholder until Phase 9
when the notification service is built.