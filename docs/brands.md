# Brands

A brand is a token override, not a fork of the design system.

```
brands/{slug}/
  brand-settings.json                source of truth
  brand.css                 generated — do not edit
  {slug}-logo.svg           default lockup, baked fills
  {slug}-logo-inverted.svg  light lockup for dark backgrounds
```

## Create

```bash
node scripts/new-brand.js acme --name "Acme Capital"
node scripts/validate-brand.js brands/acme
```

Then edit `brand-settings.json` (start from the Riverton copy the scaffold writes) and replace `{slug}-logo.svg` and `{slug}-logo-inverted.svg`.

`slides.json` selects the brand:

```json
{
	"title": "Acme Q3 Review",
	"brand": "acme",
	"slides": ["01.html"]
}
```

`compile-deck.js` regenerates `brand.css` and injects it into `index.html`.

## `brand-settings.json` fields

Only keys in `scripts/generate-brand-css.js` `TOKEN_MAP` become CSS variables. Spacing and the type scale stay in `design-system/tokens/`. Brand font sizes pick a type-scale step (`800`, `400`, …); they do not set pixels.

`design-system/tokens/colors.css` holds the **same role names** as `brand-settings.json` (a fallback when no `brand.css` is loaded) plus opacity variants (`-strong` / `-base` / `-subtle`). There is no `primary` / `secondary` / `tertiary` layer.

Colors must be `rgb()`, `rgba()`, or `#rrggbb`. `validate-brand.js` checks WCAG AA for **slide foreground on slide background**, **cover foreground on cover background**, **slide surface foreground on slide surface background**, and **cover surface foreground on cover surface background**.

### Color tokens

Pick colors by **role on the slide**. Cover and content slide are independent canvases; surfaces (cards) have their own fill and ink.

| `brand-settings.json` | CSS | What you see |
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

### Font tokens

Each text role has its own family and weight. **Sizes in `brand-settings.json` are type-scale steps**, not pixels. The scale lives in `design-system/tokens/typography.css` (`--text-size-800` = 32px, `--text-size-400` = 16px, …). `<slide-title-main size="lg">` uses whatever step `fonts.slideTitle.sizeLg` names.

Weight is a CSS number matching the `@font-face` files in `design-system/tokens/fonts.css`:

| Weight | File |
|---|---|
| `400` | Regular |
| `500` | Medium |
| `600` | SemiBold |
| `700` | Bold |

| `brand-settings.json` | CSS | HTML |
|---|---|---|
| `fonts.coverTitle.family` | `--font-family-cover-title` | `family="cover-title"` |
| `fonts.coverTitle.weight` | `--font-weight-cover-title` | default for cover titles |
| `fonts.slideTitle.family` | `--font-family-slide-title` | `<slide-title-main>` |
| `fonts.slideTitle.weight` | `--font-weight-slide-title` | default for slide titles |
| `fonts.slideTitle.sizeLg/Md/Sm` | `--slide-title-main-size-lg/md/sm` → `var(--text-size-*)` | `size="lg"` etc. |
| `fonts.slideTitlePre.weight` | `--font-weight-slide-title-pre` | `<slide-title-pre>` |
| `fonts.slideTitlePre.size` | `--slide-title-pre-size` → `var(--text-size-*)` | |
| `fonts.slideTitleSub.weight` | `--font-weight-slide-title-sub` | `<slide-title-sub>` |
| `fonts.slideTitleSub.size` | `--slide-title-sub-size` → `var(--text-size-*)` | |
| `fonts.cardTitle.family` | `--font-family-card-title` | `<quick-fact-card-title>` |
| `fonts.cardTitle.weight` | `--font-weight-card-title` | |
| `fonts.cardTitle.sizeLg/Md/Sm` | `--card-title-size-lg/md/sm` → `var(--text-size-*)` | |
| `fonts.cardPretitle.weight` | `--font-weight-card-pretitle` | `<quick-fact-card-pretitle>` |
| `fonts.cardPretitle.size` | `--card-pretitle-size` → `var(--text-size-*)` | |
| `fonts.paragraphTitle.family` | `--font-family-paragraph-title` | `<section-title>` |
| `fonts.paragraphTitle.weight` | `--font-weight-paragraph-title` | |
| `fonts.paragraphTitle.sizeLg/Md/Sm` | `--paragraph-title-size-lg/md/sm` → `var(--text-size-*)` | `size="lg"` etc. |
| `fonts.body.family` | `--font-family-body` | `<text family="body">` |
| `fonts.body.weight` | `--font-weight-body` | default body ink weight |

Body and cover titles use the scale **in HTML** (`<text size="400">`, `<text size="1600">`). Brands do not remap those steps.

Example — make slide-title `lg` use scale 800 (32px) instead of the default 1200 (48px):

```json
"slideTitle": {
  "family": "\"DM Sans\", system-ui, sans-serif",
  "weight": 600,
  "sizeLg": 800,
  "sizeMd": 1000,
  "sizeSm": 800
}
```

### Other `brand-settings.json` fields

| JSON | CSS |
|---|---|
| `borderRadius.*` | `--border-radius-*` |
| `borderSize.card.*` / `borderSize.alert.*` | card and alert stroke widths |

## Logos

Each brand ships two standalone SVGs with **baked fills** (no `currentColor`, no `<symbol>` sprite):

| File | Use |
|---|---|
| `{slug}-logo.svg` | Default lockup on light backgrounds |
| `{slug}-logo-inverted.svg` | Light lockup on dark backgrounds |

Presets use `<img data-logo="cover|slide|slide-surface">`. The showcase (and later deck generation) picks default vs inverted from the luminance of that surface token. Do not wrap brand logos in `color-*` classes.

The Gratia mark inside `<attribution-box>` is a separate prepared-by lockup (`<img data-slot="logo">`); leave it alone.

## Figma

Add a **Primitives** mode named after the brand (see [figma.md](figma.md)). Do not duplicate Color / Spacing / Radius / Typography collections. Write primitive font families (`font-family/cover-title`, `font-family/slide-title`, `font-family/card-title`, `font-family/paragraph-title`, `font-family/body`) using the first quoted family from `brand-settings.json` (e.g. `"Inter"` not the CSS stack). Create `__Logo/{Brand}` from `{slug}-logo.svg` (baked fills; do not bind paths to `color/slide-foreground-strong`). Logo wordmarks are not bound to the family variables.
