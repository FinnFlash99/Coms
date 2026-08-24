# Architecture Overview

This document explains the high-level architecture of Coms and the reasoning behind key design choices.

## System Purpose

Coms is a **unified inbox** that aggregates messages from multiple platforms into one place. The core value proposition is **at-a-glance status visibility** — users can instantly see what needs attention across all their communications.

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                          │
├─────────────────────────────────────────────────────────────┤
│  Pages (SvelteKit)  │  D1 (SQLite)  │  KV (Sessions)        │
│       ↓             │       ↓        │       ↓               │
│  - Frontend         │  - Users       │  - Session tokens     │
│  - API routes       │  - Contacts    │  - OAuth state        │
│  - OAuth callbacks  │  - Messages    │  - Rate limiting      │
│  - Edge functions   │  - Connections │                       │
└─────────────────────────────────────────────────────────────┘
        ↓                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services (via OAuth)               │
│  Gmail  │  Outlook  │  Slack  │  Discord  │  (future: more) │
└─────────────────────────────────────────────────────────────┘
```

### Why Cloudflare?

- **Zero cold starts** — Edge functions run globally with minimal latency
- **Generous free tier** — Pages, D1, KV, and Queues all have free tiers
- **Integrated stack** — One platform for compute, database, and storage
- **Auto-scaling** — No infrastructure management required

## Architectural Layers

```
┌─────────────────────────────────────────┐
│              Presentation               │
│   (SvelteKit + Industry design system)  │
├─────────────────────────────────────────┤
│             Application Logic           │
│   (Svelte stores, reactive state)       │
├─────────────────────────────────────────┤
│              API Layer                  │
│   (SvelteKit endpoints, server routes)  │
├─────────────────────────────────────────┤
│              Data Layer                 │
│   (D1 SQLite, encrypted tokens)         │
├─────────────────────────────────────────┤
│         Platform Integrations           │
│   (OAuth, API sync via Queues)          │
└─────────────────────────────────────────┘
```

### Presentation Layer

Built with **SvelteKit 5** using the **Industry design system**. Key characteristics:

- **Svelte 5 runes** — `$state`, `$derived`, `$effect` for reactivity
- **Component library** — Reusable components in `src/lib/components/`
- **Steel-blue accent** on light/dark grounds
- **Square corners**, hairline borders, blueprint registration marks
- **Lucide icons** at stroke-width 1.5

### Application Logic

Handles:
- Tab filtering (All, Unread, Needs Response, Done, Urgent)
- Category filtering (by relationship, connection, platform)
- Status management (read, responded, flagged)
- Theme switching (light/dark/system)
- Demo mode and message simulation (for development)

State management uses **Svelte stores** with localStorage persistence for preferences.

### API Layer

RESTful endpoints in `src/routes/api/`:

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/conversations` | GET | List conversations |
| `/api/conversations/[id]` | GET, PATCH | Conversation detail, update status |
| `/api/contacts/[id]` | PATCH | Update contact |
| `/api/connections` | GET | List platform connections |
| `/api/connections/[platform]` | POST, DELETE | Connect/disconnect platform |
| `/api/auth/callback/[platform]` | GET | OAuth callback |

### Data Layer

**D1 (SQLite)** stores:
- Users and preferences
- Contacts and identities
- Conversations and messages
- Platform connections (encrypted OAuth tokens)

**KV stores:**
- Session tokens (with TTL)
- OAuth state tokens (CSRF protection)

See: [Data Model Reference](../reference/data-model.md)

### Platform Integrations

OAuth2 flows for each platform:
1. User initiates connect → Generate state token → Redirect to provider
2. User authorizes → Callback with code → Exchange for tokens
3. Encrypt tokens (AES-256-GCM) → Store in D1
4. Queue background sync job

Background sync uses **Cloudflare Queues** (Phase 2).

## Key Design Decisions

### Grouped by Contact (Default)

Conversations are grouped by person, not by platform. If Maya talks to James on Slack, Email, and WhatsApp, all three appear under "James."

**Rationale:** The user's mental model is "what's my status with James?" not "what's happening on each platform."

### Status Over Content

The primary UI emphasizes **status visibility** (read, responded, flagged) over message content. Users should know what needs attention before diving into details.

**Rationale:** The core problem is "did I miss something?" — seeing status answers that immediately.

### Open in Platform (Not Reply in Coms)

Users click "Open in Slack" to respond, rather than composing in Coms.

**Rationale:**
- Simpler architecture — read-only API scopes are easier to get approved
- Preserves platform-specific features
- Keeps Coms focused on status visibility, not becoming another communication tool

### Demo Mode First

The app includes a demo mode with simulated data for development and testing.

**Rationale:** Allows validating the UX without requiring real OAuth credentials during development.

### Token Encryption at Rest

OAuth tokens are encrypted with AES-256-GCM before storage. The encryption key is stored as a Cloudflare secret, never in code.

**Rationale:** Defense in depth — even if the database is compromised, tokens remain encrypted.

## Directory Structure

```
src/
├── app.html              # HTML template
├── app.css               # Global styles (imports Industry CSS)
├── app.d.ts              # TypeScript declarations
├── hooks.server.ts       # Server-side middleware (auth)
├── lib/
│   ├── components/       # Svelte components
│   ├── stores/           # State management
│   ├── server/           # Server-only code
│   │   ├── db.ts         # Database queries
│   │   ├── crypto.ts     # Token encryption
│   │   └── oauth.ts      # OAuth helpers
│   ├── styles/           # CSS (Industry design system)
│   └── types/            # TypeScript types
└── routes/
    ├── +layout.svelte    # Root layout
    ├── +page.svelte      # Home (inbox)
    ├── conversation/     # Detail view
    ├── settings/         # Settings page
    └── api/              # API endpoints
```

## Platform Strategy

| Platform | Experience | Status |
|----------|------------|--------|
| Desktop (web) | Full experience | ✅ Implemented |
| Phone (responsive) | Adapted layout | Planned |
| Watch | Notifications only | Future |

**Approach:** Responsive web app. One codebase, design desktop-first.

## Deployment

```
GitHub (main branch)
       ↓
GitHub Actions (CI)
  - Lint & type check
  - Build
       ↓
Cloudflare Pages (CD)
  - Auto-deploy on push
  - Preview deploys on PRs
```

## Security Considerations

- **OAuth state tokens** — CSRF protection with KV-stored, short-lived tokens
- **Token encryption** — AES-256-GCM with server-side key
- **HTTPS only** — Cloudflare enforces TLS
- **Session management** — Secure cookies, KV-backed sessions
- **No secrets in code** — All credentials via Cloudflare secrets

## Boundaries

### What Coms Is

- A unified inbox
- A status visibility layer
- Message/conversation-centric
- Simple and calm

### What Coms Is Not

- A CRM
- A task manager
- A message composer
- Feature-heavy

See: [Product Specification](../reference/product-specification.md) § 3, § 23

## Current Status

- ✅ Product specification complete
- ✅ Design system integrated
- ✅ Interactive prototype
- ✅ SvelteKit application scaffolded
- ✅ Database schema defined
- ✅ API routes implemented
- ✅ CI/CD pipeline configured
- ⏳ OAuth integrations (requires platform credentials)
- ⏳ Background sync (Queues)

---

**See also:**
- [Design Decisions](design-decisions.md) — Specific decisions and rationale
- [Project Structure](../reference/project-structure.md) — Repository layout
