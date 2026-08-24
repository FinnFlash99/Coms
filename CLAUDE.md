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

**If the design system folder changes** (new UUID in `_ds/industry-*/`):
1. Update the import path in `design/styles.css`

## Project Structure

```
Finn-Comms/
├── design/                   # Claude Design exports (auto-committed)
│   ├── Coms.dc.html          # Interactive prototype
│   ├── styles.css            # Stable entry point for app imports
│   └── _ds/industry-*/       # Design system (CSS, components)
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

## Design System: Industry

Wireframe/blueprint aesthetic — steel-blue on light/dark grounds.

- **Accent:** `#5980a6`
- **Typography:** Barlow Condensed (headings), Barlow (body)
- **Style:** Square corners, hairline borders, registration marks (+)
- **Icons:** Lucide, stroke-width 1.5
- **Components:** Blueprint, Button, Tag, Avatar, Dialog, Input, SegmentedControl

See: [`design/_ds/industry-*/readme.md`](design/_ds/industry-38d33b4e-b88e-4a40-acf0-47d74689c7ea/readme.md)

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
