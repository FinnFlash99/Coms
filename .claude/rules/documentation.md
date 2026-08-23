# Documentation Maintenance Rules

This rule file defines how documentation must be maintained during development.

## Core Principle

**Documentation is part of implementation.** A task is not complete until documentation impact has been evaluated and any affected documentation has been updated.

## Documentation Impact Check

Before completing any task, evaluate:

```
Documentation impact?
[ ] User behavior changed
[ ] Developer workflow changed
[ ] API/interface changed
[ ] Configuration changed
[ ] Environment variable changed
[ ] Data/schema changed
[ ] Infrastructure/deployment changed
[ ] Integration changed
[ ] Operational procedure changed
[ ] Architecture/design changed
[ ] New troubleshooting knowledge discovered
[ ] No documentation impact
```

If any box is checked (except "No documentation impact"), update the relevant documentation in the same change.

## Workflow for Every Code Change

1. **Review actual changes** — What implementation truth changed?
2. **Search docs for affected topics** — Check `docs/`, README files, CLAUDE.md
3. **Update existing documentation** — One authoritative location per fact
4. **Create new documentation only if needed** — Classify using Diátaxis
5. **Verify accuracy** — Commands, paths, examples must match implementation
6. **Check cross-links** — Update any broken references
7. **Remove obsolete content** — Delete stale information
8. **Include documentation changes with implementation** — Same commit/PR

## Diátaxis Classification

Before creating documentation, determine which need it serves:

| Reader Need | Category | Location |
|-------------|----------|----------|
| Learning through guided experience | Tutorial | `docs/tutorials/` |
| Accomplishing a specific task | How-to | `docs/how-to/` |
| Looking up technical details | Reference | `docs/reference/` |
| Understanding concepts/decisions | Explanation | `docs/explanation/` |

Do not create miscellaneous documents outside this structure.

## Documentation Must Describe Current Reality

- **Update** existing docs rather than appending contradictory notes
- **Remove** obsolete instructions immediately
- **Fix** stale examples and commands
- **Rename** documentation when concepts are renamed
- **Delete** documentation for removed functionality

Git provides history. Documentation describes the current system.

## Source of Truth Hierarchy

1. **Code and executable configuration** are the ultimate truth for implemented behavior
2. **Reference documentation** describes what the code does
3. **Explanation documentation** provides rationale and context

When docs disagree with code:
1. Determine which is wrong
2. Fix the incorrect artifact
3. Do not perpetuate the discrepancy

## Search Before Creating

Before creating a new page:

1. Search `docs/` for existing coverage
2. Search README files
3. Determine if an authoritative page already exists
4. **Update that page** rather than creating a duplicate

## README Files

READMEs **orient and route**; detailed documentation lives in `docs/`.

- **Root README** — What is this? Quick start. Links to docs
- **Subdirectory READMEs** — Purpose of directory, links to relevant docs

Move lengthy content to appropriate Diátaxis documents.

## Renaming and Deletion

When renaming a concept, API, package, environment variable, configuration key, or subsystem:

1. Search documentation repository-wide
2. Update all affected references
3. Update cross-links

When deleting functionality:

1. Search for documentation describing it
2. Remove or revise affected documentation

## Verification Checklist

Before committing documentation changes:

- [ ] Commands actually work when executed
- [ ] File paths exist in the repository
- [ ] Examples match the current implementation
- [ ] Internal links resolve correctly
- [ ] No duplicate authoritative sources created
- [ ] Obsolete content has been removed

## What NOT to Document

- Temporary debugging observations with no durable value
- Trivial implementation details
- Every source file (only document meaningful architecture)
- Generated content that has a canonical source elsewhere

## Location Reference

| Information | Authoritative Location |
|-------------|------------------------|
| Project overview | `README.md`, `CLAUDE.md` |
| Documentation map | `docs/README.md` |
| Product specification | `docs/reference/product-specification.md` |
| Data model | `docs/reference/data-model.md` |
| Design system | `docs/reference/design-system.md` |
| Project structure | `docs/reference/project-structure.md` |
| Architecture | `docs/explanation/architecture.md` |
| Design decisions | `docs/explanation/design-decisions.md` |
| Design system source | `design/_ds/industry-*/readme.md` |

## Development Lifecycle with Documentation

```
Understand change
      ↓
Modify implementation
      ↓
Run/verify tests
      ↓
Evaluate documentation impact
      ↓
Update affected documentation
      ↓
Verify documentation against implementation
      ↓
Complete task
```

Documentation maintenance is normal development behavior, not a separate optional phase.
