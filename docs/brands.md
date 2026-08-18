# Brands

A brand is a token override, not a fork of the design system.

```
brands/{slug}/
  brand.json    source of truth
  brand.css     generated — do not edit
  logo.svg      currentColor <symbol> sprite
```

## Create

```bash
node scripts/new-brand.js acme --name "Acme Capital"
node scripts/validate-brand.js brands/acme
```

Then edit `brand.json` (start from the Riverton copy the scaffold writes) and replace `logo.svg`.

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

Only keys in `scripts/generate-brand-css.js` `TOKEN_MAP` become CSS variables. Spacing, type scale, and weights stay in `design-system/tokens/`.

| JSON | CSS |
|---|---|
| `colors.primary` | `--color-primary` |
| `colors.tertiary` | `--color-tertiary` (default slide background) |
| `colors.text` / `colors.textOnPrimary` | body ink / ink on primary slides |
| `fonts.display` / `fonts.base` | `--font-family-display` / `--font-family-base` |
| `borderRadius.*` | `--border-radius-*` |
| `borderSize.card.*` / `borderSize.alert.*` | card and alert stroke widths |

Colors must be `rgb()`, `rgba()`, or `#rrggbb`. `validate-brand.js` checks WCAG AA for text on tertiary, textOnPrimary on primary, and text on surface.

## Logo sprite

Match `assets/logos/placeholder-logo.svg`: a `<symbol id="{slug}-logo">` with `fill="currentColor"` on paths. Deck HTML uses:

```html
<use href="{slug}-logo.svg#{slug}-logo" />
```

Keep `viewBox` in sync with the wrapping `<svg viewBox>`.

## Figma

Add a **Primitives** mode named after the brand (see [figma.md](figma.md)). Do not duplicate Color / Spacing / Radius collections. Create `__Logo/{Brand}` from the flattened sprite and bind fills to `color/text-strong`.
