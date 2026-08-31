# Claude Design Prompts for Backend Integration UI

> **Archived:** All prompts in this document have been satisfied and integrated into the design. This file is retained for historical reference. See the current design in `design/Coms.dc.html` and the integration plan in `docs/reference/openchannels-integration-plan.md`.

These prompts generate the UI components needed for Phase 0 of the OpenChannels integration. Use them in Claude Design to extend the existing Coms prototype.

**Context for all prompts:** The app uses the Nocturne design system (dark blue-grey background, blurple accent #9184d9, Inter font, 8px radii, Phosphor icons). All new screens should match the existing Settings, Calendar, and Inbox pages in style and density.

---

## Prompt 1: Login Page

```
Add a login page to Coms. This is shown when the user is not authenticated.

Design requirements:
- Centered card on the page (similar to the Welcome dialog layout)
- Coms logo/wordmark at top: the stylized "Coms" with the large C in DM Serif Display
- Headline: "Sign in to Coms"
- Subtext: "Connect your accounts to see all your messages in one place."
- Primary action: "Continue with Google" button with Google icon
- The button should use the primary outlined style (accent border, not filled)
- Below the button: subtle text "We'll ask you to connect your messaging platforms next."
- No other sign-in options for now (Google is the only auth provider)
- Footer text: "By signing in, you agree to our Terms and Privacy Policy" (as links)

The page should feel welcoming and simple — this is the user's first impression.
Do not show the Demo Mode badge on this page.
```

---

## Prompt 2: Platform Connections (Settings Section)

```
Add a "Connected Platforms" section to the Settings page, positioned after the Theme setting and before the Groups setting.

Design requirements:
- Section label: "Connected platforms"
- Show three platforms in a vertical list inside a bordered card (like the Priority senders list):
  1. Gmail (envelope icon)
  2. Slack (hash icon)
  3. WhatsApp (message-circle icon)

For each platform row:
- Platform icon (16px, accent color when connected, muted when not)
- Platform name (e.g., "Gmail")
- Connection status:
  - If connected: show the connected email/handle in muted text (e.g., "maya@gmail.com"), plus a "Disconnect" ghost button on the right
  - If not connected: show "Not connected" in muted text, plus a "Connect" secondary button on the right
- Rows should have the same hover treatment as Priority senders rows

Below the list:
- Hint text: "Connect platforms to sync your messages. You can disconnect anytime."

Show Gmail and Slack as connected (with example emails), WhatsApp as not connected — this demonstrates both states.
```

---

## Prompt 3: Onboarding - Connect Platforms

```
Add a "Connect your platforms" onboarding screen. This appears after the user signs in with Google, before they see the inbox for the first time.

Design requirements:
- Full-page layout (not a dialog) with centered content, max-width ~600px
- Kicker text: "Almost there"
- Headline: "Connect your platforms"
- Subtext: "Choose which accounts to sync. You can always change this in Settings."

Platform cards in a vertical stack (3 cards):
Each card shows:
- Platform icon (left)
- Platform name + one-line description:
  - Gmail: "Sync your email conversations"
  - Slack: "See messages from your workspaces"
  - WhatsApp: "Connect via WhatsApp Business"
- Right side: "Connect" secondary button, or if connected: checkmark icon + "Connected" text in accent color

Below the cards:
- "Skip for now" ghost button (left-aligned)
- "Continue to Coms" primary button (right-aligned) — only enabled if at least one platform is connected

The layout should feel like a focused setup wizard, not cluttered.
```

---

## Prompt 4: Loading States - Conversation List Skeleton

```
Add a loading skeleton state for the conversation list on the home page.

Design requirements:
- Show 5 skeleton conversation rows inside the same bordered card container used for real conversations
- Each skeleton row should mimic the real conversation row layout:
  - Circle placeholder for avatar (42px, same size as real avatars)
  - Rectangular placeholder for name (40% width, 14px height)
  - Rectangular placeholder for message preview (80% width, 14px height)
  - Small rectangular placeholder for tags area (20% width, 14px height)
  - On the right: placeholder for timestamp
- Skeleton elements should use the divider color with a subtle pulse animation
- No interaction states on skeleton rows

Show this as an alternate state of the inbox — label it "Loading state" in the prototype.
The skeleton should feel like a promise of content, not an error or empty state.
```

---

## Prompt 5: Loading States - Settings Skeleton

```
Add loading skeleton states for the Settings page sections that load from the API.

Design requirements:
- The "Connected platforms" section shows a skeleton while loading:
  - 3 placeholder rows matching the platform row height
  - Each row: circle icon placeholder, text placeholder, button placeholder

- The "Priority senders" list shows a skeleton while loading:
  - 4 placeholder rows matching the priority sender row height
  - Each row: checkbox placeholder, name placeholder, meta text placeholder

Other settings (Theme, Default tab, Groups, Notifications) are local preferences and don't need skeletons — they load instantly.

Use the same skeleton styling as the conversation list (divider color, pulse animation).
```

---

## Prompt 6: Send States - Pending and Failed

```
Update the reply composer in the conversation detail view to show sending states.

Design requirements:

**Pending state (while message is being sent):**
- The Send button shows a small spinner icon instead of the send icon
- Button text changes to "Sending..."
- Button is disabled (can't click again)
- The textarea is also disabled (grayed out slightly)

**Failed state (if send fails):**
- Show an inline error bar below the textarea:
  - Red/alert background tint (use the existing alert color system)
  - Error icon (warning-triangle) + "Failed to send. Check your connection."
  - "Retry" button on the right (secondary style, alert color)
- The original message text remains in the textarea so the user doesn't lose it
- The Send button returns to normal state

**Success state:**
- Brief toast notification: "Sent" with checkmark (use existing toast pattern)
- Message appears in the thread with "Just now" timestamp
- Textarea clears

Show all three states as separate frames in the prototype for the conversation detail view.
```

---

## Prompt 7: Sync Status Indicator

```
Add a sync status indicator to the home page header area.

Design requirements:
- Position: in the header row, after the "New message" button, before the Settings button
- Compact display: small refresh icon (12-14px) + muted text showing last sync time
- Text examples: "Just synced", "2 min ago", "15 min ago"
- On hover: the refresh icon subtly highlights
- On click: triggers a manual refresh

**While syncing:**
- The refresh icon spins (CSS animation)
- Text changes to "Syncing..."
- Click is disabled during sync

**Sync error state:**
- Icon changes to alert/warning icon in alert color
- Text: "Sync error"
- Clicking retries the sync

This should be unobtrusive — a small utility element, not a prominent feature.
Match the visual weight of the existing "Demo mode" badge.
```

---

## Prompt 8: Connection Lost / Offline Banner

```
Add an offline state banner that appears when the app loses connection to the backend.

Design requirements:
- Position: fixed banner at the top of the viewport, above all content
- Full width, compact height (~40px)
- Background: alert tint color (the muted red/orange)
- Content:
  - Wifi-off icon
  - Text: "You're offline. Some features may not work."
  - "Retry" button on the right (small, ghost style)
- The banner should push content down, not overlay it
- When connection is restored: banner slides up and disappears, optional toast "Back online"

Show this as an overlay state that can appear on any page.
The tone should be informative, not alarming — connection issues happen.
```

---

## Prompt 9: Empty State - No Platforms Connected

```
Add an empty state for the inbox when the user has signed in but hasn't connected any platforms yet.

Design requirements:
- Use the same empty state container as "All clear" (centered, with illustration area)
- Illustration placeholder: "connect puzzle pieces" or "link/chain" concept
- Headline: "No platforms connected"
- Subtext: "Connect Gmail, Slack, or WhatsApp to see your messages here."
- Primary action button: "Connect a platform" — clicking opens Settings to the Connected platforms section
- Secondary link below: "Learn more about connections"

This replaces the conversation list when there are zero connected platforms.
The tone should be encouraging ("you're one step away") not scolding.
```

---

## Prompt 10: Dynamic User Name Areas

```
Update all hardcoded "Maya" references to show a placeholder pattern for dynamic user names.

Locations to update:
1. Welcome dialog headline: "Hi Maya, welcome to Coms" → "Hi {name}, welcome to Coms"
2. Home page greeting bar: "Welcome back to Coms, Maya" → "Welcome back to Coms, {name}"
3. Settings account section: Show the avatar, name, and email as a connected unit that would come from the logged-in user

For the Settings account section specifically:
- Keep the current layout (avatar, name, email, logout button)
- But make it clear this is the "logged-in user" area, not hardcoded Maya
- Add a subtle "Signed in as" label above the account row

These are display-only changes — no new interactions needed.
Use "{name}" as the placeholder text to indicate dynamic content.
```

---

## Usage Notes

**Order of prompts:**
1. Start with Prompt 1 (Login) and Prompt 2 (Platform Connections) — these are P0 blockers
2. Then Prompt 3 (Onboarding) to complete the auth flow
3. Then Prompts 4-5 (Loading skeletons) for async handling
4. Then Prompts 6-8 (Send states, sync, offline) for real-time feedback
5. Finally Prompts 9-10 (Empty state, dynamic names) for polish

**After generating:**
Each prompt creates new screens or components. After generation:
1. Export the updated design
2. Follow the standard Claude Design handoff process in CLAUDE.md
3. The implementation will wire these to the real API responses

**Consistency checks:**
- All new UI should use existing Nocturne components (Button, Tag, Input, Card)
- Colors should only use the existing palette (accent, neutral, alert tones)
- Icons should be from Phosphor (the existing icon set)
- Spacing should follow the 8px grid used throughout
