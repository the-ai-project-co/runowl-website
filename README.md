# RunOwl Website

Marketing site and documentation for [RunOwl](https://github.com/the-ai-project-co/runowl) — built with SvelteKit, Tailwind v4, and deployed on Vercel.

---

## Stack

| Tool | Version | Purpose |
|---|---|---|
| SvelteKit | 2.x | Framework |
| Svelte | 5.x | UI (runes API) |
| Tailwind CSS | 4.x | Styling |
| TypeScript | 5.x | Types |
| Vite | 6.x | Build tool |
| `@sveltejs/adapter-vercel` | latest | Deployment |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open in browser
npm run dev -- --open
```

---

## Build

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Project Structure

```
runowl-website/
├── src/
│   ├── app.css                        # Global styles + custom CSS classes
│   ├── app.html                       # HTML shell
│   ├── lib/
│   │   ├── assets/                    # favicon.svg
│   │   ├── components/
│   │   │   ├── Nav.svelte             # Top navigation bar
│   │   │   ├── Hero.svelte            # Hero section
│   │   │   ├── Features.svelte        # Features grid
│   │   │   ├── HowItWorks.svelte      # Step-by-step explanation
│   │   │   ├── QADemo.svelte          # Interactive Q&A demo
│   │   │   ├── GitHubIntegration.svelte
│   │   │   ├── Pricing.svelte         # Pricing tiers
│   │   │   ├── CTA.svelte             # Call to action
│   │   │   ├── Footer.svelte
│   │   │   ├── Marquee.svelte         # Scrolling logo strip
│   │   │   └── docs/
│   │   │       ├── DocsLayout.svelte  # Docs shell (sidebar + content)
│   │   │       └── DocsSidebar.svelte # Docs navigation sidebar
│   │   ├── stores/
│   │   │   └── theme.ts               # Dark / light mode store
│   │   └── index.ts
│   └── routes/
│       ├── +layout.svelte             # Root layout (Nav + theme)
│       ├── +layout.ts                 # prerender = true
│       ├── +page.svelte               # Homepage
│       └── docs/
│           ├── +layout.ts             # prerender = true
│           ├── +page.svelte           # Redirect → /docs/getting-started
│           ├── getting-started/
│           ├── cli-reference/
│           ├── github-integration/
│           ├── how-it-works/
│           ├── security-analysis/
│           ├── configuration/
│           ├── self-hosting/
│           └── api-reference/
├── static/
│   ├── favicon.svg
│   ├── robots.txt
│   └── .nojekyll
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
└── vercel.json
```

---

## Docs Pages

| Route | Description |
|---|---|
| `/docs/getting-started` | Installation, quick start, first review |
| `/docs/cli-reference` | All CLI flags and commands |
| `/docs/github-integration` | Webhook setup, GitHub App, Check Runs |
| `/docs/how-it-works` | RLM architecture, Deno sandbox, Gemini |
| `/docs/security-analysis` | Surface and deep security checks |
| `/docs/configuration` | All environment variables |
| `/docs/self-hosting` | Docker, systemd, nginx, SSL |
| `/docs/api-reference` | REST API endpoints |

---

## Deployment

Deployed automatically to Vercel on push to `main`. The `vercel.json` configures SvelteKit's Vercel adapter.

```bash
# Manual deploy (requires Vercel CLI)
npx vercel --prod
```

---

## Notes

- **Tailwind v4 layout:** `mx-auto` in Tailwind v4 generates `max-width` via container queries rather than `margin: auto`. All section centering uses the custom `.section-wrap` CSS class defined in `app.css` instead of Tailwind utilities.
- **Svelte 5 runes:** Components use `$props()` instead of `export let`.
- **Prerendering:** All routes use `export const prerender = true` — the site is fully static.
- **Dark mode:** Toggled via a class on `<html>`, persisted in `localStorage` via `theme.ts`.
