# Getting Started with Coms

This tutorial walks you through setting up the Coms project and exploring the design prototype.

## What You'll Accomplish

By the end of this tutorial, you will have:

1. Cloned the repository
2. Viewed the interactive design prototype
3. Explored the design system
4. Understood the project structure

## Prerequisites

- Git installed
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A code editor (VS Code, Cursor, or similar)

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Finn-Comms
```

## Step 2: View the Design Prototype

Open the interactive design file in your browser:

```bash
open design/Coms.dc.html
```

Or manually open `design/Coms.dc.html` in your browser.

**What you'll see:**

- The welcome/onboarding screen
- Main inbox view with conversation tabs (All, Unread, Needs Response, Done, Urgent)
- Demo data with realistic conversations
- Action buttons for managing messages
- Light/dark theme toggle

**Try this:**
1. Click through the tabs to see different conversation filters
2. Look at how conversations are grouped by contact
3. Notice the platform badges (Slack, Email, WhatsApp)
4. Toggle between light and dark themes

## Step 3: Explore the Design System

The project uses the Industry design system — a wireframe/blueprint aesthetic.

Open the design system documentation:

```bash
open design/_ds/industry-*/readme.md
```

Or browse to `design/_ds/industry-38d33b4e-b88e-4a40-acf0-47d74689c7ea/readme.md`.

**Key visual elements:**
- Steel-blue accent color (`#5980a6`)
- Square corners (no rounded edges)
- Hairline borders
- Blueprint registration marks (`+`) at corners
- Barlow typography family

## Step 4: Review the Project Structure

```
Finn-Comms/
├── design/                 # Claude Design exports
│   ├── Coms.dc.html        # Interactive prototype (open in browser)
│   └── _ds/industry-*/     # Design system CSS and docs
├── docs/                   # Documentation (you are here)
├── scripts/                # Automation scripts
│   └── update-design.sh    # Update design from exports
└── src/                    # Application code (not yet created)
```

The project is currently in the **design/specification phase**. There is no application code yet — the `src/` directory will be created when implementation begins.

## Step 5: Read the Product Specification

Review the complete product specification:

```bash
open docs/reference/product-specification.md
```

This document defines:
- The problem Coms solves
- The target user (Maya, a freelancer)
- Features for MVP and Phase 2
- UI layout and visual direction
- Data model

## What's Next?

Now that you've explored the project:

- **To understand the architecture:** Read [Architecture Overview](../explanation/architecture.md)
- **To learn the data model:** Read [Data Model Reference](../reference/data-model.md)
- **To update the design:** See [How to Update the Design](../how-to/update-design.md)
- **When implementation begins:** This tutorial will be updated with build and run instructions

## Current Project Status

The project is ready for implementation. The next phase will involve:

1. Setting up a JavaScript build system
2. Creating the `src/` directory structure
3. Implementing the MVP features from the specification
4. Integrating the Industry design system CSS

---

**Completed:** You've successfully set up and explored the Coms project.
