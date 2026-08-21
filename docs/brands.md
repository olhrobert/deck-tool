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

Generic tokens are grouped by type (`colors`, `fonts`, `borderRadius`, `borderSize`). Component tokens (`card`, `alert`, `slideTitle`, …) keep padding, type, radius, and stroke together. Only keys in `scripts/generate-brand-css.js` `TOKEN_MAP` become CSS variables. The type scale and the **global** spacing scale (`--spacing-0` … `--spacing-40`) stay in `design-system/tokens/`. Font sizes are type-scale steps (`800`, `400`, …); semantic spacing is a spacing-scale step (`20`, `16`, `"0-5"`, …); component radius and stroke name a `borderRadius` / `borderSize` step (`med`, `sm`, …). Pixels appear on those two generic scales and on `slide.maxWidth` (canvas cap, default `1280`).

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
| `colors.cover.surfaceBorder` | `--color-cover-surface-border` | Card stroke on a cover surface. |
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

Named weights (`regular`, `medium`, `bold`) live under `fonts.weights` as CSS numbers matching `@font-face` in `design-system/tokens/fonts.css`. `<text weight="bold">` and `slideTitle.weight: "bold"` both resolve to `fonts.weights.bold`. A brand can map two names to the same number (e.g. medium and bold both 500).

**Sizes are type-scale steps**, not pixels. The scale lives in `design-system/tokens/typography.css` (`--text-size-800` = 32px, `--text-size-400` = 16px, …). `<slide-title-main size="lg">` uses whatever step `slideTitle.sizeLg` names.

| Named weight | Typical file |
|---|---|
| `regular` | Regular (`400`) |
| `medium` | Medium (`500`) |
| `bold` | SemiBold (`600`) or Bold (`700`) — brand-defined |

| `brand-settings.json` | CSS | HTML |
|---|---|---|
| `fonts.weights.regular` | `--font-weight-regular` | `<text weight="regular">` |
| `fonts.weights.medium` | `--font-weight-medium` | `<text weight="medium">` |
| `fonts.weights.bold` | `--font-weight-bold` | `<text weight="bold">` |
| `fonts.body.family` | `--font-family-body` | `<text family="body">` |
| `fonts.body.weight` | `--font-weight-body` | default body ink weight |

Body and cover titles use the scale **in HTML** (`<text size="400">`, `<text size="1600">`). Brands do not remap those steps. Omit `weight` on a role (cover title, QFC title, slide title) so the brand role weight applies; set `weight="regular|medium|bold"` only to override it.

Example — Gratia-style named weights, then make slide-title `lg` use scale 800 (32px):

```json
"fonts": {
  "weights": {
    "regular": 400,
    "medium": 500,
    "bold": 600
  },
  "body": {
    "family": "\"DM Sans\", system-ui, sans-serif",
    "weight": "regular"
  }
},
"slideTitle": {
  "family": "\"DM Sans\", system-ui, sans-serif",
  "weight": "bold",
  "sizeLg": 800,
  "sizeMd": 1000,
  "sizeSm": 800
}
```

### Spacing

Semantic spacing is a **spacing-scale step** from `design-system/tokens/spacing.css` (`20` → `var(--spacing-20)` = 80px). Hyphenated steps are strings (`"0-5"` = 2px). Component padding and gap live on that component (below), not in a top-level `spacing` object.

### Border radius and stroke scales

| JSON | CSS |
|---|---|
| `borderRadius.none/sm/med/lg/full` | `--border-radius-*` |
| `borderSize.none/sm/md` | `--border-size-*` |

Card and alert pick a step on these scales (`"med"`, `"sm"`, …), not a pixel value.

### Component tokens

#### Cover title

| JSON | CSS | HTML |
|---|---|---|
| `coverTitle.family` | `--font-family-cover-title` | `family="cover-title"` |
| `coverTitle.weight` | `--font-weight-cover-title` → `var(--font-weight-*)` | default if `weight` is omitted |

#### Slide title

