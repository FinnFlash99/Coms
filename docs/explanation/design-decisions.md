# Design Decisions

This document records significant design decisions and their rationale.

## Decision Record

### Industry Design System — superseded by Nocturne

**Decision:** Use the Industry design system — a wireframe/blueprint aesthetic.

**Context:** The app needed a visual identity that feels calm, technical, and professional.

**Rationale:**
- The blueprint aesthetic conveys precision and clarity
- Steel-blue is calming, not aggressive
- Square corners and hairline borders feel organized
- The style differentiates Coms from typical rounded/soft productivity apps

**Consequences:**
- All UI must follow Industry guidelines (no rounded corners, no decorative colors)
- Primary buttons are the only solid-filled elements
- Registration marks (`+`) are required on framed elements

**Superseded:** A later Claude Design retheme replaced Industry with **Nocturne** — a dark blue-grey ground with a blurple accent, Inter typography, and 8px radii (outlined, never filled, primary buttons). See [Design System: Nocturne](../reference/design-system.md). This record is kept as-is for history; it no longer describes the current UI.

### Grouped by Contact

**Decision:** Group conversations by contact (person) rather than by platform.

**Context:** Users communicate with the same person across multiple platforms.

**Rationale:**
- Mental model: "What's my status with Sarah?" not "What's on Slack?"
- Reduces cognitive load — one entry per person, not per thread
- Highlights relationship context over platform context

**Consequences:**
- UI must visually indicate which platforms a contact uses
- Contact view shows all conversations with that person
- Platform badges are prominent for context

### Status-First UI

**Decision:** Emphasize status indicators (read, responded, flagged) over message content.

**Context:** The core anxiety is "Did I miss something?" not "What exactly did they say?"

**Rationale:**
- Users need to know what needs attention before reading details
- Status is answerable at a glance
- Message content requires focused reading

**Consequences:**
- Status indicators must be immediately visible
- Message preview is secondary to status
- Action buttons (Mark Read, Mark Responded, Flag) are prominent

### Open in Platform (No Composer)

**Decision:** Users click "Open in Slack" to respond; Coms does not compose messages.

**Context:** Building a message composer requires deep platform integration.

**Rationale:**
- MVP scope — avoid OAuth flows and message sending APIs
- Preserves platform-specific features (formatting, reactions, threads)
- Keeps Coms focused on status, not becoming another chat app

**Consequences:**
- Users must switch to the native platform to respond
- Coms is a read/status layer, not a full communication tool
- Future iterations may add quick-reply for some platforms

### Demo Mode First

**Decision:** Build the prototype with simulated data, not real integrations.

**Context:** Real platform integrations (Slack, Gmail, etc.) are complex and time-consuming.

**Rationale:**
- Validates the UX before engineering integration work
- Allows rapid iteration on the core experience
- "Simulate Incoming Message" enables realistic testing

**Consequences:**
- Prototype requires visible "Demo Mode" indicator
- Real integrations are Phase 2+
- Early users understand the product is not yet live

### Tabs for Filtering

**Decision:** Use tabs (All, Unread, Needs Response, Done, Urgent) rather than complex filters.

**Context:** Users need quick access to common views without learning a filter syntax.

**Rationale:**
- Tabs are immediately understandable
- Covers the most common filtering needs
- Default tab is customizable per user

**Consequences:**
- Limited to predefined filter combinations
- Complex filtering (e.g., "Unread AND from Client") not supported in MVP
- "All" tab shows everything with visual sections

### Emoji Support Throughout

**Decision:** Support emoji in contact names, categories, statuses, and messages.

**Context:** Users personalize their organization with emoji.

**Rationale:**
- Emoji provide quick visual recognition ("Sarah ⭐")
- Categories become scannable ("🔥 Urgent", "💼 Work")
- Matches how people organize in other tools

**Consequences:**
- UI must render emoji correctly
- Search/sort must handle emoji in strings
- Data model stores emoji as part of strings

---

## Future Decisions (Not Yet Made)

The following decisions will be made when implementation begins:

- **Build system:** Vite, Webpack, or other
- **Framework:** Web components, React, Vue, or vanilla JS
- **State management:** Context, Redux, Zustand, or custom
- **Testing strategy:** Unit testing framework, E2E tools
- **Deployment:** Hosting platform and CI/CD approach
- **Authentication:** When login/logout is implemented
- **Real integrations:** API design, OAuth flows, webhook vs. polling

---

**See also:**
- [Architecture Overview](architecture.md) — System design and layers
- [Product Specification](../reference/product-specification.md) — Complete feature spec
