# OpenChannels Integration Plan

Backend integration plan for Coms using [OpenChannels](https://github.com/clawnify/OpenChannels) as the messaging infrastructure.

---

## Overview

**Goal:** Use OpenChannels as the message ingestion/storage backend while keeping Coms' SvelteKit frontend and human-first status visibility model.

**Scope:** Non-agentic v1. Agent features (triage, draft, auto-respond) deferred to future update.

**Multi-user:** Required for MVP. Each user has their own contacts, conversations, platform connections, and preferences. OpenChannels' multi-tenant architecture (organization-scoped rows) supports this.

**Important:** This is NOT a backend-only task. The current frontend has gaps that must be addressed for a real backend to work. See [Phase 0: Frontend Prerequisites](#phase-0-frontend-prerequisites).

---

## Data Sources

| Feature | Source | Storage |
|---------|--------|---------|
| **Messages** | Gmail, Slack, WhatsApp | OpenChannels → Cloudflare D1 |
| **Calendar** | Google Calendar API | Fetch on demand (no local copy) |
| **Notes & Tasks** | Coms-native | Cloudflare D1 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Coms Frontend                           │
│                       (SvelteKit)                               │
└───────────┬─────────────────┬─────────────────┬─────────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
┌───────────────────┐ ┌───────────────┐ ┌─────────────────────────┐
│  Messaging        │ │  Notes/Tasks  │ │  Calendar               │
│  (OpenChannels)   │ │  (Coms D1)    │ │  (Google Calendar API)  │
│                   │ │               │ │                         │
│  Gmail            │ │  CRUD only    │ │  Read-only              │
│  Slack            │ │  No sync      │ │  Attendee → Contact     │
│  WhatsApp         │ │               │ │  matching               │
└─────────┬─────────┘ └───────┬───────┘ └────────────┬────────────┘
          │                   │                      │
          ▼                   ▼                      │
┌─────────────────────────────────────────┐          │
│           Cloudflare D1                 │          │
│  • conversations  • contacts            │          │
│  • messages       • user_preferences    │          │
│  • notes          • sessions            │          │
└─────────────────────────────────────────┘          │
                                                     ▼
                                          ┌──────────────────────┐
                                          │  Google Calendar API │
                                          │  (external)          │
                                          └──────────────────────┘
```

---

## Phase 0: Frontend Prerequisites

**Duration:** 1-1.5 weeks

**Status: DESIGN COMPLETE** — All UI components generated via Claude Design and integrated. The app now has simulated auth, onboarding, platform connections, loading states, and dynamic user identity. Design prompts archived at `docs/archive/claude-design-prompts.md`.

**Remaining work:** Replace simulated localStorage state with real API calls when backend is ready.

### 0.1 Critical Gaps — NOW RESOLVED

| Gap | Previous State | Current State | Backend Migration |
|-----|----------------|---------------|-------------------|
| **User identity** | Hardcoded "Maya" | ✅ Dynamic from `$user` store | Replace localStorage with `/api/auth/me` |
| **Authentication** | Welcome dialog only | ✅ Sign-in screen with Google button | Wire to real Google OAuth |
| **Platform connections** | No UI | ✅ Settings section + onboarding flow | Wire to `/api/connections` |
| **Loading states** | Synchronous stores | ✅ Skeleton loaders implemented | Already ready for async |
| **Error handling** | None | ✅ Toast system in place | Add API error handling |
| **Send status** | Instant update | ✅ Pending/failed states | Already ready for async |

**What's implemented (simulated with localStorage):**
- Sign-in gate (`coms.authed`) — "Continue with Google" flow
- Platform onboarding gate (`coms.onboarded`) — connect Gmail/Slack/WhatsApp
- Platform connection state — toggle in Settings and onboarding
- "No platforms connected" empty state
- Public routes for `/terms` and `/privacy` (exempt from auth)
- Sign-out resets all gates

### 0.2 Backend Migration Tasks

When the OpenChannels backend is ready, these changes wire the existing UI to real APIs:

| Component | Current (Simulated) | Backend Migration |
|-----------|---------------------|-------------------|
| `signIn()` | Sets `localStorage['coms.authed']` | Redirect to `/api/auth/connect/google` |
| `signOut()` | Clears localStorage | `POST /api/auth/logout` + clear |
| `togglePlatform()` | Sets `localStorage['coms.platforms.*']` | `POST/DELETE /api/connections/:platform` |
| `$user` store | Reads from localStorage | Fetch from `/api/auth/me` |
| `$connectedPlatforms` | Reads from localStorage | Fetch from `/api/connections` |
| Conversation stores | Demo data | Fetch from `/api/conversations` |
| Notes stores | Demo data | Fetch from `/api/notes` |

### 0.3 Auth Flow (Current Implementation)

```
App Load (+layout.svelte)
    ↓
Check localStorage['coms.authed']
    ↓
┌─────────────────┐     ┌─────────────────┐
│ authed = true   │     │ authed = false  │
└────────┬────────┘     └────────┬────────┘
         ↓                       ↓
Check onboarded           Show SignInPage
         ↓                       ↓
┌─────────────────┐     "Continue with Google"
│ onboarded=true  │              ↓
└────────┬────────┘     signIn() → set authed
         ↓                       ↓
    Show app            Show OnboardingPage
                                 ↓
                        Connect platforms
                                 ↓
                        finishOnboarding()
                                 ↓
                            Show app
```

Public routes (`/terms`, `/privacy`) bypass this gate entirely.

---

## Phase 0.5: Platform Setup (Prerequisites)

**Duration:** 1-2 days (can be done in parallel with Phase 1)

Before OAuth integrations can work, external platform apps must be configured. This is a one-time setup.

### Google (Gmail + Calendar)

| Step | Details |
|------|---------|
| 1. Create Google Cloud project | [console.cloud.google.com](https://console.cloud.google.com) |
| 2. Enable APIs | Gmail API, Google Calendar API |
| 3. Configure OAuth consent screen | App name, scopes, test users |
| 4. Create OAuth 2.0 credentials | Web application type, authorized redirect URIs |
| 5. Note credentials | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

**Required scopes:**
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/calendar.readonly`

**Redirect URI:** `https://your-domain.com/api/auth/callback/google`

### Slack

| Step | Details |
|------|---------|
| 1. Create Slack app | [api.slack.com/apps](https://api.slack.com/apps) |
| 2. Configure OAuth & Permissions | Add redirect URL, select scopes |
| 3. Enable Event Subscriptions | For real-time message webhooks |
| 4. Install to workspace | Get bot token |
| 5. Note credentials | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` |

**Required scopes (Bot Token):**
- `channels:history`
- `channels:read`
- `chat:write`
- `users:read`
- `users:read.email`

**Required scopes (User Token):**
- `identity.basic`
- `identity.email`

**Redirect URI:** `https://your-domain.com/api/auth/callback/slack`

### WhatsApp (Meta Business)

| Step | Details |
|------|---------|
| 1. Create Meta Business account | [business.facebook.com](https://business.facebook.com) |
| 2. Verify business | Submit documentation, wait for approval |
| 3. Create Meta app | [developers.facebook.com](https://developers.facebook.com) |
| 4. Add WhatsApp product | Configure phone number |
| 5. Generate access token | System user token with messaging permissions |
| 6. Configure webhooks | Message received events |
| 7. Note credentials | `META_APP_ID`, `META_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` |

**Note:** WhatsApp Business API requires business verification, which can take days-weeks. Start this early.

### Checklist

```
[ ] Google Cloud project created
[ ] Gmail API enabled
[ ] Google Calendar API enabled
[ ] Google OAuth consent screen configured
[ ] Google OAuth credentials created
[ ] Slack app created
[ ] Slack OAuth scopes configured
[ ] Slack Event Subscriptions enabled
[ ] Meta Business account created
[ ] Meta Business verified (if using WhatsApp)
[ ] Meta app created with WhatsApp product
[ ] WhatsApp webhook configured
[ ] All credentials added to environment variables
```

---

## Phase 1: Foundation

**Duration:** 2 weeks

**Status: COMPLETE** — OpenChannels forked, adapted for D1, deployed to Workers.

### 1.1 Fork & Adapt OpenChannels

| Task | Details | Status |
|------|---------|--------|
| Fork repo | [`FinnFlash99/OpenChannels`](https://github.com/FinnFlash99/OpenChannels) | ✅ Done |
| Strip React frontend | Removed `src/client/` entirely | ✅ Done |
| Adapt for Cloudflare | Hono + Drizzle for D1; removed Clawnify deps | ✅ Done |
| Disable agent features | Agent-mediated reply logic removed; direct send path | ✅ Done |
| Deploy | [`openchannels-api.rwb89mvwwg.workers.dev`](https://openchannels-api.rwb89mvwwg.workers.dev/health) | ✅ Done |

**Local path:** `~/Projects/OpenChannels`

### 1.2 Schema Extensions

Add Coms-specific fields to OpenChannels schema:

```sql
-- Extend conversations table
ALTER TABLE conversations ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN is_responded BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN importance TEXT DEFAULT 'normal'; -- low/normal/high
ALTER TABLE conversations ADD COLUMN time_sensitive BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN due_ts INTEGER;

-- Extend contacts table
ALTER TABLE contacts ADD COLUMN contact_type TEXT DEFAULT 'Client';
ALTER TABLE contacts ADD COLUMN connection TEXT DEFAULT 'Regular'; -- Close/Regular/Occasional/New

-- Coms-only: User preferences
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'system',
  default_tab TEXT DEFAULT 'all',
  notify BOOLEAN DEFAULT TRUE,
  priority_contacts TEXT, -- JSON array of contact IDs
  custom_types TEXT -- JSON array of custom type names
);

-- Coms-only: Notes & tasks
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  kind TEXT DEFAULT 'note', -- 'note' | 'task'
  done BOOLEAN DEFAULT FALSE,
  ts INTEGER NOT NULL
);

-- Coms-only: Sessions (if not using KV)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
```

### 1.3 API Endpoint Mapping

**Status: COMPLETE** — All endpoints implemented in OpenChannels fork.

| Coms Need | OpenChannels Endpoint | Status |
|-----------|----------------------|--------|
| List conversations | `GET /api/conversations` | ✅ Done |
| Get conversation | `GET /api/conversations/:id` | ✅ Done |
| Mark read | `PATCH /api/conversations/:id/read` | ✅ Done |
| Mark responded | `PATCH /api/conversations/:id/responded` | ✅ Done |
| Set importance | `PATCH /api/conversations/:id/importance` | ✅ Done |
| Toggle time-sensitive | `PATCH /api/conversations/:id/urgent` | ✅ Done |
| Set due date | `PATCH /api/conversations/:id/due` | ✅ Done |
| Set status | `PATCH /api/conversations/:id/status` | ✅ Done |
| Ingest from platform | `POST /api/ingest` | ✅ Done |
| List contacts | `GET /api/contacts` | ✅ Done |
| Update contact | `PATCH /api/contacts/:id` | ✅ Done |
| Notes/tasks | `GET/POST/PATCH/DELETE /api/notes` | ✅ Done |
| Health check | `GET /health` | ✅ Done |

**Not yet implemented (Phase 2+):**
- Send message (requires platform OAuth)
- Auth/session endpoints
- Platform connections CRUD

---

## Phase 2: Platform Integrations (Messaging)

**Duration:** 3-4 weeks

### 2.1 OAuth Flows

| Platform | OAuth Provider | Scopes |
|----------|---------------|--------|
| Gmail | Google | `gmail.readonly`, `gmail.send`, `gmail.modify` |
| Slack | Slack | `channels:history`, `chat:write`, `users:read` |
| WhatsApp | Meta Business | `whatsapp_business_messaging`, `whatsapp_business_management` |

**Implementation:** Extend existing Coms OAuth structure in `src/lib/server/oauth.ts`.

### 2.2 Webhook Handlers

Real-time message ingestion:

```
Platform webhook → POST /api/webhooks/:platform
                        ↓
              Normalize to OpenChannels format
                        ↓
              POST /api/ingest (internal)
                        ↓
              Update conversation status
                        ↓
              (Optional) Push notification to user
```

| Platform | Webhook Type | Payload |
|----------|-------------|---------|
| Gmail | Google Pub/Sub push | Message ID, history ID |
| Slack | Events API | `message` events |
| WhatsApp | Meta Webhooks | `messages` webhook |

### 2.3 Send Path (Non-Agentic)

Direct send without agent approval:

```
User clicks Send → POST /api/conversations/:id/send
                        ↓
              Validate + authorize
                        ↓
              Call platform API directly:
              - Gmail: messages.send
              - Slack: chat.postMessage
              - WhatsApp: messages endpoint
                        ↓
              Update conversation (isResponded = true)
                        ↓
              Store outbound message in thread
```

---

## Phase 3: Notes & Tasks

**Duration:** 1 week

**Status: COMPLETE** — Backend API and frontend wiring both done. Notes persist to OpenChannels API.

### 3.1 API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/notes` | GET | List user's notes/tasks | ✅ Done |
| `/api/notes` | POST | Create note or task | ✅ Done |
| `/api/notes/:id` | PATCH | Update text, toggle done | ✅ Done |
| `/api/notes/:id` | DELETE | Remove note/task | ✅ Done |

### 3.2 Data Model

```typescript
interface Note {
  id: string;
  userId: string;
  text: string;
  kind: 'note' | 'task';
  done: boolean;
  ts: number;
}
```

### 3.3 Frontend Migration

Replace local store with API calls:

```typescript
// Before (demo)
export const notes = writable<Note[]>(DEMO_NOTES);

// After (API)
export const notes = createAsyncStore<Note[]>([], () =>
  fetch('/api/notes').then(r => r.json())
);
```

---

## Phase 4: Google Calendar Integration

**Duration:** 1 week

### 4.1 OAuth

| Provider | Scopes |
|----------|--------|
| Google | `calendar.readonly` |

### 4.2 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/calendar/events` | GET | Fetch events for date range |
| `/api/calendar/events/:id` | GET | Single event + attendee enrichment |

### 4.3 Attendee Matching

Link calendar attendees to Coms contacts:

```
Calendar event attendees (emails)
        ↓
Match against contacts in D1
        ↓
Enrich event with contact metadata (type, connection, recent messages)
        ↓
Display in Event Prep dialog
```

### 4.4 No Local Storage

Calendar data is fetched on demand from Google API. Optional: cache in Cloudflare KV with short TTL for performance.

### 4.5 Demo Data Replacement

**Important:** The current `DEMO_EVENTS` in `src/lib/stores/demo-data.ts` are placeholder data for the prototype. When the Google Calendar integration is complete:

- Demo events are **fully replaced** by Google Calendar data
- No merge or sync between demo and real data
- The `events` store switches from `writable<CalendarEvent[]>(DEMO_EVENTS)` to an async fetch from `/api/calendar/events`
- If the user hasn't connected Google Calendar, show an empty state (not demo data)

This is a complete replacement, not an overlay.

---

## Phase 5: Frontend Integration

**Duration:** 1-2 weeks

**Status: API CLIENT COMPLETE** — `src/lib/api/openchannels.ts` implemented with typed transformers. Store migration not started.

### 5.1 API Client

**Status: COMPLETE** — Implemented at [`src/lib/api/openchannels.ts`](../../src/lib/api/openchannels.ts).

Reference implementation (actual code differs slightly with type transformers):

```typescript
// src/lib/api/client.ts
export const api = {
  auth: {
    me: () => fetch('/api/auth/me'),
    logout: () => fetch('/api/auth/logout', { method: 'POST' }),
  },
  connections: {
    list: () => fetch('/api/connections'),
    disconnect: (platform: string) =>
      fetch(`/api/connections/${platform}`, { method: 'DELETE' }),
  },
  conversations: {
    list: (filters?: ConversationFilters) =>
      fetch('/api/conversations?' + new URLSearchParams(filters)),
    get: (id: string) =>
      fetch(`/api/conversations/${id}`),
    markRead: (id: string) =>
      fetch(`/api/conversations/${id}/read`, { method: 'PATCH' }),
    markResponded: (id: string) =>
      fetch(`/api/conversations/${id}/responded`, { method: 'PATCH' }),
    send: (id: string, content: string) =>
      fetch(`/api/conversations/${id}/send`, {
        method: 'POST',
        body: JSON.stringify({ content })
      }),
  },
  contacts: {
    list: () => fetch('/api/contacts'),
    update: (id: string, data: Partial<Contact>) =>
      fetch(`/api/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  notes: {
    list: () => fetch('/api/notes'),
    create: (data: Omit<Note, 'id'>) =>
      fetch('/api/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Note>) =>
      fetch(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetch(`/api/notes/${id}`, { method: 'DELETE' }),
  },
  calendar: {
    events: (start: string, end: string) =>
      fetch(`/api/calendar/events?start=${start}&end=${end}`),
    event: (id: string) =>
      fetch(`/api/calendar/events/${id}`),
  },
  preferences: {
    get: () => fetch('/api/preferences'),
    update: (data: Partial<UserPreferences>) =>
      fetch('/api/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
  },
};
```

### 5.2 Store Migration

**Status: COMPLETE** — All core stores wired to API with optimistic updates.

| Store | Status |
|-------|--------|
| `contacts` | ✅ Wired to `/api/contacts` |
| `conversations` | ✅ Wired to `/api/conversations` |
| `notes` | ✅ Wired to `/api/notes` |
| `markConversationRead()` | ✅ Optimistic + `PATCH /read` |
| `markConversationResponded()` | ✅ Optimistic + `PATCH /responded` |
| `toggleTimeSensitive()` | ✅ Optimistic + `PATCH /urgent` |
| `updateConversationImportance()` | ✅ Optimistic + `PATCH /importance` |
| `setDue()` | ✅ Optimistic + `PATCH /due` |
| `updateContact()` | ✅ Optimistic + `PATCH /contacts/:id` |
| `sendReply()` | ⏳ Pending (needs OAuth for platform send) |

**Remaining:** Calendar events (Phase 4) and message sending (Phase 2).

### 5.3 Loading & Error States

**Status: PARTIAL** — Error handling via toast; loading states available but not shown in UI.

Implemented:
- ✅ Loading/error stores for notes, contacts, conversations
- ✅ Optimistic updates for all actions
- ✅ Error revert on API failure
- ✅ Toast notifications for errors

Not yet implemented:
- Skeleton loaders in UI (stores ready, UI pending)
- Offline indicator
- Retry logic for failed requests

---

## Phase 6: Deployment

**Duration:** 1 week

### 6.1 Infrastructure

| Component | Platform | Config |
|-----------|----------|--------|
| API | Cloudflare Workers | Hono server (from OpenChannels) |
| Database | Cloudflare D1 | OpenChannels schema + Coms extensions |
| OAuth state | Cloudflare KV | Session/token storage |
| Frontend | Cloudflare Pages | SvelteKit (existing) |

### 6.2 Migration Path

```
1. Deploy OpenChannels API to Workers (separate route: /api/v2/*)
2. Add feature flag: COMS_USE_REAL_BACKEND
3. Gradually migrate stores to API calls behind flag
4. Add OAuth flows (Gmail first, then Slack, then WhatsApp)
5. Enable webhooks for real-time updates
6. Test with real accounts
7. Remove demo data, flip flag to production
8. Deprecate /api/v1/* routes
```

### 6.3 Environment Variables

```bash
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Database
D1_DATABASE_ID=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Slack OAuth
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=

# WhatsApp/Meta
META_APP_ID=
META_APP_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
```

---

## Timeline Summary

| Phase | Deliverable | Duration | Status |
|-------|-------------|----------|--------|
| **0. Frontend Prerequisites** | Auth flow, platform connections UI, loading states, dynamic user | 1-1.5 weeks | ✅ COMPLETE (design) |
| **0.5 Platform Setup** | Google/Slack/Meta app configuration, OAuth credentials | 1-2 days | Not started |
| **1. Foundation** | Forked OpenChannels + Coms schema + base API | 2 weeks | ✅ COMPLETE |
| 2. Messaging | Gmail + Slack + WhatsApp OAuth, webhooks, send | 3-4 weeks | Not started |
| **3. Notes/Tasks** | CRUD endpoints + frontend migration | 1 week | ✅ COMPLETE |
| 4. Calendar | Google Calendar OAuth + event fetch | 1 week | Not started |
| **5. Frontend Integration** | API client + store migration | 1-2 weeks | ✅ COMPLETE (all stores wired) |
| 6. Deployment | Production cutover + remove demo mode | 1 week | Not started |

**Remaining: 4-5 weeks** (Phases 0, 1, 3, 5 complete; need 0.5, 2, 4, 6)

---

## Dependency Graph

```
Phase 0 (Frontend Prerequisites) ✅ COMPLETE
    │
    ├──────────────────────────────┐
    ▼                              ▼
Phase 0.5 (Platform Setup)    Phase 1 (Foundation) ✅ COMPLETE
    │                              │
    └──────────────┬───────────────┘
                   ▼
            Phase 2 (Messaging) ← Needs 0.5 (1 is done)
                   │
    ├───────────┬──┴───────────┐
    ▼           ▼              ▼
Phase 3     Phase 4        Phase 5
(Notes)    (Calendar)    (Frontend Integration)
✅ COMPLETE  Not started   ✅ COMPLETE
    │           │              │
    └───────────┴──────────────┘
                │
                ▼
          Phase 6 (Deployment)
```

**Current state:** Phases 0, 1, 3, 5 complete. All stores wired to OpenChannels API at `openchannels-api.rwb89mvwwg.workers.dev`. App shows empty inbox until OAuth connections bring real data from Gmail/Slack/WhatsApp.

**Next steps:**
- Phase 0.5: Configure Google/Slack/Meta apps and obtain OAuth credentials
- Phase 2: Implement OAuth flows and message ingestion
- Phase 4: Google Calendar integration

Phase 2 (Messaging) requires Phase 0.5 (credentials). Phase 1 (API infrastructure) is already complete.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WhatsApp Business API access | Medium | High | Apply early; have Telegram as fallback |
| OpenChannels schema drift | Low | Medium | Fork + freeze version; merge upstream selectively |
| D1 performance at scale | Low | Medium | Index key columns; use KV for hot paths |
| OAuth token refresh failures | Medium | Medium | Robust refresh logic + user notification on expiry |
| Google Calendar rate limits | Low | Low | Cache events in KV; batch requests |
| Frontend scope creep | Medium | Medium | Strict Phase 0 scope; defer nice-to-haves |

---

## Future: Agentic Features (v2)

When ready, re-enable OpenChannels' agent infrastructure:

| Feature | OpenChannels Support | Additional Work |
|---------|---------------------|-----------------|
| Agent triage | Built-in audit trail | Add LLM classification call |
| Agent draft | Outbox queue exists | Add LLM draft generation |
| Approval UI | Not present | Build agent draft panel in Coms |
| Agent settings | Not present | Build settings page in Coms |

The v1 foundation (OpenChannels backend, message storage, send path) directly supports v2 agent features.

---

## References

- [OpenChannels Repository](https://github.com/clawnify/OpenChannels)
- [Coms Product Specification](./product-specification.md)
- [Coms Architecture](../explanation/architecture.md)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Gmail API](https://developers.google.com/gmail/api)
- [Slack API](https://api.slack.com/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api)
