# Architecture Overview

This document explains the high-level architecture of Coms and the reasoning behind key design choices.

## System Purpose

Coms is a **unified inbox** that aggregates messages from multiple platforms into one place. The core value proposition is **at-a-glance status visibility** — users can instantly see what needs attention across all their communications.

## Architectural Layers

```
┌─────────────────────────────────────────┐
│              Presentation               │
│    (HTML/CSS/JS, Industry design system)│
├─────────────────────────────────────────┤
│             Application Logic           │
│     (State management, UI behavior)     │
├─────────────────────────────────────────┤
│              Data Layer                 │
│    (Contact, Conversation, Message)     │
├─────────────────────────────────────────┤
│         Platform Integrations           │
│  (Slack, Email, WhatsApp, etc. — future)│
└─────────────────────────────────────────┘
```

### Presentation Layer

Uses the **Industry design system** — a wireframe/blueprint aesthetic. All UI components use design system CSS variables and classes.

Key characteristics:
- Steel-blue accent on light/dark grounds
- Square corners, hairline borders
- Blueprint registration marks
- Lucide icons at stroke-width 1.5

### Application Logic

Handles:
- Tab filtering (All, Unread, Needs Response, Done, Urgent)
- Conversation grouping by contact
- Status management (read, responded, flagged)
- Theme switching (light/dark)
- Demo mode and message simulation

### Data Layer

Three core entities with clear relationships:

- **Contact** — A person (may exist on multiple platforms)
- **Conversation** — A thread with a contact on one platform
- **Message** — A single message in a conversation

See: [Data Model Reference](../reference/data-model.md)

### Platform Integrations (Future)

Currently uses simulated demo data. Real platform integrations are explicitly out of scope for MVP.

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
- Simpler architecture — no OAuth flows or message APIs for MVP
- Preserves platform-specific features
- Keeps Coms focused on status visibility, not becoming another communication tool

### Demo Mode First

The prototype uses simulated data with a visible "Demo Mode" indicator.

**Rationale:** Allows validating the UX without the complexity of real integrations. Real platform sync is Phase 2+.

## Platform Strategy

| Platform | Experience | Priority |
|----------|------------|----------|
| Desktop (web) | Full experience | MVP |
| Phone (responsive) | Adapted layout | After desktop |
| Watch | Notifications only | Future |

**Approach:** Responsive web app. One codebase, design desktop-first.

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

The project is in the **design/specification phase**:

- ✅ Product specification complete
- ✅ Design system integrated
- ✅ Interactive prototype
- ❌ Application code (not yet started)
- ❌ Platform integrations

## Future Architecture Considerations

When implementation begins:

1. **Build system** — Likely Vite or similar modern bundler
2. **State management** — To be determined based on complexity
3. **Component architecture** — Web components or framework TBD
4. **Testing** — Unit and integration tests for core logic
5. **Deployment** — Static hosting for MVP (Netlify, Vercel, etc.)

---

**See also:**
- [Design Decisions](design-decisions.md) — Specific decisions and rationale
- [Project Structure](../reference/project-structure.md) — Repository layout
