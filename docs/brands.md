# Brands

A brand is a token override, not a fork of the design system.

```
brands/{slug}/
  brand.json       source of truth
  brand.css        generated — do not edit
  {slug}-logo.svg  currentColor <symbol> sprite
```

## Create

```bash
node scripts/new-brand.js acme --name "Acme Capital"
node scripts/validate-brand.js brands/acme
```

Then edit `brand.json` (start from the Riverton copy the scaffold writes) and replace `{slug}-logo.svg`.

`slides.json` selects the brand:

```json
{
	"title": "Acme Q3 Review",
	"brand": "acme",
	"slides": ["01.html"]
}
```

`compile-deck.js` regenerates `brand.css` and injects it into `index.html`.

## `brand.json` fields

Only keys in `scripts/generate-brand-css.js` `TOKEN_MAP` become CSS variables. Spacing, type scale, and weights stay in `design-system/tokens/`. Semantic aliases (`--color-slide-bg`, `--color-text-strong`, …) live in `design-system/tokens/colors.css` and are **not** brand overrides — they follow the primitives below.

Colors must be `rgb()`, `rgba()`, or `#rrggbb`. `validate-brand.js` checks WCAG AA for **text on tertiary**, **textOnPrimary on primary**, and **text on surface**.

### Where color tokens land

Pick Gratia (or any brand) colors by **role on the slide**, not by the JSON key name. `primary` is not “the logo color”; it is the full-bleed cover.

| `brand.json`                           | CSS primitive                | What you see                                                                                                                                                                                                                                                           |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors.primary`                       | `--color-primary`            | **Cover / title slides.** `<slide class="bg-primary">` in every `presets/deck-titles/*.html` and in compiled covers (`01.html`). Also `--color-slide-bg-primary`, the default `<alert>` left border, and the `.color-primary` text utility. Pair with `textOnPrimary`. |
| `colors.tertiary`                      | `--color-tertiary`           | **Default slide canvas.** `<slide>` fill via `--color-slide-bg`. Content slides (overview, etc.) sit on this. Pair with `text`.                                                                                                                                        |
| `colors.surface`                       | `--color-surface`            | **Cards and attribution chips.** `--color-card-bg` on `<card>`, Quick Fact Card, and `<attribution-box>`. White panels on the tertiary canvas.                                                                                                                         |
| `colors.surfaceOnPrimary`              | `--color-surface-on-primary` | Card fill when a card sits on a primary cover (`.bg-card-on-primary` → `--color-card-on-primary-bg`). Unused on current Riverton/Vantage covers (no cards on the title slide).                                                                                         |
| `colors.text`                          | `--color-text`               | **Ink on tertiary/surface.** Aliases: `--color-text-strong` (100%), `--color-text-base` (70%), `--color-text-subtle` (50%). Slide Title main, section titles, QFC titles, body `<text>`, list items, attribution. Logo `currentColor` on content slides.               |
| `colors.textOnPrimary`                 | `--color-text-on-primary`    | **Ink on the cover.** Strong/base/subtle variants for title-slide copy and logos on `bg-primary`. Must pass AA on `primary`.                                                                                                                                           |
| `colors.secondary`                     | `--color-secondary`          | Utility only (`.bg-secondary`, `.color-secondary`). Not wired into default slide chrome. Riverton/Vantage set it equal to ink.                                                                                                                                         |
| `colors.border`                        | `--color-border`             | Card stroke (`--color-card-border`) and attribution separator (`--color-separator`).                                                                                                                                                                                   |
| `colors.positive` / `positiveBg`       | `--color-positive*`          | `<alert variant="positive">` border; `.color-positive` utility.                                                                                                                                                                                                        |
| `colors.warning` / `warningBg`         | `--color-warning*`           | `<alert variant="warning">`; `.color-warning`.                                                                                                                                                                                                                         |
| `colors.negative` / `negativeBg`       | `--color-negative*`          | `<alert variant="negative">`; `.color-negative`.                                                                                                                                                                                                                       |
| `colors.informative` / `informativeBg` | `--color-informative*`       | `<alert variant="informative">`; `.color-informative`. Default `<alert>` (no variant) uses **primary** for the border, not informative.                                                                                                                                |
| `colors.chart1`…`chart4`               | `--color-chart-*`            | `.color-chart-*` utilities. No chart component in the library yet.                                                                                                                                                                                                     |

**Typical mapping:** brand accent → `primary` (covers + alert accent); page background → `tertiary`; card fill → `surface`; body ink → `text`; ink that sits on the accent cover → `textOnPrimary`.

### Other `brand.json` fields

| JSON                                       | CSS                                                               |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `fonts.display` / `fonts.base`             | `--font-family-display` / `--font-family-base` (headings vs body) |
| `borderRadius.*`                           | `--border-radius-*`                                               |
| `borderSize.card.*` / `borderSize.alert.*` | card and alert stroke widths                                      |

## Logo sprite

Match `assets/logos/placeholder-logo.svg`: a `<symbol id="{slug}-logo">` with `fill="currentColor"` on paths. Deck HTML uses:

```html
<use href="{slug}-logo.svg#{slug}-logo" />
```

Keep `viewBox` in sync with the wrapping `<svg viewBox>`.

## Figma

Add a **Primitives** mode named after the brand (see [figma.md](figma.md)). Do not duplicate Color / Spacing / Radius / Typography collections. Write primitive colors **and** `font-family/display` / `font-family/base` (first quoted family from `brand.json`, e.g. `"DM Sans"` not the CSS stack). Create `__Logo/{Brand}` from the flattened sprite and bind fills to `color/text-strong`. Logo wordmarks are not bound to the family variables.
