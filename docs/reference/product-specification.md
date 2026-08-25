# Coms — Product Overview & Build Specification

A complete offline review document for the Coms prototype.

---

## 1. Problem

Maya is a freelancer who communicates with clients and subcontractors across Slack, Email, WhatsApp, Instagram, and other platforms.

**Her daily experience:**
- She constantly switches between apps to check if anything came in
- She worries she missed a message that slipped through
- She has no single place that shows her the status of all her communications
- The mental load of tracking everything is exhausting

**The core anxiety:** "Did I miss something?"

**The behavior it causes:** Constant app-switching throughout the day, just to feel confident nothing slipped by.

## 2. Solution

Coms is a **unified inbox** that aggregates messages from all platforms into one place.

**Core value:** At a glance, Maya knows the status of everything.

**The payoff:** She opens Coms once and knows she hasn't missed anything. The app-switching anxiety stops.

## 3. What Coms Is (and Isn't)

| Coms Is | Coms Is Not |
|---------|-------------|
| A unified inbox | A CRM |
| A status visibility layer | A task manager |
| Message/conversation-centric | A place to compose replies |
| Simple and calm | Feature-heavy |

## 4. Core User

**Maya** is a freelancer with multiple active clients and subcontractors who communicates across many platforms.

- She has several ongoing client relationships
- She may communicate with the same person on more than one platform
- She can forget to respond or follow up
- She worries constantly about missing messages
- She wants one calm place to see the status of everything

## 5. What Maya Sees

Each message/conversation shows:

| Element | Description |
|---------|-------------|
| **Who** | The sender |
| **Platform** | Where the message came from (Slack, Email, WhatsApp, etc.) |
| **When** | Timestamp |
| **Read status** | Has she seen it? |
| **Response status** | Has she replied? |
| **Importance** | Priority level (auto-suggested, can override) |
| **Category** | User-defined grouping |
| **Time-sensitive flag** | For urgent items (auto-detected or manually marked) |

## 6. Organization

**Default view:** Conversations grouped by person.

If Maya has 3 conversations with James (Slack, Email, WhatsApp), they appear as one entry for James with all threads inside.

**Optional:** User can switch to see separate threads if preferred.

## 7. Status System

The app tracks the status of messages and conversations. Status types are **customizable per user** based on their job, role, and preferences.

**Example status options:**
- Unread / Read
- Needs Response / Responded
- Needs Action / Waiting / Resolved
- Custom statuses defined by user

**Default:** Unread / Read and Needs Response / Responded.

## 8. Importance & Time-Sensitivity

**Importance:**
- Auto-suggested by the app (based on sender, keywords, patterns)
- User can override manually

**Time-sensitive detection:**
- Auto-detected from message content (e.g., "tomorrow at 3pm", "by Friday")
- User can also mark manually
- Triggers notifications for time-sensitive items

## 9. Categories

Categories are **user-defined** and vary by person.

**Example category types:**

| Category Type | Examples |
|---------------|----------|
| **By platform** | Email, Slack, WhatsApp, Teams |
| **By relationship** | Client, Subcontractor, Vendor, Personal, Family |
| **By connection strength** | Close, Regular, Occasional, New |
| **By project** | Project Alpha, Website Redesign, Q4 Campaign |
| **By priority** | High Priority, Normal, Low Priority |
| **By response time** | Urgent (same day), Standard, When possible |
| **By custom labels** | Whatever the user creates |

Users can create categories that make sense for their workflow.

## 10. Filtering

The main view can be filtered to show only certain items (e.g., only unread, only needs response).

**Important:** Filters can be turned off. Maya can always see everything if she wants to.

## 11. Notifications

The app sends notifications for time-sensitive items.

Notifications are triggered by:
- Auto-detected deadlines in message content
- Manually flagged items

## 12. Design Principles

1. **At-a-glance clarity** — Status is immediately visible, no digging required
2. **Simple despite features** — Many capabilities, calm presentation
3. **Customizable** — Adapts to user's job, role, and preferences
4. **Low cognitive load** — The app does the tracking so Maya's brain doesn't have to
5. **One source of truth** — All platforms, one place
6. **Anxiety-reducing** — The goal is to make the app-switching worry go away

