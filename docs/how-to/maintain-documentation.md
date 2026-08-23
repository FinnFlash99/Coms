# How to Maintain Documentation

This guide explains how to keep documentation accurate as the codebase evolves.

## Documentation Structure

Documentation is organized using the [Diátaxis framework](https://diataxis.fr/):

```
docs/
├── README.md           # Documentation landing page
├── tutorials/          # Learning-oriented (guided experiences)
├── how-to/             # Task-oriented (accomplish specific goals)
├── reference/          # Information-oriented (technical specifications)
└── explanation/        # Understanding-oriented (concepts and decisions)
```

## When to Update Documentation

Update documentation whenever you change:

- User-visible behavior
- Developer workflows
- APIs or interfaces
- Configuration or environment variables
- Data models or schemas
- Infrastructure or deployment
- Integrations
- Operational procedures
- Architecture or design

## How to Classify New Documentation

Before creating a new document, determine which category it belongs to:

| If the reader needs to... | Category | Example |
|---------------------------|----------|---------|
| Learn through a guided experience | Tutorial | "Getting started with Coms" |
| Accomplish a specific task | How-to | "How to add a new platform" |
| Look up technical details | Reference | "Environment variables" |
| Understand concepts or decisions | Explanation | "Why grouped by contact" |

## Workflow for Every Code Change

1. **Review your changes** — What truth changed?
2. **Search existing docs** — Is this already documented?
3. **Update existing documentation** — Don't create duplicates
4. **Create new documentation only if needed** — Classify it correctly
5. **Verify accuracy** — Commands, examples, paths must be correct
6. **Check cross-links** — Update any broken references
7. **Remove obsolete content** — Delete stale information

## Rules

### One Authoritative Location

Each fact should have one canonical source:

- **Good:** "See [Data Model](../reference/data-model.md) for field definitions"
- **Bad:** Duplicating the data model definition in three different docs

### Documentation Describes Current Reality

- Update documentation, don't append contradictory notes
- Remove obsolete instructions
- Fix stale examples
- Git provides history — docs describe the current system

### Verify Before Committing

- Test commands actually work
- Check file paths exist
- Ensure examples match implementation
- Verify links resolve

### Link Rather Than Duplicate

When information exists elsewhere:

- Link to the authoritative source
- Provide enough context for the reader to know what they'll find
- Don't create partial copies that will drift

## Where Key Information Lives

| Information | Location |
|-------------|----------|
| Product features and requirements | `docs/reference/product-specification.md` |
| Data model fields and types | `docs/reference/data-model.md` |
| Design system CSS and components | `docs/reference/design-system.md` |
| Repository structure | `docs/reference/project-structure.md` |
| Architecture and design rationale | `docs/explanation/architecture.md` |
| Design system source | `design/_ds/industry-*/readme.md` |

## README Files

README files should **orient and route**, not become documentation dumping grounds:

- **Root README** — What is this? How to start? Links to docs
- **Directory READMEs** — Purpose of this directory, links to relevant docs

Move lengthy content to the appropriate Diátaxis document.

## Generated Reference

When possible, reference generated/canonical sources rather than manually maintaining duplicates:

- API specifications
- Type definitions
- CLI help output
- Configuration schemas

Document where the canonical source lives and how to access it.

---

**See also:**
- [Documentation Rules](../../.claude/rules/documentation.md) for AI coding agent guidelines
- [docs/README.md](../README.md) for the documentation landing page
