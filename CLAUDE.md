# Coms

A unified inbox that aggregates messages from all platforms into one place. At a glance, the user knows the status of everything.

## Quick Reference

| Resource | Location |
|----------|----------|
| Documentation | [`docs/README.md`](docs/README.md) |
| Product specification | [`docs/reference/product-specification.md`](docs/reference/product-specification.md) |
| Design prototype | `design/Coms.dc.html` (open in browser) |
| Design system | [`docs/reference/design-system.md`](docs/reference/design-system.md) |

## Project Context

**Problem:** App-switching anxiety — no single place shows the status of all communications.

**Solution:** One place to see every message across platforms with instant status visibility.

**Primary User:** Freelancers managing multiple clients across Slack, Email, WhatsApp, etc.

**Status:** Design/specification phase. No application code yet.

## Essential Commands

```bash
# View the design prototype
open design/Coms.dc.html

# Update design from Claude Design export
./scripts/update-design.sh ~/Downloads/export.zip
```

## Project Structure

```
Finn-Comms/
├── design/                 # Claude Design exports
│   ├── Coms.dc.html        # Interactive prototype
│   └── _ds/industry-*/     # Design system (CSS, components)
├── docs/                   # Documentation (Diátaxis structure)
│   ├── tutorials/          # Learning-oriented
│   ├── how-to/             # Task-oriented
│   ├── reference/          # Technical specifications
│   └── explanation/        # Concepts and decisions
├── scripts/                # Automation scripts
└── src/                    # Application code (not yet created)
```

## Design System: Industry

Wireframe/blueprint aesthetic — steel-blue on light/dark grounds.

- **Accent:** `#5980a6`
- **Typography:** Barlow Condensed (headings), Barlow (body)
- **Style:** Square corners, hairline borders, registration marks (+)
- **Icons:** Lucide, stroke-width 1.5

## Documentation Maintenance

**Documentation is part of implementation.**

Before completing any task, evaluate documentation impact. If behavior, APIs, configuration, or architecture changed, update the relevant documentation in the same change.

See: [`.claude/rules/documentation.md`](.claude/rules/documentation.md) for detailed guidelines.

## Key Principles

- Emoji support throughout (contact names, categories, statuses)
- Categories and contact types are user-customizable
- Prototype uses simulated data (no real platform integrations yet)
- Desktop-first responsive design
