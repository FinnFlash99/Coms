# Coms — Product Overview & Build Specification

A complete offline review document for the Coms prototype.

## 1. Problem & Target User

**Problem:** Keeping track of conversations across multiple apps and knowing who still needs attention.

**For whom:** Freelancers managing multiple clients across different communication platforms.

**In one sentence:** Coms helps freelancers keep track of who they need to respond to across multiple apps.

## 2. Product Concept

Coms is a relationship-state tracker, not a unified inbox, CRM, or traditional task manager.

**Core promise:** Open Coms and immediately know which client relationships have something unresolved.

**Core insight:** The problem is not simply that messages live in different apps. The problem is that no single place holds the state of each relationship across those apps.

## 3. Primary User

Maya is the prototype user: a freelancer with multiple active clients and subcontractors who communicates through Slack, email, WhatsApp, Instagram, and similar platforms.

- She has several ongoing client relationships.
- She may communicate with the same person on more than one platform.
- She can forget to respond or follow up.
- She may remember a conversation but forget which app it happened in.
- She wants one calm place to know who still needs attention.

## 4. Relationship States

| State | Description |
|-------|-------------|
| **Needs Action** | Something is unresolved and the user needs to do something. |
| **Waiting** | The user has acted and is waiting on the other person. |
| **Resolved** | Nothing is currently pending. |

## 5. Main Screen

The home screen is the most important screen. It should answer: **"Who do I still need to deal with?"**

- Needs Action contacts appear first.
- Waiting contacts appear second.
- Resolved contacts appear below a divider.
- Within each state, newest activity appears first.
- Each contact shows a state indicator, name, most recent platform, and time since the last message.

**Design notes:**
- Keep the screen calm and minimal.
- Do not add unnecessary statistics, charts, search, settings, or complex navigation.

## 6. Contact Detail

**Display:**
- Contact name and type
- Current relationship state
- Recent conversation history
- Platform for each message
- Message timestamps and sender

**Actions:**
- Open in platform
- Mark Waiting
- Mark Resolved
- Allow Reopen from Resolved

## 7. Cross-Platform Behavior

A person remains one contact even if they communicate through multiple platforms.

**Example:** James may have an email, Slack message, and WhatsApp message. Coms should show these as one relationship rather than three separate contacts.

## 8. Prototype / Demo Mode

The prototype should not pretend to have real access to communication platforms.

- No real Slack, Gmail, WhatsApp, iMessage, Instagram, or Teams integrations.
- Use realistic simulated data.
- Clearly label the app as Demo Mode.
- Explain that the full product would sync communication automatically.
- Include a Simulate Incoming Message feature.

## 9. Simulate Incoming Message

The tester can select a contact, platform, and message, then simulate an incoming message.

**Behavior:**
1. Add the message to the contact.
2. Update the timestamp.
3. Change the contact to Needs Action.
4. Move the contact to the top of the Needs Action section.
5. Update the home screen immediately.

## 10. Core User Loop

```
Communication happens
    → Coms receives or simulates it
    → the relationship becomes Needs Action
    → the user opens Coms
    → sees the unresolved contact
    → opens the conversation context
    → opens the original platform to respond
    → returns to Coms
    → marks Waiting or Resolved
    → the contact moves to its new state
```

## 11. Prototype Data

| Contact | Type | Platforms | State | Latest Message | Time |
|---------|------|-----------|-------|----------------|------|
| Sarah Chen | Client | Slack | Needs Action | Can we move tomorrow's meeting to 3pm? | 25 minutes ago |
| TechCo / James | Client | Email, Slack, WhatsApp | Needs Action | Just checking in — did you get my message? | 2 hours ago |
| Ravi Sharma | Subcontractor | Email, Slack | Waiting | I've sent over the revised files. Let me know what you think. | 4 hours ago |
| Studio Collective | Client | Slack | Waiting | Thanks! We'll review the timeline and get back to you. | 1 day ago |
| Anna K. | Client | Email | Resolved | Perfect, thank you! | 2 days ago |
| Brand Co. | Client | WhatsApp | Needs Action | Could you send us a revised quote? | 3 days ago |

## 12. Minimum Data Model

### Contact

| Field | Type |
|-------|------|
| id | string |
| name | string |
| type | string |
| platforms | string[] |
| state | State |
| lastMessagePreview | string |
| lastMessagePlatform | string |
| lastMessageTimestamp | timestamp |
| messages | Message[] |
| notes | string (optional) |

### Message

| Field | Type |
|-------|------|
| id | string |
| contactId | string |
| platform | Platform |
| content | string |
| timestamp | timestamp |
| direction | string |
| sender | string |

### Enums

- **States:** `needs_action`, `waiting`, `resolved`
- **Platforms:** `email`, `slack`, `whatsapp`, `instagram`, `imessage`, `teams`

## 13. MVP — Must Build

- [ ] Contact list with three-state indicators
- [ ] State-based sorting
- [ ] Divider between unresolved and resolved contacts
- [ ] Contact detail with recent messages and platform labels
- [ ] Needs Action / Waiting / Resolved actions
- [ ] Open in platform simulation
- [ ] Pre-loaded realistic demo data
- [ ] Simulate Incoming Message
- [ ] Demo Mode label

## 14. Nice to Have

- [ ] Notes field
- [ ] Add Contact
- [ ] All-clear state
- [ ] Subtle visual aging for older unresolved items

## 15. Do Not Build Yet

- Real platform integrations
- Authentication
- Subscriptions or payment processing
- AI classification or AI-generated replies
- Notifications
- Search
- Analytics or statistics
- CRM features
- Task-management features
- In-app messaging or reply composer
- Complex settings
- Native mobile app

## 16. Design Principles

1. Minimal and calm
2. Low cognitive load
3. People and relationships first
4. State before recency
5. Make state updates effortless
6. Avoid unnecessary features
7. The user should understand the home screen within 5 seconds

## 17. Success Test

Give a first-time user this scenario:

> "You have been in back-to-back calls since 9am. It is now 4pm. You have 30 minutes before you finish for the day. What do you still need to deal with?"

**Success** means the user can answer the question using Coms in under 30 seconds without guidance.

## 18. Core Value Proposition

Coms is the place that shows a freelancer whether anything is unresolved with each client, regardless of which app the conversation happened in.

## 19. Build Order

1. Data model and simulated data
2. Home screen
3. State sorting logic
4. Contact detail screen
5. State action buttons
6. Cross-platform message history
7. Simulate Incoming Message
8. Demo Mode label
9. Open-in-platform simulation
10. Add Contact, Notes, and All-Clear state if time allows

## 20. Final Product Definition

| Attribute | Value |
|-----------|-------|
| **Name** | Coms |
| **Description** | A relationship-state tracker that helps freelancers know who they still need to respond to across multiple apps. |
| **Primary user** | Freelancers managing multiple clients across different communication platforms. |
| **Original problem** | Keeping track of conversations across multiple apps and knowing who still needs attention. |
| **Core insight** | Coms remembers the state of relationships so the user's brain does not have to. |
| **Prototype goal** | Prove that a single relationship-focused view makes cross-platform communication easier to manage. |
