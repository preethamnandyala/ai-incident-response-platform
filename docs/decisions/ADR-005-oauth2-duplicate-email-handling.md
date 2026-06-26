# ADR-005: OAuth2 Duplicate Email Handling

## Status
Accepted

## Date
5 June 2026

## Context
When a user attempts to sign in with Google using an email address
that already exists in our database from a previous email+password
signup, we must decide how to handle the conflict.

## Decision
Auto-link the Google account to the existing account ONLY if the
existing account has emailVerified = true. If emailVerified = false,
reject the OAuth login with a clear message asking the user to
verify their email first.

## Reason
Auto-linking without verification enables account takeover:
an attacker who creates a Google account with someone else's
email could gain access to their platform account without knowing
their password. Requiring emailVerified = true as a precondition
for linking means the legitimate account owner has already proven
they own that email address, making the link safe to perform
automatically without requiring a password re-entry.

## Tradeoffs
Users who signed up but never verified their email cannot use
Google login until they verify. This is an acceptable UX friction
since unverified accounts represent incomplete signups anyway.

## Alternatives considered
Never auto-link — rejected as poor UX for the common legitimate case.
Always auto-link — rejected due to account takeover risk described above.
Require password to confirm before linking — rejected as adding too
much friction for what should be a seamless flow.

## Known Security Consideration — Federated Identity Risk

OAuth2 delegates identity verification to Google. If a user's
Google account is compromised, an attacker could access their
platform account. This is an accepted tradeoff — Google's security
infrastructure (2FA, suspicious login detection, breach monitoring)
is more robust than what we can build ourselves.

Full mitigation would include: suspicious login detection, login
notifications, ability to revoke OAuth connections, and 2FA for
sensitive actions. These are out of scope for Phase 1c but
represent legitimate future security improvements.