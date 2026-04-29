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