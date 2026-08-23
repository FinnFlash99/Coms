# Data Model

This document describes the core data structures used in Coms.

## Overview

Coms organizes communications around three core entities:

```
Contact
  └── Conversation (per platform)
        └── Message
```

A **Contact** represents a person Maya communicates with. Each contact may have multiple **Conversations** across different platforms (Slack, Email, WhatsApp, etc.). Each conversation contains **Messages**.

## Contact

Represents a person in Maya's communication network.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name (emoji supported) |
| `type` | ContactType | Relationship type (user-defined) |
| `platforms` | Platform[] | Platforms where contact is reachable |
| `conversations` | Conversation[] | All conversations with this contact |

### Contact Types

Users can assign a type to indicate their relationship with each contact.

**Default types:**
- `Client` — Business client
- `Close` — Friends, close colleagues
- `Subcontractor` — People working for the user
- `Vendor` — Service providers
- `Personal` — Personal contacts
- `Family` — Family members

**Custom types:** Users can create their own contact types in settings.

## Conversation

A thread of messages with a contact on a specific platform.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `contactId` | string | Reference to Contact |
| `platform` | Platform | Where this conversation exists |
| `messages` | Message[] | Messages in this conversation |
| `isRead` | boolean | Has the user seen this conversation? |
| `isResponded` | boolean | Has the user replied? |
| `importance` | Importance | Priority level |
| `category` | string | User-defined category |
| `isTimeSensitive` | boolean | Contains deadline or urgent item |
| `lastMessageTimestamp` | timestamp | When the last message arrived |

## Message

A single message within a conversation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `conversationId` | string | Reference to Conversation |
| `platform` | Platform | Platform this message came from |
| `content` | string | Message text (emoji supported) |
| `timestamp` | timestamp | When the message was sent |
| `direction` | `"inbound"` \| `"outbound"` | Received or sent by user |
| `sender` | string | Who sent the message |
| `isRead` | boolean | Has this specific message been read? |

## Enums

### Platform

Supported communication platforms:

- `email`
- `slack`
- `whatsapp`
- `instagram`
- `imessage`
- `teams`

### Importance

Priority levels (auto-suggested, user-overridable):

- `low`
- `normal`
- `high`

## Status System

Conversations track two independent status dimensions:

| Status | Values | Description |
|--------|--------|-------------|
| Read status | Unread / Read | Has the user seen it? |
| Response status | Needs Response / Responded | Has the user replied? |

**Custom statuses:** Users can define additional status types in settings (e.g., "Needs Action", "Waiting", "Resolved").

## Categories

Categories are user-defined labels for organizing conversations.

**Example category types:**

| Category Type | Examples |
|---------------|----------|
| By platform | Email, Slack, WhatsApp, Teams |
| By relationship | Client, Subcontractor, Vendor |
| By connection strength | Close, Regular, Occasional, New |
| By project | Project Alpha, Website Redesign |
| By priority | High Priority, Normal, Low Priority |
| By response time | Urgent, Standard, When possible |
| By custom label | User-defined |

---

**Source:** [Product Specification](product-specification.md) § 20 (Minimum Data Model)
