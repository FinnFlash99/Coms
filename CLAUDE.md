# Coms

A unified inbox that aggregates messages from all platforms into one place. At a glance, the user knows the status of everything.

## Quick Reference

| Resource | Location |
|----------|----------|
| Documentation | [`docs/README.md`](docs/README.md) |
| Product specification | [`docs/reference/product-specification.md`](docs/reference/product-specification.md) |
| Design prototype | `design/Coms.dc.html` (open in browser) |
| Design system | [`docs/reference/design-system.md`](docs/reference/design-system.md) |
| Architecture | [`docs/explanation/architecture.md`](docs/explanation/architecture.md) |

## Project Context

**Problem:** App-switching anxiety — no single place shows the status of all communications.

**Solution:** One place to see every message across platforms with instant status visibility.

**Primary User:** Freelancers managing multiple clients across Slack, Email, WhatsApp, etc.

**Status:** Active development. SvelteKit application with Cloudflare Pages deployment.

## Git Workflow

Single-developer repo (just Finn) — commit and push directly to `main`. Do not create feature branches or PRs unless explicitly asked.

## Handling a Claude Design handoff

When given a new Claude Design file/export (a `.dc.html` bundle, a "design handoff" ZIP, etc.), the job is narrow:

1. Sync it into `design/` (per "Claude Design Integration" above), fixing any references broken by the sync (renamed `_ds/` UUID, etc.).
2. Make sure the repo still compiles clean — `npm run lint`, `npm run check`, `npm run build` all pass.
3. Commit and push to `main`.

Do **not** treat a design handoff as a request to implement the design in `src/`, build new functionality, or otherwise expand scope — and do not stop to ask the user about scope/next-steps for that. If they want the design implemented in app code, or anything beyond sync-and-deploy, they'll ask for it explicitly.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run check

# Linting
npm run lint

# Format code
npm run format

# Database migrations (local)
npm run db:migrate:local

# Database migrations (production)
npm run db:migrate:remote
```

## Claude Design Integration

Claude Design is connected directly to this GitHub repo (`FinnFlash99/Coms`). Design changes commit automatically.

**How it works:**
- Claude Design exports to `design/` folder
- `design/styles.css` is a stable entry point that imports the design system
- The app imports `$design/styles.css` directly — no manual copy/sync needed

**If the design system folder changes** (new UUID in `_ds/nocturne-*/`):
1. Update the import path in `design/styles.css`

## Project Structure

```
Finn-Comms/
├── design/                   # Claude Design exports (auto-committed)
│   ├── Coms.dc.html          # Interactive prototype
│   ├── styles.css            # Stable entry point for app imports
│   └── _ds/nocturne-*/       # Design system (CSS, components)
├── docs/                     # Documentation (Diátaxis structure)
│   ├── tutorials/            # Learning-oriented
│   ├── how-to/               # Task-oriented
│   ├── reference/            # Technical specifications
│   └── explanation/          # Concepts and decisions
├── migrations/               # D1 database migrations
├── scripts/                  # Automation scripts
├── src/                      # Application source code
│   ├── app.html              # HTML template
│   ├── app.css               # Global styles (imports $design/styles.css)
│   ├── app.d.ts              # TypeScript declarations
│   ├── lib/                  # Shared library code
│   │   ├── components/       # Svelte components
│   │   ├── stores/           # Svelte stores (state management)
│   │   ├── server/           # Server-side utilities
│   │   └── types/            # TypeScript types
│   └── routes/               # SvelteKit routes
│       ├── +layout.svelte    # Root layout
│       ├── +page.svelte      # Home (inbox)
│       ├── conversation/     # Conversation detail
│       ├── settings/         # Settings page
│       └── api/              # API endpoints
├── static/                   # Static assets
├── .github/workflows/        # CI/CD pipelines
├── wrangler.toml             # Cloudflare Workers config
├── svelte.config.js          # SvelteKit config
└── package.json              # Dependencies and scripts
```

## Architecture

**Stack:**
- **Frontend:** SvelteKit 5 with TypeScript
- **Backend:** Cloudflare Pages (edge functions)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare KV (sessions, OAuth state)
- **Deployment:** Cloudflare Pages (auto-deploy from GitHub)

**Key Patterns:**
- Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactivity
- Server-side code in `src/lib/server/` (not bundled for client)
- API routes in `src/routes/api/`
- Component library in `src/lib/components/`

## Design System: Nocturne

Quiet, compact dark interface — near-neutral blue-grey ground with a blurple accent.

- **Accent:** `#9184d9`
- **Typography:** Inter (headings and body), heading weight capped at 500
- **Style:** 8px radii, outlined (never filled) primary buttons, tonal ramps
- **Icons:** Phosphor
- **Components:** Button, Tag, Field/Input, SegmentedControl, Card, Nav, Table, Dialog

See: [`design/_ds/nocturne-*/readme.md`](design/_ds/nocturne-91aaaa64-e109-471d-96ce-af374af8888d/readme.md)

## Environment Setup

1. Copy `.env.example` to `.env` and configure
2. Set up Cloudflare resources:
   - D1 Database: `coms-db`
   - KV Namespaces: `coms-sessions`, `coms-state`
3. Configure OAuth credentials for each platform (Gmail, Outlook, Slack, Discord)
4. Run database migrations: `npm run db:migrate:local`

## GitHub Secrets Required

```
CLOUDFLARE_API_TOKEN    # For deployment
CLOUDFLARE_ACCOUNT_ID   # Account identifier
```

## Documentation Maintenance

**Documentation is part of implementation.**

Before completing any task, evaluate documentation impact. If behavior, APIs, configuration, or architecture changed, update the relevant documentation in the same change.

See: [`.claude/rules/documentation.md`](.claude/rules/documentation.md) for detailed guidelines.

## Key Principles

- Emoji support throughout (contact names, categories, statuses)
- Categories and contact types are user-customizable
- Demo mode with simulated data for development
- Desktop-first responsive design
- Theme support (light/dark/system)