| JSON | CSS | HTML |
|---|---|---|
| `slideTitle.gap` | `--slide-title-gap` | `<slide-title>` |
| `slideTitle.family` | `--font-family-slide-title` | `<slide-title-main>` |
| `slideTitle.weight` | `--font-weight-slide-title` | default for slide titles |
| `slideTitle.sizeLg/Md/Sm` | `--slide-title-main-size-lg/md/sm` → `var(--text-size-*)` | `size="lg"` etc. |
| `slideTitle.pre.weight` | `--font-weight-slide-title-pre` | `<slide-title-pre>` |
| `slideTitle.pre.size` | `--slide-title-pre-size` → `var(--text-size-*)` | |
| `slideTitle.sub.weight` | `--font-weight-slide-title-sub` | `<slide-title-sub>` |
| `slideTitle.sub.size` | `--slide-title-sub-size` → `var(--text-size-*)` | |

#### Slide chrome

`<slide>` fills its container up to `maxWidth`. `<slide-header>`, `<slide-content>`, and `<slide-footer>` each have four sides. Cover slides (`<slide class="bg-cover">`) do not use this chrome. Defaults: maxWidth 1280, header 16/20/0/20, content 10/20/0/20, footer 4/4/4/4 (top/right/bottom/left).

| JSON | CSS | HTML |
|---|---|---|
| `slide.maxWidth` | `--slide-max-width` | `<slide>` canvas cap (pixels) |
| `slide.header.paddingTop/Right/Bottom/Left` | `--slide-header-padding-*` | `<slide-header>` |
| `slide.content.paddingTop/Right/Bottom/Left` | `--slide-content-padding-*` | `<slide-content>` |
| `slide.footer.paddingTop/Right/Bottom/Left` | `--slide-footer-padding-*` | `<slide-footer>` |

#### Card

| JSON | CSS | HTML |
|---|---|---|
| `card.paddingSm/Md/Lg` | `--card-padding-*` | `<card size>` |
| `card.gapSm/Md/Lg` | `--card-gap-*` | `<card>` gap |
| `card.borderRadius` | `--border-radius-card` → `var(--border-radius-*)` | `<card>` |
| `card.borderSize.*` | `--card-border-size-*` → `var(--border-size-*)` | card stroke |
| `card.title.family` | `--font-family-card-title` | `<quick-fact-card-title>` |
| `card.title.weight` | `--font-weight-card-title` | |
| `card.title.sizeLg/Md/Sm` | `--card-title-size-lg/md/sm` → `var(--text-size-*)` | `size="lg"` etc. Default is `md`. |
| `card.pretitle.weight` | `--font-weight-card-pretitle` | `<quick-fact-card-pretitle>` |
| `card.pretitle.size` | `--card-pretitle-size` → `var(--text-size-*)` | |
| `card.quickFact.metaPaddingTop` | `--quick-fact-card-meta-padding-top` | `<quick-fact-card-meta>` |

#### Alert

| JSON | CSS | HTML |
|---|---|---|
| `alert.paddingSm/Md/Lg` | `--alert-padding-*` | `<alert size>` |
| `alert.gap` | `--alert-gap` | `<alert>` |
| `alert.borderRadius` | `--border-radius-alert` → `var(--border-radius-*)` | |
| `alert.borderSize.*` | `--alert-border-size-*` → `var(--border-size-*)` | alert stroke |

#### Stack

| JSON | CSS | HTML |
|---|---|---|
| `stack.gapSm/Md/Lg` | `--stack-gap-*` | `<stack>` |

#### Paragraph title

| JSON | CSS | HTML |
|---|---|---|
| `paragraphTitle.family` | `--font-family-paragraph-title` | `<section-title>` |
| `paragraphTitle.weight` | `--font-weight-paragraph-title` | |
| `paragraphTitle.sizeLg/Md/Sm` | `--paragraph-title-size-lg/md/sm` → `var(--text-size-*)` | `size="lg"` etc. |

#### Attribution box

| JSON | CSS | HTML |
|---|---|---|
| `attributionBox.gap` | `--attribution-box-gap` | `<attribution-box>` |
| `attributionBox.paddingYTitle` / `paddingXTitle` | `--attribution-box-padding-*-title` | `type="title"` |
| `attributionBox.paddingYContent` / `paddingXContent` | `--attribution-box-padding-*-content` | `type="content"` |

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
