# Coms Documentation

Welcome to the Coms documentation. This is a unified inbox application that aggregates messages from all platforms into one place.

## Documentation Organization

This documentation follows the [Diátaxis framework](https://diataxis.fr/), organized by reader need:

| Section | Purpose | When to use |
|---------|---------|-------------|
| [Tutorials](tutorials/) | Learn through guided experience | New to Coms? Start here |
| [How-to Guides](how-to/) | Accomplish specific tasks | Need to do something specific |
| [Reference](reference/) | Look up technical details | Need precise specifications |
| [Explanation](explanation/) | Understand concepts and decisions | Want to understand why |

## Quick Links

### Getting Started
- [Getting Started Tutorial](tutorials/getting-started.md) — Set up and explore Coms

### Key Reference
- [Project Structure](reference/project-structure.md) — Repository layout and file purposes
- [Data Model](reference/data-model.md) — Contact, Conversation, and Message schemas
- [Design System](reference/design-system.md) — Nocturne design system usage
- [Product Specification](reference/product-specification.md) — Complete feature specification

### Development
- [Updating the Design](how-to/update-design.md) — Import new Claude Design exports
- [Maintaining Documentation](how-to/maintain-documentation.md) — Keep docs accurate

### Understanding Coms
- [Architecture Overview](explanation/architecture.md) — System design and boundaries
- [Design Decisions](explanation/design-decisions.md) — Why Coms is built this way

---

## Where Should This Information Go?

Use this guide when adding new documentation:

| Information Type | Category | Example |
|------------------|----------|---------|
| Step-by-step learning for newcomers | Tutorial | "Your first local setup" |
| How to accomplish a specific task | How-to | "How to add a new platform" |
| Technical specifications | Reference | "Environment variables" |
| Concepts, rationale, architecture | Explanation | "Why grouped by contact" |

**Rules:**
- One authoritative location per fact
- Link rather than duplicate
- Update existing docs before creating new ones
- Keep tutorials focused on learning, not reference
- Keep reference factual, not explanatory
