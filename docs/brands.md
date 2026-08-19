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

Only keys in `scripts/generate-brand-css.js` `TOKEN_MAP` become CSS variables. Spacing, type scale, and weights stay in `design-system/tokens/`.

`design-system/tokens/colors.css` holds the **same role names** as `brand.json` (a fallback when no `brand.css` is loaded) plus opacity variants (`-strong` / `-base` / `-subtle`). There is no `primary` / `secondary` / `tertiary` layer.

Colors must be `rgb()`, `rgba()`, or `#rrggbb`. `validate-brand.js` checks WCAG AA for **slide foreground on slide background**, **cover foreground on cover background**, **slide surface foreground on slide surface background**, and **cover surface foreground on cover surface background**.

### Color tokens

Pick colors by **role on the slide**. Cover and content slide are independent canvases; surfaces (cards) have their own fill and ink.

| `brand.json` | CSS | What you see |
|---|---|---|
| `colors.cover.background` | `--color-cover-background` | Title/cover fill. `<slide class="bg-cover">` in every `presets/deck-titles/*.html`. |
| `colors.cover.foreground` | `--color-cover-foreground` | Ink on the cover. Pair with `background`. Opacity variants: `-strong` (100%), `-base` (70%), `-subtle` (50%). Use `.color-cover-foreground-*`. |
| `colors.cover.surfaceBackground` | `--color-cover-surface-background` | Card fill on a cover (`.bg-cover-surface`). |
| `colors.cover.surfaceForeground` | `--color-cover-surface-foreground` | Ink on a card that sits on the cover. |
| `colors.slide.background` | `--color-slide-background` | Default content-slide canvas. `<slide>` fill. `.bg-slide`. |
| `colors.slide.foreground` | `--color-slide-foreground` | Ink on the content canvas. Slide Title, section titles, body `<text>`, footer logos. `.color-slide-foreground-*`. |
| `colors.slide.surfaceBackground` | `--color-slide-surface-background` | Cards, Quick Fact Card, `<attribution-box>`, `<alert>` fill. `.bg-slide-surface`. |
| `colors.slide.surfaceForeground` | `--color-slide-surface-foreground` | Ink on those panels (QFC, attribution, alert copy). |
| `colors.slide.surfaceBorder` | `--color-slide-surface-border` | Card stroke and attribution separator. `.border-color-slide-surface`. |
| `colors.highlight` | `--color-highlight` | Default `<alert>` left border and `.color-highlight` / `.bg-highlight`. Independent of cover fill. |
| `colors.status.*.color` / `background` | `--color-positive` … `--color-informative-bg` | Alert variants and `.color-positive` etc. |
| `colors.charts.chart1`…`chart4` | `--color-chart-*` | `.color-chart-*` utilities. No chart component in the library yet. |

**Typical mapping:** title slide → `cover.*`; content slides → `slide.*`; cards → `slide.surface*`; alert stripe → `highlight` (often the same as `cover.background`).

### Other `brand.json` fields

### Font tokens

Each text role has its own family and sizes (except cover title, whose sizes are driven by the cover presets).

| `brand.json` | CSS | HTML |
|---|---|---|
| `fonts.coverTitle.family` | `--font-family-cover-title` | `family="cover-title"` |
| `fonts.slideTitle.family` | `--font-family-slide-title` | `<slide-title-main>` |
| `fonts.slideTitle.sizeLg/Md/Sm` | `--slide-title-main-size-lg/md/sm` | `size="lg"` etc. |
| `fonts.cardTitle.family` | `--font-family-card-title` | `<quick-fact-card-title>` |
| `fonts.cardTitle.sizeLg/Md/Sm` | `--card-title-size-lg/md/sm` | |
| `fonts.paragraphTitle.family` | `--font-family-paragraph-title` | `<section-title>` |
| `fonts.paragraphTitle.sizeLg/Md/Sm` | `--paragraph-title-size-lg/md/sm` | `size="lg"` etc. |
| `fonts.body.family` | `--font-family-body` | `<text>`, `<copy>` |
| `fonts.body.sizeLg/Md/Sm` | `--body-size-lg/md/sm` | `<copy size="lg">` etc. |

### Other `brand.json` fields

| JSON | CSS |
|---|---|
| `borderRadius.*` | `--border-radius-*` |
| `borderSize.card.*` / `borderSize.alert.*` | card and alert stroke widths |

## Logo sprite

Match `assets/logos/placeholder-logo.svg`: a `<symbol id="{slug}-logo">` with `fill="currentColor"` on paths. Deck HTML uses:

```html
<use href="{slug}-logo.svg#{slug}-logo" />
```

Keep `viewBox` in sync with the wrapping `<svg viewBox>`.

## Figma

Add a **Primitives** mode named after the brand (see [figma.md](figma.md)). Do not duplicate Color / Spacing / Radius / Typography collections. Write primitive font families (`font-family/cover-title`, `font-family/slide-title`, `font-family/card-title`, `font-family/paragraph-title`, `font-family/body`) using the first quoted family from `brand.json` (e.g. `"Inter"` not the CSS stack). Create `__Logo/{Brand}` from the flattened sprite and bind fills to `color/slide-foreground-strong`. Logo wordmarks are not bound to the family variables.
