# RunOwl Website — Architecture

## Stack

- **Framework**: SvelteKit 5 with Svelte runes (`$state`, `$derived`, `$effect`, `$props`)
- **Auth**: Supabase Auth — email + GitHub OAuth, SSR middleware
- **Database**: Supabase (Postgres)
- **Styling**: Plain CSS with custom design tokens
- **Icons**: lucide-svelte
- **Deployment**: Vercel

## Design Tokens

All colours and surfaces use CSS custom properties:

```css
var(--surface)      /* card / panel background */
var(--accent)       /* primary brand colour */
var(--border)       /* border colour */
var(--muted)        /* secondary text */
var(--green)        /* success states */
var(--red)          /* error / critical states */
var(--yellow)       /* warning states */
```

## Directory Structure

```
src/
├── lib/
│   ├── components/
│   │   └── app/           # Reusable app components
│   │       ├── PRLoader.svelte
│   │       ├── DiffViewer.svelte
│   │       ├── ChatPanel.svelte
│   │       ├── PrivateRepoModal.svelte
│   │       └── UpgradeGate.svelte
│   ├── stores/            # Svelte 5 singleton stores
│   │   ├── review.svelte.ts
│   │   ├── github-integration.svelte.ts
│   │   └── private-repo-modal.svelte.ts
│   └── server/
│       └── seed.ts        # Mock data for CI/demo mode
├── routes/
│   ├── app/               # Authenticated app shell
│   │   ├── +layout.svelte # Sidebar + nav
│   │   ├── review/        # PR review page
│   │   ├── suites/        # Test suite management
│   │   │   └── [id]/      # Suite detail page
│   │   ├── team/          # Team management
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── integrations/  # GitHub + third-party integrations
│   │   ├── profile/       # User profile
│   │   └── settings/      # Settings hub
│   │       ├── billing/
│   │       ├── notifications/
│   │       ├── rules/
│   │       └── sso/
│   └── api/               # SvelteKit API routes (BFF layer)
│       ├── pr/load/       # Load PR metadata from GitHub
│       ├── pr/file/       # Fetch file contents
│       ├── review/
│       │   ├── run/       # Trigger code review
│       │   ├── ask/       # Q&A (SSE streaming)
│       │   └── results/[jobId]/
│       ├── reviews/       # List/save past reviews
│       ├── tests/suites/  # Test suite data
│       └── team/          # Members + invite
```

## Store Pattern

All global state uses the Svelte 5 singleton store pattern — a factory function returning an object with `$state` fields and `$derived` getters:

```ts
function createStore() {
  let _field = $state(initialValue);
  return {
    get field() { return _field; },
    set field(v) { _field = v; },
    action() { /* mutate state */ }
  };
}
export const myStore = createStore();
```

## API Layer (Backend for Frontend)

All API routes in `src/routes/api/` act as a proxy layer between the SvelteKit frontend and the Python FastAPI backend. Each route:

1. Checks the `USE_MOCK_DATA` environment variable
2. Returns mock seed data if `true` (CI/demo mode)
3. Otherwise proxies the request to `RUNOWL_BACKEND_URL`

## Mock / Demo Mode

Set `USE_MOCK_DATA=true` in `.env.local` to run the full app offline without Supabase or the Python backend. All API routes will return mock data from `src/lib/server/seed.ts`.

```env
USE_MOCK_DATA=true
RUNOWL_BACKEND_URL=http://localhost:8000
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Authentication Flow

1. User visits `/app/*` route
2. SvelteKit SSR middleware (`src/hooks.server.ts`) calls `locals.safeGetSession()`
3. If no valid session → redirect to `/login`
4. Session token attached to all API route requests via Supabase SSR client

## Streaming (SSE)

The Q&A endpoint (`POST /api/review/ask`) returns a `ReadableStream` for server-sent events. The frontend `ChatPanel` reads this stream and appends tokens to the message as they arrive, giving a real-time typing effect.

## Sidebar State

The app layout sidebar uses localStorage to persist collapsed/expanded state per section (Workspace, Configure, Admin). State is read **synchronously** at `$state` initialization — not in a `$effect` — to avoid reactive re-trigger loops.

## Private Repository Integration

GitHub private repo access is managed by a client-side state machine (`src/lib/stores/github-integration.svelte.ts`) with steps:

```
idle → selecting_method → oauth_pending → select_repos → done
                       ↘ pat_entry ↗
```

The `PrivateRepoModal` component renders the appropriate UI for each step. An `onConnected` callback allows the modal to be triggered from any page (review page, integrations page) with different post-connect behavior.
