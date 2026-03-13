# Phase 2b — Platform & Management (Website)

## Status: Complete ✅

UI and real backend API wiring are fully shipped. Only Stripe payment integration and server-side workspace-switch persistence remain as intentional future stubs.

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
- Suite list page — cards with status, pass/fail counts, progress bar; fetches from `GET /api/tests/suites`
- Suite detail page (`/app/suites/[id]`) — per-test results with framework/type chips, run log terminal, animated execution
- Create suite modal (name + repo)
- Video player component per-test when `video_url` present
- Session replay panel per-test when `replay_url` present
- Loading skeletons and error states on all views
- Run suite triggers `POST /api/tests/run` then polls `GET /api/tests/results`

### Team Management (`/app/team`)
- Member list with role pills, status badges, reviews count, joined date
- Member invite modal (email + role selector: Reviewer / Viewer)
- Role change dropdown per member with optimistic UI (reverts on failure)
- Remove member with optimistic UI (reverts on failure)
- Error banner with retry button; empty state when no members
- All data from `GET /api/team/members` — no hardcoded demo data
- Invite calls `POST /api/team/invite`; role change calls `PATCH /api/team/role`; remove calls `DELETE /api/team/remove`

### Workspace Management (`/app/settings/workspace`)
- List all workspaces (owned + member) from `GET /api/workspace`
- Switch button sets active workspace in localStorage
- Create workspace modal — name input + auto-generated slug (overridable)
- Create calls `POST /api/workspace`; slug validated as lowercase alphanumeric/hyphens
- Loading skeletons, error banner, empty state

### Analytics Dashboard (`/app/analytics`)
- Activity area chart — PRs reviewed per day, date range selector (7d / 30d / 90d)
- Findings distribution donut chart with legend and inline bars
- Top repos bar chart (up to 5 repos)
- Summary stat cards: Total Reviews, Findings Caught, Avg Findings/PR, High Severity
- Regression detection badges (Improving / Slight uptick / Regressing)
- All data from `GET /api/reviews?range=` — no seeded/fake data; refetches on range change
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
- Settings hub (`/app/settings`) — links to all sub-pages including Workspaces
- Billing page (`/app/settings/billing`) — plan cards, usage meters, invoice history, upgrade modal; fetches from `GET /api/billing` + `GET /api/billing/usage`
- Workspaces page (`/app/settings/workspace`) — list + switch + create
- Notifications page (`/app/settings/notifications`) — per-type toggles
- Custom Rules page (`/app/settings/rules`) — add/remove/enable regex rules with severity
- SSO/SAML page (`/app/settings/sso`) — provider selector, metadata URL fields, ACS URL display (UI stub)
- Profile page (`/app/profile`) — account info, password change, danger zone

### Report Downloads
- Markdown, JSON, PDF (via browser print) from PR Summary panel

### CI / Demo Mode
- `USE_MOCK_DATA=true` flag bypasses Supabase and Python backend entirely
- All API routes return seed data from `src/lib/server/seed.ts`

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/pr/load` | GET | Load PR metadata from GitHub |
| `/api/pr/file` | GET | Fetch file contents |
| `/api/review/run` | POST | Trigger code review |
| `/api/review/ask` | POST | Q&A with SSE streaming |
| `/api/review/results/[jobId]` | GET | Poll review job results |
| `/api/reviews` | GET | List past reviews; `?range=7d\|30d\|90d` |
| `/api/reviews` | POST | Save a completed review |
| `/api/team/members` | GET | List team members |
| `/api/team/invite` | POST | Invite member (admin/owner only) |
| `/api/team/role` | PATCH | Change member role (admin/owner only) |
| `/api/team/remove` | DELETE | Remove member (admin/owner only) |
| `/api/workspace` | GET | List workspaces (owned + member) |
| `/api/workspace` | POST | Create workspace |
| `/api/billing` | GET | Current plan + invoice history |
| `/api/billing/usage` | GET | PR count + seat count vs plan limits |
| `/api/tests/suites` | GET | List test suites |
| `/api/tests/run` | POST | Trigger suite run |
| `/api/tests/results` | GET | Poll test results for a suite |

---

## RBAC Enforcement

All team management mutations enforce role-based access control server-side:

- **Owner**: user who owns the workspace (no row in `team_members`) — full access
- **Admin**: `team_members.role = 'admin'` — can invite, change roles, remove members
- **Reviewer / Viewer**: cannot mutate team membership

Routes that enforce this: `POST /api/team/invite`, `PATCH /api/team/role`, `DELETE /api/team/remove`

---

## Remaining Stubs (Intentional)

| Feature | Status |
|---|---|
| Stripe payment integration | UI stub only — upgrade flow and plan cards complete |
| Workspace switching server-side persistence | localStorage only — session/cookie persistence deferred |
| GitHub App OAuth token exchange (server-side) | UI complete — backend token exchange deferred |
| SSO/SAML backend integration | UI complete — backend integration Phase 5 |
| Audit log system | UI stub — backend Phase 5 |

---

## Component Inventory

| Component | Path | Description |
|---|---|---|
| `PRLoader` | `src/lib/components/app/PRLoader.svelte` | PR URL input, load flow, private repo detection |
| `DiffViewer` | `src/lib/components/app/DiffViewer.svelte` | Syntax-highlighted diff with file browser |
| `ChatPanel` | `src/lib/components/app/ChatPanel.svelte` | Tabbed chat (Review, Flags, Bugs, Tests) |
| `PrivateRepoModal` | `src/lib/components/app/PrivateRepoModal.svelte` | 5-step GitHub connect wizard |
| `UpgradeGate` | `src/lib/components/app/UpgradeGate.svelte` | Feature gate card + compact lock badge |
| `VideoPlayer` | `src/lib/components/app/VideoPlayer.svelte` | Per-test video playback |
| `NotificationBell` | `src/lib/components/app/NotificationBell.svelte` | Bell icon with unread badge + dropdown |

## Store Inventory

| Store | Path | Description |
|---|---|---|
| `reviewStore` | `src/lib/stores/review.svelte.ts` | PR loading and review state |
| `githubIntegration` | `src/lib/stores/github-integration.svelte.ts` | GitHub connection state machine |
| `privateRepoModal` | `src/lib/stores/private-repo-modal.svelte.ts` | Modal show/hide with callback |
| `upgradeStore` | `src/lib/stores/upgrade.svelte.ts` | Plan tier and feature access checks |
