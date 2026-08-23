# Design System: Industry

Coms uses the **Industry** design system — a wireframe/blueprint aesthetic with steel-blue accents on a light technical ground.

## Visual Identity

| Element | Value |
|---------|-------|
| **Accent color** | Steel-blue `#5980a6` |
| **Background (light)** | `#f2f2f3` |
| **Background (dark)** | `#191b1e` |
| **Text color** | `#1d1f20` |
| **Typography (headings)** | Barlow Condensed |
| **Typography (body)** | Barlow |
| **Corners** | Square — no rounded corners |
| **Borders** | Hairline |
| **Icons** | Lucide, stroke-width 1.5 |

## Blueprint Aesthetic

Cards, figures, and primary buttons are styled as wireframe/blueprint objects:

- Square corners
- Transparent backgrounds with hairline borders
- `+` registration marks at corners (the `.blueprint` class)
- The primary button is the one solid accent-filled element

## Using the Design System

### Link the Stylesheet

```html
<link rel="stylesheet" href="design/_ds/industry-{id}/styles.css">
```

The design system ID is in the directory name (e.g., `industry-38d33b4e-b88e-4a40-acf0-47d74689c7ea`).

### CSS Variables

Use variables rather than hard-coded values:

```css
/* Colors */
color: var(--color-text);
background: var(--color-bg);
border-color: var(--color-accent);

/* Color ramps (100-900) */
background: var(--color-accent-100);  /* Light tint */
color: var(--color-accent-500);       /* Base */
color: var(--color-accent-700);       /* Dark (for text) */

/* Typography */
font-family: var(--font-heading);
font-family: var(--font-body);

/* Spacing */
padding: var(--space-4);
margin: var(--space-2);

/* Shadows */
box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);
box-shadow: var(--shadow-lg);

/* Radius */
border-radius: var(--radius-sm);
```

## Components

| Class | Purpose | Documentation |
|-------|---------|---------------|
| `.btn` | Buttons (with variants) | `components/buttons.html` |
| `.btn-primary` | Primary action button | |
| `.btn-secondary` | Secondary action | |
| `.btn-ghost` | Ghost/text button | |
| `.btn-icon` | Icon-only button | |
| `.tag` | Small labels | `components/buttons.html` |
| `.field` | Form field wrapper | `components/forms.html` |
| `.input` | Text input | |
| `.card` | Content card | `components/cards.html` |
| `.nav` | Navigation bar | `components/navigation.html` |
| `.table` | Data table | `components/table.html` |
| `.dialog` | Modal dialog | `components/dialog.html` |
| `.blueprint` | Blueprint frame | `components/cards.html` |
| `.duotone` | Image wrapper | `foundations/image.html` |

### Blueprint Frame

Apply to cards, figures, and framed elements:

```html
<div class="card blueprint">
  <i class="corner tl"></i>
  <i class="corner tr"></i>
  <i class="corner bl"></i>
  <i class="corner br"></i>
  <!-- content -->
</div>
```

### Buttons

```html
<button class="btn btn-primary blueprint">
  <i class="corner tl"></i>
  <i class="corner tr"></i>
  <i class="corner bl"></i>
  <i class="corner br"></i>
  Primary Action
</button>

<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-ghost">Ghost</button>
```

## Interaction States

Built-in states — do not restyle:

- **Hover:** Tint from accent ramp
- **Pressed:** One step past base (`--color-accent-600` on light)
- **Focus:** `outline: 2px solid var(--color-accent); outline-offset: 2px`
- **Disabled:** 45% opacity
- **Selection:** Accent tint

## Do

- Frame cards, figures, and primary buttons as blueprint objects
- Keep grid visible — equal cells, strong horizontal/vertical rhythm
- Use Barlow Condensed for headings, Barlow for body
- Wrap photographs in `.duotone` class

## Don't

- Don't round cards, figures, or buttons
- Don't give cards/figures a surface fill
- Don't drop registration marks from framed elements
- Don't use thick icon strokes (Lucide at 1.5)
- Don't add decorative color beyond steel-blue accent

## Files

| File | Purpose |
|------|---------|
| `styles.css` | All CSS variables and component classes |
| `readme.md` | Complete design system guide |
| `theme.json` | Machine-readable theme parameters |
| `foundations/*.html` | Type, color, layout, icons, image treatment |
| `components/*.html` | Button, form, card, nav, table, dialog examples |
| `templates/` | Starter page templates |

---

**Primary source:** `design/_ds/industry-*/readme.md`

**Design prototype:** `design/Coms.dc.html` (open in browser)

See also: [How to Update the Design](../how-to/update-design.md)