## 12d. Emoji Support

Full emoji support throughout the app:

- **Messages** — Display emojis in message content
- **Contact names** — Users can add emojis to contact names (e.g., "Sarah 🌟")
- **Categories** — Emojis in category names (e.g., "🔥 Urgent", "💼 Work")
- **Contact types** — Emojis in custom types (e.g., "⭐ VIP Client")
- **Status types** — Emojis in custom statuses (e.g., "✅ Done", "⏳ Waiting")

## 12a. Visual Direction

| Aspect | Decision |
|--------|----------|
| **Theme** | Light and dark mode — follows system preference or user toggle |
| **Density** | Spacious with some efficiency — calm but scannable |
| **Style** | Clean with a little modern |
| **Information hierarchy** | Contact name and message preview are most prominent |
| **Platform indicators** | Text label with colored badge — slightly larger, easy to see at a glance |
| **Status actions** | Buttons visible on each row: Mark Read, Mark Responded, Flag (urgent), Unflag |
| **Open in platform** | Each conversation shows "Open in [Platform]" button (e.g., "Open in Slack", "Open in Email") |
| **Demo Mode label** | Subtle but persistent — small indicator in a corner |

## 12b. Design System: Nocturne

The app uses the **Nocturne** design system — a quiet, compact dark interface.

