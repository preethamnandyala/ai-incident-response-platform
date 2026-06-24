# ADR-004: Email Verification Design

## Status
Accepted

## Date
4 June 2026

## Context
Phase 1b requires email verification so users confirm they own
the email address they signed up with. We need to decide:
1. Whether email_verification_otps should share storage with
   password_reset_otps
2. Whether signup() should directly trigger OTP sending internally
3. Whether unverified users should be blocked from logging in

## Decision
1. Use a SEPARATE email_verification_otps table, distinct from
   password_reset_otps
2. signup() remains unchanged — does not internally call any
   email verification logic. A new EmailVerificationService
   handles sending and verifying OTPs independently. The
   controller layer sequences signup() followed by
   sendVerificationOTP() as two separate calls.
3. Users CAN log in before verifying their email. A
   emailVerified flag is added to the user record. Enforcement
   of restricting unverified users from specific actions is
   deferred — not built in this phase.

## Reason
Separate OTP tables prevent one flow's OTP request from deleting
or interfering with another flow's active OTP for the same user
(discovered via tracing a concrete bug scenario where a password
reset request would silently delete a pending email verification
OTP under a shared-table design).

Keeping signup() unchanged maintains the same separation of
concerns established in ADR-003 — AuthService should not depend
on EmailVerificationService internally, coupling two independently
testable services. The controller layer is the correct place to
sequence multiple service calls for one HTTP request.

Allowing login before verification avoids locking users out
entirely if they don't receive the email immediately, matching
common real-world platform behavior (e.g. GitHub). Full enforcement
is deferred since it requires modifying authenticateJWT and is not
needed for the core flow to function and be testable.

## Tradeoffs
Slight duplication of OTP-related table structure and logic
between password_reset_otps and email_verification_otps. Accepted
because the alternative (shared storage) creates a more severe bug
risk. Deferring login restriction means unverified users have full
access for now — acceptable since this is a learning project and
restriction can be added later without breaking existing structure.

## Alternatives considered
Shared OTP table for both purposes — rejected due to the concrete
race/overwrite bug it introduces. signup() directly calling email
verification internally — rejected as it couples two services that
should remain independent, same reasoning as ADR-003.

## Known SRP Tension and Future Resolution

AuthController.signup() currently calls both authService.signup()
and emailVerificationService.sendVerificationOTP() sequentially.
This gives the controller two reasons to change (auth logic
changes, OR email verification flow changes), a minor tension
with Single Responsibility Principle.

This is accepted as a pragmatic intermediate pattern. The proper
fix is event-driven architecture (Observer pattern): AuthService
would publish a "user.created" event after signup;
EmailVerificationService would subscribe to that event and react
independently, removing the direct dependency from AuthController
entirely.

This will be implemented in Phase 6 when RabbitMQ is introduced.
At that point, AuthController.signup() will be simplified back to
calling only authService.signup() — the event publish/subscribe
mechanism will handle triggering verification OTP generation
without the controller needing to know EmailVerificationService
exists.

Until Phase 6, the direct coupling in AuthController is the
deliberate, documented tradeoff.