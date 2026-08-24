# Design System: Nocturne

Coms uses the **Nocturne** design system — a quiet, compact dark interface: a near-neutral blue-grey ground, Inter at medium weight, soft 8px radii, and a blurple accent used as a line and a glow rather than a flood.

## Visual Identity

| Element | Value |
|---------|-------|
| **Accent color** | Blurple `#9184d9` |
| **Background (dark, default)** | `#161826` |
| **Surface (dark)** | `#232532` |
| **Background (light)** | `#f4f5fb` |
| **Surface (light)** | `#fbfbfe` |
| **Text color (dark)** | `#e9e9ed` |
| **Text color (light)** | `#22242e` |
| **Typography (headings)** | Inter, weight 500 (never bolder — hierarchy is size and space) |
| **Typography (body)** | Inter |
| **Corners** | 8px radius (`--radius-sm/md/lg`) |
| **Borders** | Hairline, 1px |
| **Icons** | Phosphor |

Nocturne is dark-only by design; light mode is derived by inverting the tonal ramps (see `html[data-theme="light"]` in `design/Coms.dc.html`).

## Color Ramps

Each role (`neutral`, `accent`) carries a 100–900 tonal ramp generated in OKLCH on a shared perceptual lightness scale, so the same step of any ramp carries the same visual weight. On the dark ground, use the dark steps (700–900) for tinted fills, hovers, and subtle borders; 500 as the role's base; and the light steps (100–300) for text on those tints and for pressed states. Prefer ramp steps over ad-hoc `color-mix()`.

Keep chroma low outside the accent — don't flood large areas with saturated color. The one place saturation is allowed is platform badges (~18-26% tint background, 62-88% mixed text), each platform keeping its own hue.

## Using the Design System

### Link the Stylesheet

```html
<link rel="stylesheet" href="design/_ds/nocturne-{id}/styles.css">
```

The design system ID is in the directory name (e.g., `nocturne-91aaaa64-e109-471d-96ce-af374af8888d`).

### CSS Variables

Use variables rather than hard-coded values:

```css
/* Colors */
color: var(--color-text);
background: var(--color-bg);
border-color: var(--color-accent);

/* Color ramps (100-900) */
background: var(--color-accent-800);  /* Dark tint, for fills on dark ground */
color: var(--color-accent-500);       /* Base */
color: var(--color-accent-300);       /* Light step, for text on dark ground */

/* Typography */
font-family: var(--font-heading);
font-family: var(--font-body);

/* Spacing (density 0.70x is already baked in) */
padding: var(--space-4);
margin: var(--space-2);

/* Shadows (already tuned to the ground) */
box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);
box-shadow: var(--shadow-lg);

/* Radius (8px base) */
border-radius: var(--radius-sm);
```

## Components

| Class | Purpose | Documentation |
|-------|---------|---------------|
| `.btn` with `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`, `.btn-block` | Buttons — primary is an accent outline, never filled | `components/buttons.html` |
| `.tag` with `.tag-accent`, `.tag-accent-2`, `.tag-neutral`, `.tag-outline` | Small labels tinted from the ramps | `components/buttons.html` |
| `.field` + `label`, `.input`, `.radio` + `.dot`, `.seg` + `.seg-opt` | Form fields and choices on native elements | `components/forms.html` |
| `.card` with `.card-kicker`, `.card-title`, `.card-body`, `.card-meta`; `.elev-sm/md/lg` | Surface-filled content cards; elevation utilities | `components/cards.html` |
| `.nav` + `.nav-brand` | Navigation / header bar | `components/navigation.html` |
| `.table` | Data table with themed header and row rules | `components/table.html` |
| `.dialog-backdrop` + `.dialog` (+ `.dialog-title/-body/-actions`) | Modal at the top elevation | `components/dialog.html` |
| `.hr` | Horizontal rule — present, but this system prefers whitespace; avoid it | — |
| `.lighten` | Image wrapper (`mix-blend-mode: lighten`) — every content photograph goes through it | `foundations/image.html` |

## Interaction States

Built-in states — do not restyle:

- **Hover:** Tint from accent ramp
- **Pressed:** One step past base (`--color-accent-600` on light ground, `--color-accent-400` on dark)
- **Focus:** `outline: 2px solid var(--color-accent); outline-offset: 2px` — never the browser default
- **Disabled:** 45% opacity
- **Selection:** Accent tint

## Do

- Keep chroma low outside the accent — lean on `--color-neutral-*` steps for surfaces, borders, and muted text
- Use the compact spacing scale (density 0.7x) — this system is dense on purpose
- Outline primary actions; let `:focus-visible` carry the accent
- Put photographs through the `.lighten` wrapper; prefer subjects shot on dark backgrounds

## Don't

- Don't flood large areas with the accent or any saturated fill
- Don't use pure black or pure white — every value comes from the ramps
- Don't stack heavy shadows — on a dark ground, elevation is an edge plus ambient darkness
- Don't bolden headings past weight 500

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

**Primary source:** `design/_ds/nocturne-*/readme.md`

**Design prototype:** `design/Coms.dc.html` (open in browser)

See also: [How to Update the Design](../how-to/update-design.md)