| Element | Style |
|---------|-------|
| **Accent color** | Blurple (#9184d9) |
| **Background** | Dark blue-grey (#161826), derived light mode (#f4f5fb) |
| **Typography** | Inter (headings and body), heading weight capped at 500 |
| **Corners** | 8px radii — softly rounded |
| **Cards/frames** | Surface-filled with hairline borders |
| **Elevation** | Shadow tokens only — no stacked shadows |
| **Icons** | Phosphor icons |
| **Buttons** | Primary is an accent outline, never a solid fill |

**Design files location:**
- Full design: `design/Coms.dc.html` (open in browser)
- Design system CSS: `design/_ds/industry-*/styles.css`
- Update script: `./scripts/update-design.sh <export.zip>`

## 12c. Empty State ("All Clear")

When nothing needs attention, show:
- A calming illustration: **an otter floating on an inflatable tube in a river**
- Simple message: "All clear" or "You're all caught up"

This is the reward moment. Make it feel satisfying.

## 13. Main Screen

The home screen answers: **"What's the status of everything?"**

- Shows all messages/conversations
- Status indicators visible at a glance
- Grouped by person (default) or by thread (user preference)
- Newest activity appears first within each group
- Action buttons visible on each row: Mark Read, Mark Responded, Flag/Unflag, Open in [Platform]

### Tabs

The main screen uses tabs to organize conversations:

| Tab | Contents |
|-----|----------|
| **All** | Everything in one view (see below for layout) |
| **Unread** | Messages she hasn't seen yet |
| **Needs Response** | She's read it but hasn't replied |
| **Done** | Nothing pending, resolved |
| **Urgent** | Time-sensitive / flagged items |

Default tab is customizable by user.

### "All" Tab Layout

The All tab shows everything, but with visual separation:

```
┌─────────────────────────────────┐
│  ACTIVE                         │
│  ─────────────────────────────  │
│  [Urgent items]                 │
│  [Unread items]                 │
│  [Needs Response items]         │
│                                 │
│  ─────────────── divider ────── │
│                                 │
│  DONE                           │
│  ─────────────────────────────  │
│  [Resolved items]               │
└─────────────────────────────────┘
```

Active items (urgent, unread, needs response) appear first, grouped together. A subtle divider separates them from Done items below.

## 14. Conversation Detail

When Maya taps a conversation:

**Display:**
- All messages in the thread
- Platform for each message
- Timestamps
- Read/response status per message
- Importance and category

**Actions:**
- **Open in [Platform]** — dynamic button (e.g., "Open in Slack", "Open in Email", "Open in WhatsApp")
- **Mark Read** / **Mark Unread**
- **Mark Responded** / **Mark Needs Response**
- **Flag** (mark urgent) / **Unflag** (remove urgent)
- **Set contact type** — Client, Close, Subcontractor, Vendor, Personal, Family, etc. (user-defined)
- Change category
- Change importance

## 15. Core User Loop

```
Message arrives on any platform
    → Coms shows it with status indicators
    → Maya opens Coms
    → Sees everything at a glance
    → Knows immediately what needs attention
    → Opens original platform to respond if needed
    → Returns to Coms
    → Status updates (read, responded, etc.)
    → Maya has confidence nothing was missed
```

## 16. Onboarding & Help

### First Launch

Minimal onboarding — a single welcome screen explaining the concept, then she's in.

### Tutorial (Help Page)

A separate help page with text and images for users who want more guidance. Accessible from settings or a help link. Static documentation, not interactive.

### Personalization Page

A settings page where users can customize:

| Setting | Options |
|---------|---------|
| **Theme** | Light / Dark / System |
| **Categories** | Create, edit, delete custom categories |
| **Contact types** | Create, edit, delete custom contact types (Client, Close, Subcontractor, etc.) |
| **Status types** | Define custom statuses beyond defaults |
| **Default tab** | Which tab opens first |
| **Grouping** | By person (default) or separate threads |
| **Notifications** | What triggers notifications (see below) |
| **Account** | Log out, account info |

### Notification Settings

| Setting | Options |
|---------|---------|
| **Enable notifications** | On / Off |
| **Notify on new message** | All / Only flagged contacts / Off |
| **Notify on urgent/flagged** | On / Off |
| **Notify on time-sensitive** | On / Off (auto-detected deadlines) |
| **Quiet hours** | Set hours when notifications are silenced |
| **Sound** | On / Off, choose sound |

---

## 17. Prototype / Demo Mode

The prototype does not have real platform integrations.

- No real Slack, Gmail, WhatsApp, iMessage, Instagram, or Teams connections
- Uses realistic simulated data
- Subtle but persistent Demo Mode indicator in corner
- Explains that the full product would sync automatically
- Includes a "Simulate Incoming Message" feature for testing

## 18. Simulate Incoming Message

For prototype testing, the user can simulate a new message:

1. Select a contact
2. Select a platform
3. Enter message content
4. Optionally set importance, time-sensitivity, category

**Behavior:**
- Message appears in the inbox
- Status set to Unread / Needs Response
- Timestamp set to now
- Home screen updates immediately

## 19. Prototype Data

| Contact | Platforms | Latest Message | Status | Time |
|---------|-----------|----------------|--------|------|
| Sarah Chen | Slack | Can we move tomorrow's meeting to 3pm? | Unread | 25 min ago |
| James (TechCo) | Email, Slack, WhatsApp | Just checking in — did you get my message? | Unread | 2 hours ago |
| Ravi Sharma | Email, Slack | I've sent over the revised files. Let me know what you think. | Read, Needs Response | 4 hours ago |
| Studio Collective | Slack | Thanks! We'll review the timeline and get back to you. | Read, Responded | 1 day ago |
| Anna K. | Email | Perfect, thank you! | Read, Responded | 2 days ago |
| Brand Co. | WhatsApp | Could you send us a revised quote? | Read, Needs Response | 3 days ago |

## 20. Minimum Data Model

### Conversation

| Field | Type |
|-------|------|
| id | string |
| contactId | string |
| platform | Platform |
| messages | Message[] |
| isRead | boolean |
| isResponded | boolean |
| importance | Importance |
| category | string (user-defined) |
| isTimeSensitive | boolean |
| lastMessageTimestamp | timestamp |

### Contact

| Field | Type |
|-------|------|
| id | string |
| name | string |
| type | ContactType (user-defined) |
| platforms | Platform[] |
| conversations | Conversation[] |

### Contact Types

Users can assign a type to each contact to indicate their relationship.

**Default types:**
- Client
- Close (friends, close colleagues)
- Subcontractor
- Vendor
- Personal
- Family

**Custom types:** Users can create their own contact types in settings.

### Message

| Field | Type |
|-------|------|
| id | string |
| conversationId | string |
| platform | Platform |
| content | string |
| timestamp | timestamp |
| direction | "inbound" or "outbound" |
| sender | string |
| isRead | boolean |

### Enums

- **Platforms:** `email`, `slack`, `whatsapp`, `instagram`, `imessage`, `teams`
- **Importance:** `low`, `normal`, `high` (or user-defined)

## 21. MVP — Must Build

- [ ] Unified message list showing all conversations
- [ ] Tabs (All, Unread, Needs Response, Done, Urgent)
- [ ] At-a-glance status indicators (read, responded)
- [ ] Action buttons on each row (Mark Read, Mark Responded, Flag/Unflag, Open in [Platform])
- [ ] Platform labels with colored badges (larger size, prominent)
- [ ] Grouping by contact (default view)
- [ ] Conversation detail view
- [ ] Light and dark theme (system preference)
- [ ] Empty state with otter illustration
- [ ] Welcome screen (minimal onboarding)
- [ ] Pre-loaded realistic demo data
- [ ] Simulate Incoming Message
- [ ] Demo Mode indicator (subtle, corner)

## 22. Phase 2 — After MVP

- [ ] Personalization page (full settings)
- [ ] Notification settings (triggers, quiet hours, sounds)
- [ ] Login / Logout / Account management
- [ ] Help/tutorial page
- [ ] Importance levels (auto-suggested + manual)
- [ ] Time-sensitive detection and notifications
- [ ] User-defined categories
- [ ] User-defined status types
- [ ] Custom default tab
- [ ] View toggle (grouped by person vs. separate threads)
- [ ] Responsive phone layout

## 23. Do Not Build Yet

- Real platform integrations
- Subscriptions or payments
- AI-generated replies
- In-app message composer
- Search
- Analytics
- CRM features
- Task management
- Native mobile app

**Note:** Authentication (login/logout) is needed for the full product but can be simulated in the prototype.

## 24. Success Test

Give a first-time user this scenario:

> "You've been in meetings all day. It's 4pm. You have 15 minutes before you leave. Show me what you need to deal with."

**Success:** The user opens Coms and answers confidently in under 30 seconds without guidance.

**Emotional success:** The user feels relief, not overwhelm.

## 25. Build Order

**MVP:**
1. Data model and simulated data
2. Home screen with conversation list
3. Tabs (All, Unread, Needs Response, Done, Urgent)
4. Status indicators and action buttons
5. Platform labels with colored badges
6. Grouping by contact
7. Conversation detail screen
8. Light/dark theme support
9. Empty state (otter illustration)
10. Welcome screen
11. Simulate Incoming Message
12. Demo Mode indicator

**Phase 2:**
13. Personalization page
14. Help/tutorial page
15. Importance, categories, and custom statuses
16. Responsive phone layout

## 26. Platform Strategy

| Platform | Role | Priority |
|----------|------|----------|
| **Desktop (web)** | Full experience | MVP — design first |
| **Phone (web, responsive)** | Full experience, adapted | After desktop |
| **Watch** | Notifications only | Future — no app needed |

**Approach:** Responsive web app. Design desktop first, then adapt to phone. One codebase.

**Watch:** Push notifications only. No dedicated watch app for MVP.

---

## 27. Final Product Definition

| Attribute | Value |
|-----------|-------|
| **Name** | Coms |
| **One-liner** | One place to see the status of all your conversations. |
| **Core problem** | App-switching anxiety — no single place shows the status of everything. |
| **Core solution** | A unified inbox with at-a-glance status visibility. |
| **Primary user** | Freelancers managing multiple clients across platforms. |
| **Core insight** | The problem isn't scattered messages — it's not knowing the status of those messages. |
| **Emotional payoff** | Relief. The app-switching anxiety stops. |
| **Prototype goal** | Prove that unified status visibility reduces communication anxiety. |
