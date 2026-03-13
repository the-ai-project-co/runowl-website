# RunOwl — Product Overview

## What is RunOwl?

RunOwl is an AI agent that reviews code, generates tests, and runs them before merge. It catches bugs, security vulnerabilities, and design issues in pull requests — before they reach production.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12+ (FastAPI 0.135.1) |
| AI Model | Gemini (google-genai SDK) |
| Sandbox | Deno 2.x (safe code execution) |
| Web App | SvelteKit 5 (Svelte runes) |
| Auth | Supabase Auth (email + GitHub OAuth) |
| CLI | Node.js (TypeScript, `npx runowl`) |

## Pricing Tiers

| Tier | Price | What's Included |
|---|---|---|
| Free | $0 | Surface security checks, code review, Q&A, webhook, 10 PRs/month |
| Team | $29/seat/mo | Deep OWASP analysis, SOLID/architecture checks, GitHub Check Runs, unlimited PRs, up to 20 seats |
| Business | $79/seat/mo | SSO/SAML, custom review rules, audit logs, compliance reports, unlimited seats |
| Enterprise | Custom | Self-hosted, SCIM provisioning, air-gapped environments |

## Target Audience

1. Small engineering teams (5–20 developers)
2. Mid-market companies (20–100 developers)
3. Open-source maintainers (always supported via free tier)

## Key Features

### Free Tier
- AI-powered PR code review with recursive reasoning
- Interactive Q&A on PR diffs
- Severity-classified findings (P0 critical → P3 low)
- Surface-level security analysis (hardcoded secrets, injection patterns, missing auth checks)
- CLI tool (`npx runowl`)
- GitHub PR integration (trigger on PR open, post results as comments)
- Private repository support (GitHub App OAuth + PAT fallback)

### Team Tier
- Deep security vulnerability detection (full OWASP checklist — XSS, SQL injection, JWT, crypto, race conditions, supply chain)
- SOLID / architecture analysis (design patterns, code smells, god objects, dependency inversion)
- GitHub Check Runs API integration
- Test generation and execution (sandboxed + browser)
- Team management (member list, invite flow, role-based access)
- Analytics dashboard (activity trends, findings distribution, top repos)
- Custom review rules

### Business Tier
- SSO / SAML authentication (Okta, Azure AD, Google Workspace, custom IdP)
- Audit logs and compliance reporting
- Priority support

### Enterprise
- On-premises / self-hosted deployment (Helm + Docker Compose)
- SCIM provisioning
- Air-gapped environment support
- Multi-environment support (prod, staging, dev)

## Phase Status

| Phase | Status |
|---|---|
| Phase 1 — AI Code Review | ✅ Complete |
| Phase 2a — Testing Engine | ✅ Complete (backend) |
| Phase 2b — Platform & Management | ✅ UI Complete / Backend in progress |
| Phase 3 — Intelligence & Ecosystem | Planned |
| Phase 4 — Integrations & Scale | Planned |
| Phase 5 — Enterprise | Planned |
