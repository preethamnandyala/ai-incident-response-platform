# ADR-003: Separate PasswordService from AuthService

## Status
Accepted

## Date
3 June 2026

## Context
Phase 1b adds forgot password, reset password, change password,
and email verification. Adding all of these to AuthService would
grow it from 5 methods to 10+, mixing token/session management
with password lifecycle management.

## Decision
Create a separate PasswordService for password and email
verification related functionality. AuthService remains focused
on signup, login, logout, refresh, and identity (me).

## Reason
Single Responsibility Principle — AuthService's job is proving
identity and managing sessions. PasswordService's job is managing
the password lifecycle. These change for different reasons and
should be separated.

## Tradeoffs
More files to navigate. Some shared dependencies (UserRepository,
bcrypt hashing patterns) duplicated conceptually across two services.
Acceptable tradeoff for clearer separation of concerns as the
auth service grows toward production complexity.

## Alternatives considered
Keep everything in AuthService. Rejected because it would create
a god class handling too many unrelated responsibilities, making
the service harder to test and maintain as it grows.