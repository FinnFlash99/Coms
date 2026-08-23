# Coms

**One place to see the status of all your conversations.**

Coms is a unified inbox that aggregates messages from Slack, Email, WhatsApp, and other platforms into one calm interface. At a glance, you know what needs attention.

## The Problem

Freelancers and professionals communicate across many platforms — Slack with some clients, Email with others, WhatsApp with a few more. The constant app-switching creates anxiety: *"Did I miss something?"*

## The Solution

Coms shows every conversation in one place with instant status visibility:
- **Unread** — Haven't seen it yet
- **Needs Response** — Seen it, haven't replied
- **Done** — Nothing pending
- **Urgent** — Time-sensitive items

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd Finn-Comms

# View the interactive design
open design/Coms.dc.html
```

The design opens in your browser with demo data showing how the app works.

## Project Status

**Phase:** Design & Specification

The repository contains a complete product specification and interactive design prototype. Application code will be added in the next phase.

| Completed | Not Yet Started |
|-----------|-----------------|
| Product specification | Application code |
| Interactive prototype | Build system |
| Design system integration | Platform integrations |
| Documentation | Backend/API |

## Documentation

| Resource | Description |
|----------|-------------|
| [Documentation](docs/README.md) | Full documentation (Diátaxis structure) |
| [Getting Started](docs/tutorials/getting-started.md) | Tutorial for new developers |
| [Product Specification](docs/reference/product-specification.md) | Complete feature spec |
| [Architecture](docs/explanation/architecture.md) | System design overview |

## Design System

Coms uses the **Industry** design system — a wireframe/blueprint aesthetic.

- Steel-blue accent (`#5980a6`)
- Square corners, hairline borders
- Barlow typography
- Lucide icons

See: [Design System Reference](docs/reference/design-system.md)

## Repository Structure

```
Finn-Comms/
├── design/             # Interactive prototype (open Coms.dc.html)
├── docs/               # Documentation
├── scripts/            # Automation (update-design.sh)
└── src/                # Application code (coming soon)
```

## Contributing

This project is in active development. See [Documentation](docs/README.md) for details on the codebase.

## License

[To be determined]
