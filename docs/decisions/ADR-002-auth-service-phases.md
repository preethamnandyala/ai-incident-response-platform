# ADR-002: Auth Service Split Into Three Phases

## Status
Accepted

## Date
29 April 2026

## Context
The auth service has three distinct areas of responsibility:
core authentication, password management, and third party OAuth login.
Building all three simultaneously would create too much complexity
for one phase and slow down learning.

## Decision
Split Phase 1 into three sub-phases:
- Phase 1a: Core auth (signup, login, logout, refresh, me)
- Phase 1b: Password management (forgot password, reset, email verification)
- Phase 1c: OAuth (Google login minimum)

## Reason
Each sub-phase builds on the previous one. Core auth creates
the user in the database. Password management needs the user
to exist first. OAuth still issues our own JWT after verification
so it needs the core JWT system to exist first.

## Tradeoffs
Slower to get full auth feature complete. But each sub-phase
is fully functional and testable on its own. Learning depth
is maintained because we never try to understand too many
new concepts simultaneously.

## Alternatives considered
Build everything in one phase. Rejected because OAuth alone
adds significant complexity around callback URLs, token exchange,
and edge cases like duplicate emails across auth methods.