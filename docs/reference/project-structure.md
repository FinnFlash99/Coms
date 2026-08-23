# Project Structure

This document describes the repository layout and purpose of each directory.

## Directory Layout

```
Finn-Comms/
├── .claude/                    # Claude Code configuration
│   ├── settings.local.json     # Local permissions
│   └── rules/                  # Persistent rules for Claude
│       └── documentation.md    # Documentation maintenance rules
├── .gitignore                  # Git ignore patterns
├── CLAUDE.md                   # Claude Code project context
├── README.md                   # Project entry point
├── design/                     # Claude Design exports
│   ├── Coms.dc.html            # Interactive design prototype
│   ├── README.md               # Design folder documentation
│   ├── _ds/                    # Design system (Industry)
│   │   └── industry-*/         # Design system files
│   │       ├── styles.css      # CSS variables and components
│   │       ├── readme.md       # Design system guide
│   │       └── ...
│   ├── local/                  # Local customizations (preserved on update)
│   ├── support.js              # Claude Design runtime
│   ├── image-slot.js           # Image handling
│   └── uploads/                # Files uploaded to Claude Design
├── docs/                       # Documentation (Diátaxis structure)
│   ├── README.md               # Documentation landing page
│   ├── tutorials/              # Learning-oriented guides
│   ├── how-to/                 # Task-oriented guides
│   ├── reference/              # Technical specifications
│   └── explanation/            # Conceptual understanding
├── scripts/                    # Automation scripts
│   └── update-design.sh        # Update design from export
└── src/                        # Application code (not yet created)
```

## Key Directories

### `/design`

Contains exports from [Claude Design](https://claude.ai/design). The main design prototype is `Coms.dc.html` — open it in a browser to view.

**Important:** Do not manually edit files in this directory except in `local/`. Use `scripts/update-design.sh` to update from new exports.

See: [design/README.md](../../design/README.md)

### `/design/_ds/industry-*/`

The Industry design system — a wireframe/blueprint aesthetic. Contains CSS variables, component classes, and usage documentation.

See: [Design System Reference](design-system.md)

### `/docs`

Documentation organized by the Diátaxis framework. Start at [docs/README.md](../README.md).

### `/scripts`

Automation scripts for the project.

| Script | Purpose |
|--------|---------|
| `update-design.sh` | Import new Claude Design exports |

### `/src` (planned)

Application source code. Not yet created — the project is in the design/specification phase.

## Configuration Files

| File | Purpose |
|------|---------|
| `.gitignore` | Excludes OS files, node_modules, dist, build, .env |
| `CLAUDE.md` | Project context for Claude Code sessions |
| `.claude/settings.local.json` | Local Claude Code permissions |

## Current Project Phase

**Status:** Design & Specification (Pre-Development)

The repository contains:
- Complete product specification
- Interactive design prototype
- Design system integration

The repository does not yet contain:
- Application source code
- Build system (webpack, vite, etc.)
- Package management (package.json)
- Backend/API
- Database
- CI/CD pipeline

See: [Product Specification](product-specification.md) for MVP requirements and build order.
