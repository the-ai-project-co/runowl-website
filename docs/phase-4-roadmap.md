# Phase 4 — Integrations & Scale (Roadmap)

## Goal

Expand platform reach and third-party ecosystem. Business tier and above.

---

## Milestone 4.1: Communication Integrations

- Slack notifications (review complete, bugs found, tests failed)
- Linear issue creation from findings (with severity mapping)
- Jira issue creation from findings

## Milestone 4.2: VCS Platform Expansion

### UI Complete
- GitHub private repository access — GitHub App OAuth + PAT fallback
- Integrations page (`/app/integrations`) with full connection management hub
- Multi-step connect wizard modal (method select → OAuth/PAT → repo picker → success)
- Connected repo list with per-repo remove/confirm controls
- Org-level installation nudge banner
- Inline private-repo prompt on review page (amber banner + modal trigger)
- localStorage persistence of connection state

### Backend Pending
- GitHub App backend OAuth flow (server-side token exchange)
- GitLab MR support (webhook + API)
- Bitbucket PR support (webhook + API)
- Unified VCS abstraction layer

## Milestone 4.3: Multi-Model Support

- Abstract AI provider interface
- Add Claude integration
- Add GPT-4 integration
- Model selection per workspace/review

## Milestone 4.4: Custom Rules & Analytics

### UI Complete
- Custom rules page (`/app/settings/rules`) — add/remove/enable regex rules with severity
- Analytics dashboard page (`/app/analytics`) — activity chart, findings distribution, top repos, date range filter

### Backend Pending
- Rule engine backend (apply custom rules during review)
- Historical data aggregation from real database

## Milestone 4.5: API & Monorepo

- Public REST API design and documentation
- API key management
- Rate limiting and usage tracking
- Monorepo detection and scoped reviews per package/service
