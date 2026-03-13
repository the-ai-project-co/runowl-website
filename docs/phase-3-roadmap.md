# Phase 3 — Intelligence & Ecosystem (Roadmap)

## Goal

Make RunOwl composable and smarter over time. Deeper AI capabilities, CI/CD integration, and richer reporting.

---

## Milestone 3.1: Agent / Skill Integration

- Build SKILL.md definition for RunOwl
- Package as installable skill (`npx skills add runowl`)
- Test integration with Claude, Cursor, Codex
- Document skill usage and capabilities

## Milestone 3.2: CI/CD Output

- Structured JSON output schema for pipeline consumption
- Markdown report generation
- GitHub Actions marketplace action
- Exit codes for CI pass/fail gates

## Milestone 3.3: Reporting

### UI Complete
- Report download in PR Summary panel (Markdown, JSON, PDF via browser print)
- Analytics page: activity area chart, findings donut, top repos bar chart, date range filter (7d/30d/90d), regression badges

### Backend Pending
- Real-time reporting dashboard connected to live backend
- Screenshot capture during test execution
- Log aggregation and display
- Exportable reports (PDF, HTML)

## Milestone 3.4: Follow-up Suggestions

### UI Complete
- AI suggestion chips in chat panel (4 chips, context-aware, rotate on refresh)

### Backend Pending
- Backend suggestion engine (lightweight sub-model, server-side generation)

## Milestone 3.5: Regression Detection (Team+)

- Track findings across PRs over time
- Detect recurring patterns and repeat bugs
- Build regression trend dashboard
- Alert on regression spikes
