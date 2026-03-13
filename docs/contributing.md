# RunOwl Website — Contributing & Dev Setup

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
cd runowl-website
npm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

### Required Variables

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Optional Variables

```env
# Set to true to run fully offline without Supabase or Python backend
USE_MOCK_DATA=true

# URL of the Python FastAPI backend (only needed when USE_MOCK_DATA=false)
RUNOWL_BACKEND_URL=http://localhost:8000
```

## Running Locally

### With mock data (no backend needed)

```bash
USE_MOCK_DATA=true npm run dev
```

This bypasses Supabase auth and the Python backend entirely. All API routes return seed data from `src/lib/server/seed.ts`. You can log in with any email/password combination in mock mode.

### With real backend

1. Start the Python backend: `cd runowl && uv run uvicorn main:app --reload`
2. Set up Supabase project and add credentials to `.env.local`
3. `npm run dev`

## Type Checking

```bash
npm run check
```

## Linting

```bash
npm run lint
```

## Building

```bash
npm run build
```

## Project Conventions

### Svelte 5 Runes

All components and stores use Svelte 5 runes syntax:

- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects (use sparingly — only for DOM interactions, not for state sync)
- `$props()` for component props

### Store Pattern

Global stores live in `src/lib/stores/`. Each is a singleton factory:

```ts
function createMyStore() {
  let _value = $state(initialValue);
  return {
    get value() { return _value; },
    doSomething() { _value = newValue; }
  };
}
export const myStore = createMyStore();
```

### localStorage and $effect

**Do not** read from localStorage inside a `$effect` that also writes to reactive state — this creates an infinite re-trigger loop. Instead, read localStorage synchronously at `$state` initialization:

```ts
// CORRECT
let sectionOpen = $state(loadFromLocalStorage());

// WRONG — causes infinite loop
let sectionOpen = $state(defaults);
$effect(() => {
  const saved = localStorage.getItem(key);
  sectionOpen = { ...sectionOpen, ...JSON.parse(saved) }; // re-triggers $effect
});
```

### API Routes

All API routes in `src/routes/api/` must:

1. Check `USE_MOCK_DATA` first and return mock data if set
2. Validate auth session via `locals.safeGetSession()`
3. Proxy to `RUNOWL_BACKEND_URL` for real data

### Mock Data

Add mock data to `src/lib/server/seed.ts`. Export named constants for each data type. Import in the relevant API routes.

### CSS

Use design tokens (`var(--accent)`, `var(--surface)`, etc.) rather than hardcoded colours. Component styles are scoped — no global CSS classes except in `app.css`.

## Adding a New Page

1. Create route directory: `src/routes/app/my-page/`
2. Create `+page.svelte`
3. Add link to sidebar in `src/routes/app/+layout.svelte` if needed
4. Add mock data to `src/lib/server/seed.ts` if needed
5. Create API route in `src/routes/api/` if needed

## Adding a New Settings Sub-page

1. Create `src/routes/app/settings/my-setting/+page.svelte`
2. Add entry to the settings cards array in `src/routes/app/settings/+page.svelte`
3. Set `ready: true` and `href: '/app/settings/my-setting'`
