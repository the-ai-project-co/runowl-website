# Phase 2b — Platform & Management (Website)

## Status: UI Complete / Backend Integration Pending

All UI and frontend logic is shipped. Backend wiring (Stripe, real RBAC, real usage data) is pending.

---

## What's Built

### App Shell & Navigation
- Collapsible sidebar with three sections: Workspace, Configure, Admin
- Section state persisted to localStorage
- Notification bell with unread badge and dropdown panel
- Onboarding checklist card (3 steps, progress bar, dismissable)
- Dark / light theme toggle persisted to localStorage
- Responsive layout for smaller screens

### Authentication
- Supabase Auth: email/password + GitHub OAuth
- Sign up, sign in, password reset flows
- Session management via Supabase SSR middleware
- API authentication middleware (`locals.safeGetSession()`)

### PR Review Page (`/app/review`)
- PR URL input with validation and error states
- Private repo detection — amber banner + inline "Connect GitHub →" prompt
- Skeleton loading states while PR data loads
- File browser panel (changed files with added/modified/deleted badges)
- Diff viewer with syntax-highlighted patch hunks and line numbers
- Text selection within diffs (captures line context for Q&A)
- Code highlighting when clicking on citations

### Chat Panel
- Four tabs: Code Review, Flags, Bugs, Tests
- **Code Review**: chat input, message display, SSE streaming, conversation history
- **Flags**: informational/investigation findings with severity indicators
- **Bugs**: critical findings (P0/P1) with fix suggestions
- **Tests**: "Generate & run tests" CTA with animated progress and re-run button
- AI follow-up suggestion chips (4 chips, context-aware, rotate on refresh)

### Test Suite Management (`/app/suites`)
- Suite list page — cards with status, pass/fail counts, progress bar
- Suite detail page (`/app/suites/[id]`) — per-test results, run log terminal, animated execution
- Create suite modal (name + repo)
- Simulated test run with step-by-step animation

### Team Management (`/app/team`)
- Member list with role pills and status badges
- Member invite modal (email + role selector)
- Role-based sidebar section visibility (Admin / Configure / Workspace)

### Analytics Dashboard (`/app/analytics`)
- Activity area chart (date range filter: 7d / 30d / 90d)
- Findings distribution donut chart
- Top repos bar chart
- Regression detection badges
- Gated behind `UpgradeGate` for free users

### GitHub Private Repository Integration (`/app/integrations`)
- Full integration management hub
- GitHub App connection flow (5-step modal wizard)
- PAT fallback connection flow
- Connected repo list with remove/confirm controls
- Org-level installation nudge banner
- `githubIntegration` store with localStorage persistence
- Inline private-repo detection banner on review page
- Modal auto-triggers on 403/404, review restarts after connect

### Settings
- Settings hub (`/app/settings`) — links to all sub-pages
- Billing page (`/app/settings/billing`) — plan cards, usage meters, invoice history, upgrade modal
- Notifications page (`/app/settings/notifications`) — per-type toggles
- Custom Rules page (`/app/settings/rules`) — add/remove/enable regex rules with severity
- SSO/SAML page (`/app/settings/sso`) — provider selector, metadata URL fields, ACS URL display
- Profile page (`/app/profile`) — account info, password change, danger zone

### Report Downloads
- Markdown, JSON, PDF (via browser print) from PR Summary panel

### CI / Demo Mode
- `USE_MOCK_DATA=true` flag bypasses Supabase and Python backend entirely
- All API routes return seed data from `src/lib/server/seed.ts`

---

## Pending (Backend Integration)

| Feature | Status |
|---|---|
| Stripe payment integration | Pending |
| Real subscription tier enforcement | Pending |
| Real usage tracking from database | Pending |
| Full RBAC enforcement server-side | Pending |
| Organization/workspace creation flow | Pending |
| Workspace switching (multi-org users) | Pending |
| GitHub App OAuth token exchange (server-side) | Pending |
| Real test execution history from backend | Pending |
| SSO/SAML backend integration | Pending |
| Audit log system | Pending |

---

## Component Inventory

| Component | Path | Description |
|---|---|---|
| `PRLoader` | `src/lib/components/app/PRLoader.svelte` | PR URL input, load flow, private repo detection |
| `DiffViewer` | `src/lib/components/app/DiffViewer.svelte` | Syntax-highlighted diff with file browser |
| `ChatPanel` | `src/lib/components/app/ChatPanel.svelte` | Tabbed chat (Review, Flags, Bugs, Tests) |
| `PrivateRepoModal` | `src/lib/components/app/PrivateRepoModal.svelte` | 5-step GitHub connect wizard |
| `UpgradeGate` | `src/lib/components/app/UpgradeGate.svelte` | Feature gate card + compact lock badge |

## Store Inventory

| Store | Path | Description |
|---|---|---|
| `reviewStore` | `src/lib/stores/review.svelte.ts` | PR loading and review state |
| `githubIntegration` | `src/lib/stores/github-integration.svelte.ts` | GitHub connection state machine |
| `privateRepoModal` | `src/lib/stores/private-repo-modal.svelte.ts` | Modal show/hide with callback |
