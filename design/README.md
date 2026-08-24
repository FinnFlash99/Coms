# Design Files

This folder contains exports from [Claude Design](https://claude.ai/design).

## Structure

```
design/
├── Coms.dc.html          # Main design file (open in browser to view)
├── _ds/                  # Design system (Nocturne)
│   └── nocturne-*/
│       ├── styles.css    # All CSS variables and components
│       ├── readme.md     # Design system documentation
│       └── ...
├── support.js            # Claude Design runtime
├── image-slot.js         # Image handling
├── uploads/              # Files uploaded to Claude Design
└── local/                # Local customizations (preserved on update)
```

## Viewing the Design

Open `Coms.dc.html` in a browser to view the interactive design.

## Updating from Claude Design

When you make changes in Claude Design and export a new version:

```bash
./scripts/update-design.sh ~/Downloads/your-export.zip
```

This will:
1. Backup the current `design/` folder
2. Extract the new export
3. Preserve any files in `design/local/`

## Design System: Nocturne

The app uses the **Nocturne** design system — a quiet, compact dark interface.

- **Accent:** Blurple (#9184d9)
- **Typography:** Inter (headings and body)
- **Style:** 8px radii, outlined (never filled) primary buttons, tonal ramps instead of ad-hoc saturation

See `_ds/nocturne-*/readme.md` for full design system documentation.

## Using in Code

Link the design system CSS in your HTML:

```html
<link rel="stylesheet" href="design/_ds/nocturne-{id}/styles.css">
```

Use CSS variables for colors, spacing, typography:

```css
color: var(--color-accent);
font-family: var(--font-heading);
padding: var(--space-4);
```
