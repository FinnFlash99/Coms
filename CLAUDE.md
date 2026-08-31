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

Finn will upload a new Claude Design export ZIP repeatedly, over and over, indefinitely. It is always shaped the same way. Do NOT re-derive this from scratch each time — follow the mechanical procedure below exactly.

### Step 1: Extract and pick the right copy of each file — deterministically

**The zip always contains multiple copies of the same files at different nesting depths.** This is because Claude Design's export bundles the project's own `uploads/` folder too, which accumulates copies of previous exports/handoffs the user re-uploaded as reference material. Observed shapes so far, always the same rule applies:

- A zip may have `Coms.dc.html` at the root, AND/OR nested under `design_handoff_coms/`, AND/OR nested under `uploads/<something>/`.
- **Rule: for each filename, use the copy with the fewest path segments (least nested / closest to the zip root). Ignore every deeper copy — they are stale leftovers from a previous upload, not the current export.**
- Do NOT use file timestamps to decide freshness — the zip stamps every file with the export time, not the file's actual history, so timestamps are always identical and useless as a signal.
- If two copies of the same filename tie at the same minimal depth, diff them. If identical, it doesn't matter which you use. If they differ, stop and ask Finn rather than guess.

Files to extract this way and sync into `design/`: `Coms.dc.html`, `support.js`, `image-slot.js`, `.thumbnail` (if present), and the `_ds/<system-name>-<uuid>/` folder(s) actually `<link>`/`<script>`-referenced from the chosen `Coms.dc.html` (currently just `nocturne-*`; ignore any other `_ds/*` folder present in the zip as an inactive leftover). Also sync the product spec markdown (shallowest copy) into `design/uploads/` if its content actually changed.

**Any other top-level `*.dc.html` file** the design links to (e.g. `Terms.dc.html`, `Privacy.dc.html`, linked from the sign-in screen) is a real design page, not a stale leftover — sync it the same way (shallowest copy) and give it a real route under `src/routes/` porting its actual copy, the same as every other page. `design/_ds/nocturne-*/readme.md`-style "Placeholder" tags on the page itself just mean the *content* is intentionally not-real (e.g. joke legal text) — it still needs a real, reachable route; it does not mean skip syncing it. Route(s) added so far: `/terms`, `/privacy` (component: `src/lib/components/LegalPage.svelte`). Routes linked from the sign-in screen must be exempted from the auth gate in `+layout.svelte` (see `PUBLIC_ROUTES`) since they need to be readable before signing in.

**Never sync these, even though they appear in the zip:** `github.md` (stale bookkeeping from Claude Design's own session, not authoritative for this repo — `CLAUDE.md`'s own "Claude Design Integration" section is the source of truth here), `.image-slots.state.json` (Claude Design's internal tool state), and the entire `design_handoff_coms/` or nested `uploads/*/` wrapper directories themselves (only cherry-pick the individual files named above out of them, using the depth rule).

### Step 2: every time, without being asked

1. Sync the files selected in Step 1 into `design/` (per "Claude Design Integration" below), fixing any references broken by the sync (renamed `_ds/` UUID, etc.).
2. **Propagate the actual content/visual changes into `src/` so the deployed app matches the new design.** `design/Coms.dc.html` is a static reference file — the live app never reads it, it has its own hardcoded copy of every string/style in `src/routes/` and `src/lib/components/`. Diff the new design against the previous one, find the corresponding hardcoded text/markup/styling in `src/`, and update it to match. Syncing `design/` alone is **not sufficient** — if the deployed site doesn't reflect the new design, the job isn't done.
3. Validate: `npm run lint`, `npm run check`, `npm run build` must all pass clean (0 errors). For any change to visual/interactive behavior (theming, new UI, new flows), also actually run the app (`npm run dev` + a real browser/Playwright check) and confirm it — a clean build has already once shipped a broken theme toggle, so build-clean alone is not sufficient proof it works.
4. Commit and push to `main`.

This is a standing instruction — don't ask for confirmation or scope check-in on any of these steps for a design handoff; just do them. (Building *new functionality* beyond what the design actually shows, or expanding scope past matching the design, is still not part of this — that would need an explicit ask.)

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
- The app imports `$design/styles.css` directly — no manual copy/sync needed for design *tokens* (colors, fonts, radii, spacing): those propagate to the deployed app automatically through this CSS import.
- **Content, copy, and markup/structure do NOT auto-propagate.** Every string and layout in `design/Coms.dc.html` has a separate, hardcoded counterpart in `src/routes/` and `src/lib/components/`. A new design export requires manually finding and updating those — see "Handling a Claude Design handoff" below, which is a standing instruction to do this every time without being asked.

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
│       ├── terms/            # Terms of Service (public, no auth gate)
│       ├── privacy/          # Privacy Policy (public, no auth gate)
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

1. Set up Cloudflare resources (configured in `wrangler.toml`):
   - D1 Database: `coms-db`
   - KV Namespaces: `SESSIONS`, `OAUTH_STATE`
2. Set secrets via wrangler CLI (see Secrets Management)
3. Run database migrations: `npm run db:migrate:local` (local) or `npm run db:migrate:remote` (production)

## Secrets Management

This project deploys as a **Cloudflare Worker**. Secrets are set via wrangler CLI:

```bash
npx wrangler secret put ENCRYPTION_KEY
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put SLACK_CLIENT_ID
npx wrangler secret put SLACK_CLIENT_SECRET
npx wrangler secret put SLACK_SIGNING_SECRET
```

Generate `ENCRYPTION_KEY` once: `openssl rand -hex 32`

**WARNING:** If `ENCRYPTION_KEY` changes, all stored OAuth tokens become unreadable. Users must reconnect.

See: [`docs/reference/secrets-and-credentials.md`](docs/reference/secrets-and-credentials.md) for complete documentation.

## Deployment

Cloudflare deploys via Git integration (configured in the Cloudflare dashboard). On push to `main`:
1. GitHub Actions runs lint/type-check/build as validation
2. Cloudflare builds and deploys the Worker

Runtime URL: `coms.rwb89mvwwg.workers.dev`

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

## Demo Auth & Onboarding Flow

There's no real OAuth yet. `+layout.svelte` gates every route (except `/terms` and `/privacy`) behind two simulated, localStorage-persisted steps, in order: sign-in (`authed`, `coms.authed`) → connect-platforms onboarding (`onboarded`, `coms.onboarded`) → the app itself, with the existing first-run welcome dialog (`welcomed`, `coms.welcomed`) still gating the home page after that. "Continue with Google" and "Connect"/"Disconnect" just flip local state (`src/lib/stores/index.ts`: `signIn`, `finishOnboarding`, `togglePlatform`, `signOut`) — no real account is ever contacted. If no platform is connected, the home page shows a distinct "No platforms connected" empty state instead of the inbox. `signOut()` (Settings → Log out) resets all three gates and every connection, returning to the sign-in screen.
