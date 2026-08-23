# Coms Implementation Plan

> **Status:** Phase 0 - Planning
> **Last Updated:** 2026-08-23
> **Current Session:** Initial planning session

---

## Session Resumption Prompt

**Copy and paste this prompt at the start of each new session:**

```
I'm continuing work on the Coms unified inbox project. Read the implementation plan at docs/IMPLEMENTATION-PLAN.md to understand:
1. The current phase and its status
2. What work has been completed
3. Any pending decisions or blockers
4. What the next tasks are

Then summarize where we left off and what needs to happen next. Do not proceed with any work until I confirm.
```

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Phase Summary](#phase-summary)
4. [Phase 0: Planning](#phase-0-planning) ← CURRENT
5. [Phase 1: Repository & Infrastructure](#phase-1-repository--infrastructure)
6. [Phase 2: Design System & Core UI](#phase-2-design-system--core-ui)
7. [Phase 3: Database & Backend](#phase-3-database--backend)
8. [Phase 4: OAuth Implementation](#phase-4-oauth-implementation)
9. [Phase 5: Message Sync](#phase-5-message-sync)
10. [Phase 6: Platform Developer Setup](#phase-6-platform-developer-setup)
11. [Phase 7: Polish & Launch](#phase-7-polish--launch)
12. [Decision Log](#decision-log)
13. [Session Log](#session-log)

---

## Project Overview

**Goal:** Transform the Coms unified inbox design prototype into a production web application.

**Key Decisions Made:**
- Use Cloudflare infrastructure (Pages, Workers, D1, KV, Queues)
- Self-built OAuth (no third-party services like Nango)
- SvelteKit as frontend framework
- Initial platform support: Gmail, Outlook, Slack, Discord
- iMessage excluded (no public API)

**Repository:** `github.com/FinnFlash99/Coms`

**Cost:** $0/month on Cloudflare free tiers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Stack                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages        → SvelteKit frontend + edge functions             │
│  Workers      → API endpoints, OAuth callbacks                  │
│  D1           → SQLite database (users, messages, tokens)       │
│  KV           → Sessions, rate limiting, OAuth state            │
│  Queues       → Background message sync jobs                    │
└─────────────────────────────────────────────────────────────────┘

GitHub (FinnFlash99/Coms) → Auto-deploy via Cloudflare Pages
```

**Platform Integration Complexity:**

| Platform | OAuth Complexity | Verification Required | Timeline |
|----------|-----------------|----------------------|----------|
| Gmail | Medium | Google OAuth verification (2-6 weeks) | Phase 4 |
| Outlook | Medium | Microsoft publisher verification (2-4 weeks) | Phase 4 |
| Slack | Easy | App Directory review (1-2 weeks) | Phase 4 |
| Discord | Easy | Bot verification at 100+ servers | Phase 4 |

---

## Phase Summary

| Phase | Name | Status | Started | Completed |
|-------|------|--------|---------|-----------|
| 0 | Planning | IN PROGRESS | 2026-08-23 | — |
| 1 | Repository & Infrastructure | NOT STARTED | — | — |
| 2 | Design System & Core UI | NOT STARTED | — | — |
| 3 | Database & Backend | NOT STARTED | — | — |
| 4 | OAuth Implementation | NOT STARTED | — | — |
| 5 | Message Sync | NOT STARTED | — | — |
| 6 | Platform Developer Setup | NOT STARTED | — | — |
| 7 | Polish & Launch | NOT STARTED | — | — |

---

## Phase 0: Planning

**Status:** IN PROGRESS
**Goal:** Create complete implementation plan and get user approval.

### Tasks

- [x] Explore existing design prototype
- [x] Explore product specification
- [x] Explore project structure
- [x] Design application architecture (SvelteKit + Cloudflare)
- [x] Design OAuth and platform integration architecture
- [x] Design DevOps and CI/CD pipeline
- [x] Create implementation plan document
- [ ] User reviews and approves plan
- [ ] Plan is finalized

### Decisions Made This Phase

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| Frontend framework | SvelteKit, Next.js, Remix | SvelteKit | Best Cloudflare support, lightweight, reactive |
| OAuth handling | Nango, self-built | Self-built | Control over tokens, no vendor dependency, 4 platforms manageable |
| Database | D1, Planetscale, Turso | D1 | Native Cloudflare integration, zero cold start |
| Token encryption | External KMS, Web Crypto | Web Crypto (AES-256-GCM) | No external dependency, runs on Workers |

### Findings

1. **iMessage is not feasible** — Apple provides no public API. Removed from scope.
2. **WhatsApp requires business verification** — Deferred to future phase due to complexity.
3. **Design system is ready** — Industry CSS can be directly imported into SvelteKit.
4. **Prototype provides complete reference** — All components, states, and interactions documented.

### Activity Log

```
2026-08-23: Initial planning session
- Explored design prototype structure (Coms.dc.html, Industry design system)
- Explored product specification (features, data model, user flows)
- Explored project structure (docs/, scripts/, design/)
- Designed architecture with three planning agents
- Created implementation plan document
- User requested plan restructuring for session persistence
```

### Acceptance Criteria

- [ ] User has reviewed all phases
- [ ] User has approved the overall approach
- [ ] Any concerns or changes have been incorporated
- [ ] Phase 1 can begin

### User Review Notes

*[To be filled after user review]*

---

## Phase 1: Repository & Infrastructure

**Status:** NOT STARTED
**Goal:** Set up GitHub repository, Cloudflare account, and initial project structure.

### Prerequisites

- Phase 0 approved
- Finn has access to create GitHub repository
- Finn can create Cloudflare account

### Tasks

- [ ] Create GitHub repository at `github.com/FinnFlash99/Coms`
- [ ] Transfer existing project files OR initialize fresh
- [ ] Configure branch protection on `main`
- [ ] Create Cloudflare account
- [ ] Create Cloudflare Pages project `coms`
- [ ] Create D1 database `coms-db`
- [ ] Create KV namespaces (`coms-sessions`, `coms-state`)
- [ ] Create Queue `coms-sync`
- [ ] Add GitHub secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- [ ] Initialize SvelteKit project with Cloudflare adapter
- [ ] Configure `wrangler.toml`
- [ ] Create CI/CD workflow (`.github/workflows/deploy.yml`)
- [ ] Verify preview deployment works
- [ ] Verify production deployment works

### Deliverables

1. Working GitHub repository
2. Cloudflare account with all resources created
3. SvelteKit project that deploys successfully
4. CI/CD pipeline functional

### Files to Create

```
src/
├── app.html
├── app.css
├── routes/
│   └── +page.svelte          # Placeholder
├── lib/
│   └── .gitkeep
wrangler.toml
svelte.config.js
package.json
tsconfig.json
vite.config.ts
.github/workflows/deploy.yml
.env.example
```

### Decisions to Make

- Repository name: `Coms` vs `coms` vs other
- Domain: Use `coms.pages.dev` or custom domain?
- Transfer existing files vs fresh start?

### Activity Log

*[To be filled during phase execution]*

### Acceptance Criteria

- [ ] `npm run dev` works locally
- [ ] Push to `main` triggers deployment
- [ ] Preview deployments work on PRs
- [ ] All Cloudflare resources created
- [ ] User has reviewed and approved

### User Review Notes

*[To be filled after user review]*

---

## Phase 2: Design System & Core UI

**Status:** NOT STARTED
**Goal:** Import Industry design system and build all UI components.

### Prerequisites

- Phase 1 completed and approved

### Tasks

- [ ] Copy Industry design system CSS to `src/lib/styles/`
- [ ] Configure CSS imports in `app.css`
- [ ] Build core UI components:
  - [ ] `Blueprint.svelte` (frame with registration marks)
  - [ ] `Button.svelte` (primary/secondary/ghost/icon variants)
  - [ ] `Tag.svelte` (status and category chips)
  - [ ] `Card.svelte` (container with blueprint frame)
  - [ ] `Avatar.svelte` (initials-based)
  - [ ] `Dialog.svelte` (modal)
  - [ ] `Input.svelte` (form inputs)
  - [ ] `SegmentedControl.svelte` (tab-like selectors)
- [ ] Build application components:
  - [ ] `ConversationRow.svelte`
  - [ ] `ConversationList.svelte`
  - [ ] `TabBar.svelte`
  - [ ] `ThreadCard.svelte`
  - [ ] `MessageBubble.svelte`
  - [ ] `PlatformChip.svelte`
  - [ ] `ActionButtons.svelte`
  - [ ] `EmptyState.svelte`
- [ ] Implement Svelte stores (conversations, preferences, UI state)
- [ ] Build routes:
  - [ ] Home/inbox (`/`)
  - [ ] Conversation detail (`/conversation/[id]`)
  - [ ] Settings (`/settings`)
  - [ ] Welcome screen (`/welcome`)
- [ ] Implement theme switching (light/dark/system)
- [ ] Implement demo mode with simulated data
- [ ] Visual QA against prototype

### Deliverables

1. All UI components built and functional
2. All routes navigable
3. Demo mode works with simulated data
4. Theme switching works
5. Visual match to design prototype

### Files to Create

```
src/lib/
├── styles/
│   └── industry.css
├── components/
│   ├── ui/
│   │   ├── Blueprint.svelte
│   │   ├── Button.svelte
│   │   ├── Tag.svelte
│   │   ├── Card.svelte
│   │   ├── Avatar.svelte
│   │   ├── Dialog.svelte
│   │   ├── Input.svelte
│   │   └── SegmentedControl.svelte
│   ├── inbox/
│   │   ├── ConversationRow.svelte
│   │   ├── ConversationList.svelte
│   │   ├── TabBar.svelte
│   │   ├── PlatformChip.svelte
│   │   ├── ActionButtons.svelte
│   │   └── EmptyState.svelte
│   └── detail/
│       ├── ThreadCard.svelte
│       └── MessageBubble.svelte
├── stores/
│   ├── conversations.ts
│   ├── preferences.ts
│   └── ui.ts
├── data/
│   └── demo.ts              # Simulated demo data
└── types/
    └── index.ts
```

### Activity Log

*[To be filled during phase execution]*

### Acceptance Criteria

- [ ] All tabs filter correctly
- [ ] All actions work (mark read, flag, etc.)
- [ ] Theme switching works
- [ ] Looks identical to prototype
- [ ] User has reviewed and approved

### User Review Notes

*[To be filled after user review]*

---

## Phase 3: Database & Backend

**Status:** NOT STARTED
**Goal:** Implement D1 database schema, API routes, and user authentication.

### Prerequisites

- Phase 2 completed and approved

### Tasks

- [ ] Create D1 migration files
- [ ] Implement database schema (users, connections, contacts, conversations, messages)
- [ ] Create database utility functions
- [ ] Implement API routes:
  - [ ] `GET /api/conversations`
  - [ ] `GET /api/conversations/[id]`
  - [ ] `PATCH /api/conversations/[id]`
  - [ ] `GET /api/contacts`
  - [ ] `PATCH /api/contacts/[id]`
  - [ ] `GET /api/connections`
- [ ] Implement user authentication (passwordless email)
- [ ] Implement session management with KV
- [ ] Connect frontend to API (replace demo data)
- [ ] Test all CRUD operations

### Deliverables

1. D1 database with complete schema
2. All API routes functional
3. User authentication working
4. Frontend connected to real database

### Database Schema Summary

```sql
users                    -- User accounts
platform_connections     -- OAuth tokens (encrypted)
contacts                 -- People the user communicates with
contact_identities       -- Platform-specific identities
conversations            -- Threads grouped by contact+platform
messages                 -- Individual messages
```

### Files to Create

```
migrations/
├── 0001_initial.sql
src/lib/server/
├── db/
│   ├── schema.ts
│   ├── queries.ts
│   └── migrations.ts
├── auth/
│   ├── session.ts
│   └── user.ts
src/routes/
├── api/
│   ├── conversations/
│   ├── contacts/
│   └── connections/
├── auth/
│   ├── login/
│   └── logout/
```

### Activity Log

*[To be filled during phase execution]*

### Acceptance Criteria

- [ ] Database migrations run successfully
- [ ] API routes return correct data
- [ ] User can log in and out
- [ ] Data persists across sessions
- [ ] User has reviewed and approved

### User Review Notes

*[To be filled after user review]*

---

## Phase 4: OAuth Implementation

**Status:** NOT STARTED
**Goal:** Implement OAuth flows for Gmail, Outlook, Slack, and Discord.

### Prerequisites

- Phase 3 completed and approved
- Platform developer accounts created (can be done in parallel)

### Tasks

- [ ] Implement OAuth utilities:
  - [ ] State token generation/validation
  - [ ] Token encryption (AES-256-GCM)
  - [ ] Token refresh logic
- [ ] Implement Gmail OAuth:
  - [ ] Redirect endpoint
  - [ ] Callback handler
  - [ ] Token storage
  - [ ] Test end-to-end
- [ ] Implement Outlook OAuth:
  - [ ] Redirect endpoint
  - [ ] Callback handler
  - [ ] Token storage
  - [ ] Test end-to-end
- [ ] Implement Slack OAuth:
  - [ ] Redirect endpoint
  - [ ] Callback handler
  - [ ] Token storage
  - [ ] Test end-to-end
- [ ] Implement Discord OAuth:
  - [ ] Redirect endpoint
  - [ ] Callback handler
  - [ ] Token storage
  - [ ] Test end-to-end
- [ ] Build connection management UI in settings
- [ ] Handle connection errors gracefully
- [ ] Handle token revocation

### Deliverables

1. All four OAuth flows working
2. Tokens stored encrypted in D1
3. Token refresh working
4. Settings UI for manage connections

### OAuth Endpoints

```
GET  /api/connections/[platform]      → Start OAuth
GET  /api/auth/callback/[platform]    → Handle callback
POST /api/connections/[platform]/disconnect → Disconnect
```

### Secrets Required

```
ENCRYPTION_KEY           # 32-byte AES key
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
SLACK_CLIENT_ID
SLACK_CLIENT_SECRET
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
```

### Files to Create

```
src/lib/server/
├── auth/
│   └── oauth/
│       ├── config.ts
│       ├── state.ts
│       ├── gmail.ts
│       ├── outlook.ts
│       ├── slack.ts
│       └── discord.ts
├── crypto/
│   └── tokens.ts
src/routes/
├── api/
│   ├── connections/
│   │   └── [platform]/
│   │       └── +server.ts
│   └── auth/
│       └── callback/
│           └── [platform]/
│               └── +server.ts
```

### Activity Log

*[To be filled during phase execution]*

### Acceptance Criteria

- [ ] Can connect Gmail account
- [ ] Can connect Outlook account
- [ ] Can connect Slack workspace
- [ ] Can connect Discord account
- [ ] Can disconnect any platform
- [ ] Tokens refresh automatically
- [ ] User has reviewed and approved

### User Review Notes

*[To be filled after user review]*

---

## Phase 5: Message Sync

**Status:** NOT STARTED
**Goal:** Implement background message synchronization from all platforms.

### Prerequisites

- Phase 4 completed and approved

### Tasks

- [ ] Set up Cloudflare Queue consumer
- [ ] Implement sync scheduler (cron trigger every 5 min)
- [ ] Implement Gmail sync:
  - [ ] List messages/threads
  - [ ] Incremental sync with historyId
  - [ ] Normalize to common format
- [ ] Implement Outlook sync:
  - [ ] List messages
  - [ ] Delta query for incremental
  - [ ] Normalize to common format
- [ ] Implement Slack sync:
  - [ ] List conversations
  - [ ] Fetch history per channel
  - [ ] Normalize to common format
- [ ] Implement Discord sync:
  - [ ] List DM channels
  - [ ] Fetch messages
  - [ ] Normalize to common format
- [ ] Implement deduplication
- [ ] Implement contact resolution (match across platforms)
- [ ] Update conversation summaries
- [ ] Build manual sync trigger
- [ ] Handle rate limits

### Deliverables

1. Automatic background sync every 5 minutes
2. All platforms sync correctly
3. Messages deduplicated
4. Contacts resolved across platforms
5. Manual sync button works

### Message Normalization

All platforms convert to:
```typescript
interface NormalizedMessage {
  platformMessageId: string;
  platform: 'gmail' | 'outlook' | 'slack' | 'discord';
  content: string;
  senderName: string;
  senderPlatformId: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  threadId: string;
}
```

### Files to Create

```
src/lib/server/
├── sync/
│   ├── worker.ts        # Queue consumer
│   ├── scheduler.ts     # Cron handler
│   ├── gmail.ts
│   ├── outlook.ts
│   ├── slack.ts
│   ├── discord.ts
│   ├── normalize.ts
│   └── dedup.ts
src/routes/
├── api/
│   └── sync/
│       └── trigger/
│           └── +server.ts
```

### Activity Log

*[To be filled during phase execution]*

### Acceptance Criteria

- [ ] Messages sync automatically
- [ ] New messages appear within 5 minutes
- [ ] No duplicate messages
- [ ] Contacts linked across platforms
- [ ] Manual sync works
- [ ] User has reviewed and approved

### User Review Notes

*[To be filled after user review]*

---

## Phase 6: Platform Developer Setup

**Status:** NOT STARTED
**Goal:** Complete platform verification for production use.

### Prerequisites

- Phase 5 completed and approved
- App is functional and ready for review

### Tasks

- [ ] **Google (Gmail):**
  - [ ] Create Google Cloud project
  - [ ] Enable Gmail API
  - [ ] Configure OAuth consent screen
  - [ ] Create production credentials
  - [ ] Submit for OAuth verification
  - [ ] Complete security assessment if required
  - [ ] Track verification status
- [ ] **Microsoft (Outlook):**
  - [ ] Register Azure AD application
  - [ ] Configure API permissions
  - [ ] Verify publisher
  - [ ] Track verification status
- [ ] **Slack:**
  - [ ] Create Slack app
  - [ ] Configure OAuth scopes
  - [ ] Submit for App Directory (if distributing)
  - [ ] Track review status
- [ ] **Discord:**
  - [ ] Create Discord application
  - [ ] Configure OAuth2
  - [ ] Prepare for bot verification (if 100+ servers)

### Platform Requirements Checklist

**All platforms require:**
- [ ] Privacy Policy URL (hosted on your domain)
- [ ] Terms of Service URL
- [ ] Support contact

**Google requires:**
- [ ] Privacy policy describing data usage
- [ ] Justification for requested scopes
- [ ] Security assessment (CASA Tier 2) for sensitive scopes

**Microsoft requires:**
- [ ] Microsoft Partner Network (MPN) ID
- [ ] Verified domain ownership

### Activity Log

*[To be filled during phase execution]*

### Acceptance Criteria

- [ ] Gmail works in production (or verification in progress)
- [ ] Outlook works in production (or verification in progress)
- [ ] Slack works in production
- [ ] Discord works in production
- [ ] Privacy policy published
- [ ] User has reviewed and approved

### User Review Notes

*[To be filled after user review]*

---

## Phase 7: Polish & Launch

**Status:** NOT STARTED
**Goal:** Final polish, testing, and production launch.

### Prerequisites

- Phase 6 completed and approved

### Tasks

- [ ] Error handling audit
- [ ] Loading states and transitions
- [ ] Mobile responsiveness testing
- [ ] Accessibility review
- [ ] Performance optimization
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Cloudflare Web Analytics)
- [ ] Set up uptime monitoring
- [ ] Update documentation:
  - [ ] `CLAUDE.md` with new structure
  - [ ] `docs/reference/project-structure.md`
  - [ ] `docs/explanation/architecture.md`
- [ ] Create user-facing help/FAQ
- [ ] Production deployment
- [ ] Custom domain setup (if applicable)
- [ ] Smoke test all features
- [ ] Announce launch

### Deliverables

1. Production-ready application
2. Monitoring in place
3. Documentation updated
4. Custom domain configured

### Activity Log

*[To be filled during phase execution]*

### Acceptance Criteria

- [ ] All features work in production
- [ ] Error tracking captures issues
- [ ] Performance acceptable (Core Web Vitals pass)
- [ ] Documentation complete
- [ ] User has reviewed and approved

### User Review Notes

*[To be filled after user review]*

---

## Decision Log

| Date | Phase | Decision | Options Considered | Choice | Rationale | Made By |
|------|-------|----------|-------------------|--------|-----------|---------|
| 2026-08-23 | 0 | Frontend framework | SvelteKit, Next.js, Remix | SvelteKit | Best Cloudflare support, lightweight | Planning session |
| 2026-08-23 | 0 | OAuth handling | Nango Cloud, Self-built | Self-built | Full control, no vendor dependency | Planning session |
| 2026-08-23 | 0 | Database | D1, Planetscale, Turso | D1 | Native Cloudflare integration | Planning session |
| 2026-08-23 | 0 | Token encryption | External KMS, Web Crypto | Web Crypto AES-256-GCM | No external dependency | Planning session |
| 2026-08-23 | 0 | Platform scope | All platforms | Gmail, Outlook, Slack, Discord | iMessage impossible, WhatsApp complex | Planning session |

---

## Session Log

### Session 1: 2026-08-23 — Initial Planning

**Duration:** ~1 hour
**Phase:** 0 (Planning)

**What was accomplished:**
- Explored existing design prototype and specifications
- Designed complete application architecture
- Designed OAuth and platform integration approach
- Designed CI/CD and deployment infrastructure
- Created comprehensive implementation plan
- Restructured plan for session persistence

**Decisions made:**
- Cloudflare stack (Pages, Workers, D1, KV, Queues)
- SvelteKit frontend
- Self-built OAuth
- Gmail, Outlook, Slack, Discord for initial launch
- iMessage excluded (no API)

**Open questions:**
- Repository transfer vs fresh start
- Custom domain or pages.dev
- Repository naming (Coms vs coms)

**Next session should:**
1. Review this plan document
2. Address any concerns or changes
3. Finalize Phase 0
4. Begin Phase 1 if approved

---

## Appendix A: OAuth Configuration Reference

### Gmail

```
Authorization URL: https://accounts.google.com/o/oauth2/v2/auth
Token URL: https://oauth2.googleapis.com/token
Scopes: gmail.readonly, userinfo.email, userinfo.profile
```

### Outlook

```
Authorization URL: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
Token URL: https://login.microsoftonline.com/common/oauth2/v2.0/token
Scopes: openid, profile, email, offline_access, Mail.Read, User.Read
```

### Slack

```
Authorization URL: https://slack.com/oauth/v2/authorize
Token URL: https://slack.com/api/oauth.v2.access
Scopes: channels:history, channels:read, groups:history, groups:read, im:history, im:read, mpim:history, mpim:read, users:read, users:read.email, team:read
```

### Discord

```
Authorization URL: https://discord.com/api/oauth2/authorize
Token URL: https://discord.com/api/oauth2/token
Scopes: identify, email, guilds, messages.read
```

---

## Appendix B: Database Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE platform_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  platform TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_iv TEXT NOT NULL,
  token_expires_at INTEGER,
  platform_user_id TEXT,
  platform_email TEXT,
  status TEXT DEFAULT 'active',
  last_sync_at INTEGER,
  sync_cursor TEXT,
  UNIQUE(user_id, platform)
);

CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  contact_type TEXT DEFAULT 'other',
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE contact_identities (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  display_name TEXT,
  UNIQUE(contact_id, platform, platform_user_id)
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  platform TEXT NOT NULL,
  platform_thread_id TEXT,
  is_read INTEGER DEFAULT 0,
  is_responded INTEGER DEFAULT 0,
  importance TEXT DEFAULT 'normal',
  is_time_sensitive INTEGER DEFAULT 0,
  last_message_at INTEGER,
  last_message_preview TEXT,
  UNIQUE(user_id, platform, platform_thread_id)
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  platform TEXT NOT NULL,
  platform_message_id TEXT UNIQUE,
  content TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  direction TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  is_read INTEGER DEFAULT 0
);
```

---

## Appendix C: Cost Reference

| Service | Free Tier | Paid Threshold |
|---------|-----------|----------------|
| Cloudflare Pages | Unlimited sites, 500 builds/mo | — |
| Cloudflare Workers | 100k requests/day | 10M requests/mo = $5 |
| Cloudflare D1 | 5GB, 5M reads/day | Beyond limits = $0.75/M reads |
| Cloudflare KV | 100k reads/day | Beyond limits = $0.50/M reads |
| Cloudflare Queues | 1M operations/mo | Beyond limits = $0.40/M ops |
| GitHub | Free for public repos | Private repos unlimited |

**Expected monthly cost:** $0 for small-scale usage
