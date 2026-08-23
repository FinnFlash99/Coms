# Coms

A unified inbox that aggregates messages from all platforms into one place. At a glance, the user knows the status of everything.

## Project Overview

**Problem:** App-switching anxiety — no single place shows the status of all communications.

**Solution:** One place to see every message across platforms with instant status visibility.

**Primary User:** Freelancers managing multiple clients across Slack, Email, WhatsApp, etc.

## Project Structure

```
Finn-Comms/
├── design/                 # Claude Design exports
│   ├── Coms.dc.html        # Main design (open in browser to view)
│   ├── _ds/industry-*/     # Design system files
│   └── local/              # Local customizations (preserved on update)
├── docs/
│   └── Coms_Product_Overview_and_Build_Specification.md  # Full spec
├── scripts/
│   └── update-design.sh    # Update design from Claude Design export
└── src/                    # Application code (not yet created)
```

## Design System: Industry

The app uses the **Industry** design system — a wireframe/blueprint aesthetic.

- **Accent:** Steel-blue (#5980a6)
- **Background:** Light (#f2f2f3), Dark (#191b1e)
- **Typography:** Barlow Condensed (headings), Barlow (body)
- **Style:** Square corners, hairline borders, corner registration marks (+)
- **Icons:** Lucide, stroke-width 1.5

CSS variables are in `design/_ds/industry-*/styles.css`.

## Key Features (MVP)

- Unified message list with tabs (All, Unread, Needs Response, Done, Urgent)
- Status indicators: read, responded, flagged
- Action buttons: Mark Read, Mark Responded, Flag/Unflag, Open in [Platform]
- Platform labels with colored badges
- Conversations grouped by contact (default)
- Light/dark theme
- Empty state: otter on inflatable tube illustration
- Demo mode with simulated data

## Data Model

- **Contact:** id, name, type (Client/Close/Subcontractor/etc.), platforms, conversations
- **Conversation:** id, contactId, platform, messages, isRead, isResponded, importance, category, isTimeSensitive
- **Message:** id, conversationId, platform, content, timestamp, direction, sender, isRead

## Platform Strategy

- **Desktop (web):** Full experience — design first
- **Phone (responsive):** Same app, adapts to screen
- **Watch:** Notifications only — no app needed

## Commands

```bash
# View the design
open design/Coms.dc.html

# Update design from new Claude Design export
./scripts/update-design.sh ~/Downloads/export.zip
```

## Important Notes

- Full specification is in `docs/Coms_Product_Overview_and_Build_Specification.md`
- Emoji support throughout (contact names, categories, statuses)
- Categories and contact types are user-customizable
- No real platform integrations yet — prototype uses simulated data
