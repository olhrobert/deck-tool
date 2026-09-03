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

Cover and slide settings live under top-level `cover` and `slide` (colors, type, chrome), nested by group (`cover.surface.background`, `slide.pretitle.family`, `slide.header.paddingLeft`). Shared tokens are grouped by type (`colors` for brand swatches / highlight / status / charts, `fonts`, `border`). Other component tokens (`card`, `alert`, …) keep padding, type, radius, and stroke together. Only keys in `scripts/generate-brand-css.js` `TOKEN_MAP` become CSS variables. The type scale and the **global** spacing scale (`--spacing-0` … `--spacing-40`) stay in `design-system/tokens/`. Font sizes are type-scale steps (`800`, `400`, …); semantic spacing is a spacing-scale step (`20`, `16`, `"0-5"`, …); component radius and stroke name a `border.radius` / `border.size` step (`med`, `sm`, …). Pixels appear on those two generic scales and on `slide.maxWidth` (canvas cap, default `1280`).

`design-system/tokens/colors.css` holds the **same role names** as `brand-settings.json` (a fallback when no `brand.css` is loaded) plus opacity variants (`-strong` / `-base` / `-subtle`). Brand identity swatches live under `colors.brand.brand1`…`brand6` (omit unused slots).

**Color layers:** hard-coded RGB/RGBA lives only on the extended palette — `colors.brand.*`, `colors.status.*.*`, and `colors.charts.*`. `colors.highlight` and every cover/slide color field **reference** that palette: a string (`"brand2"`, `"status.positive.foreground"`, `"charts.chart1"`) or `{ "color": "brand1", "opacity": 0.18 }` when alpha differs. The generator bakes refs into concrete `rgb`/`rgba` in `brand.css`. `validate-brand.js` resolves the same way before WCAG AA checks on cover/slide (and surface) foreground/background pairs.

### Cover

Title/cover canvas plus cover title type.

| `brand-settings.json` | CSS | What you see |
|---|---|---|
| `cover.background` | `--color-cover-background` | Title/cover fill. Ref a palette color (e.g. `"brand2"`). `<slide class="bg-cover">` in every `presets/deck-titles/*.html`. |
| `cover.foreground` | `--color-cover-foreground` | Ink on the cover. Palette ref. Opacity variants: `-strong` (100%), `-base` (70%), `-subtle` (50%). Use `.color-cover-foreground-*`. |
| `cover.surface.background` | `--color-cover-surface-background` | Card fill on a cover (`.bg-cover-surface`). Palette ref. |
| `cover.surface.foreground` | `--color-cover-surface-foreground` | Ink on a card that sits on the cover. Palette ref. |
| `cover.surface.border` | `--color-cover-surface-border` | Card stroke on a cover surface. Often `{ "color": "brand1", "opacity": 0.18 }`. |
| `cover.title.family` | `--cover-title-font-family` → `var(--font-family-*)` | `family="cover-title"` |
| `cover.title.weight` | `--cover-title-font-weight` → `var(--font-weight-*)` | default if `weight` is omitted |

### Slide

Content-slide canvas, title stack type, and chrome padding.

| `brand-settings.json` | CSS | What you see / HTML |
|---|---|---|
| `slide.background` | `--color-slide-background` | Default content-slide canvas. Palette ref. `<slide>` fill. `.bg-slide`. |
| `slide.foreground` | `--color-slide-foreground` | Ink on the content canvas. Palette ref. Slide Title, paragraph titles, `<body-copy>`, footer logos. `.color-slide-foreground-*`. |
| `slide.surface.background` | `--color-slide-surface-background` | Cards, `<attribution-box>`, `<alert>` fill. Palette ref. `.bg-slide-surface`. |
| `slide.surface.foreground` | `--color-slide-surface-foreground` | Ink on those panels (cards, attribution, alert copy). Palette ref. |
| `slide.surface.border` | `--color-slide-surface-border` | Card stroke and attribution separator. Palette ref (often with opacity). `.border-color-slide-surface`. |
| `slide.pretitle.family` | `--slide-pretitle-font-family` → `var(--font-family-*)` | `<slide-pretitle>` |
| `slide.pretitle.weight` | `--slide-pretitle-font-weight` → `var(--font-weight-*)` | |
| `slide.pretitle.uppercase` | `--slide-pretitle-text-transform` | brand default; override with `uppercase="true\|false"` |
| `slide.pretitle.letterSpacing` | `--slide-pretitle-letter-spacing` | percentage string, e.g. `"2%"` |
| `slide.pretitle.size` | `--slide-pretitle-size` → `var(--text-size-*)` | brand-only (no `size` attribute) |
| `slide.title.gap` | `--slide-title-gap` | `<slide-title-group>` |
| `slide.title.family` | `--slide-title-font-family` → `var(--font-family-*)` | `<slide-title>` |
| `slide.title.weight` | `--slide-title-font-weight` | default for slide titles |
| `slide.title.sizeSm/Md/Lg` | `--slide-title-size-sm/md/lg` → `var(--text-size-*)` | `size="lg"` etc. |
| `slide.subtitle.family` | `--slide-subtitle-font-family` → `var(--font-family-*)` | `<slide-subtitle>` |
| `slide.subtitle.weight` | `--slide-subtitle-font-weight` | |
| `slide.subtitle.size` | `--slide-subtitle-size` → `var(--text-size-*)` | |
| `slide.maxWidth` | `--slide-max-width` | `<slide>` canvas cap (pixels) |
| `slide.header.paddingTop/Right/Bottom/Left` | `--slide-header-padding-*` | `<slide-header>` |
| `slide.content.paddingTop/Right/Bottom/Left` | `--slide-content-padding-*` | `<slide-content>` |
| `slide.footer.paddingTop/Right/Bottom/Left` | `--slide-footer-padding-*` | `<slide-footer>` |

`<slide>` fills its container up to `maxWidth`. Cover slides (`<slide class="bg-cover">`) do not use this chrome. Defaults: maxWidth 1280, header 16/20/0/20, content 10/20/0/20, footer 4/4/4/4 (top/right/bottom/left).

`<slide-pretitle>` defaults: `color` is `subtle`, `context="slide"`. No markup size variants — one type-scale step per brand via `slide.pretitle.size`.

### Shared color tokens

| `brand-settings.json` | CSS | What you see |
|---|---|---|
| `colors.brand.brand1`…`brand6` | `--color-brand-1` … `--color-brand-6` | Hard-coded identity swatches (omit unused). Role colors ref these by name (`"brand2"`). |
| `colors.highlight` | `--color-highlight` | Palette ref. Default `<alert>` left border and `.color-highlight` / `.bg-highlight`. |
| `colors.status.*.foreground` / `background` / `border` | `--color-positive` … `--color-informative-border` | Hard-coded status palette (12 values). Alert variant borders and `.color-positive` etc. Roles may also ref these (`"status.positive.foreground"`). |
| `colors.charts.chart1`…`chart4` | `--color-chart-*` | Hard-coded chart palette. `.color-chart-*` utilities. Roles may ref (`"charts.chart1"`). |

**Typical mapping:** title slide → `cover.*`; content slides → `slide.*`; cards → `slide.surface.*`; alert stripe → `highlight` (often `"brand2"`, same as `cover.background`).

### Font tokens

Named families (`display`, `base`) live under `fonts.families` as CSS stacks. Role family fields (`cover.title.family`, `fonts.body.family`, …) name one of those two — they do not repeat the stack. Named weights (`regular`, `medium`, `bold`) live under `fonts.weights` as CSS numbers matching `@font-face` in `design-system/tokens/fonts.css`. `<text weight="bold">` and `slide.title.weight: "bold"` both resolve to `fonts.weights.bold`. A brand can map two names to the same number (e.g. medium and bold both 500).

**Sizes are type-scale steps**, not pixels. The scale lives in `design-system/tokens/typography.css` (`--text-size-800` = 32px, `--text-size-400` = 16px, …). `<slide-title size="lg">` uses whatever step `slide.title.sizeLg` names.

| Named weight | Typical file |
|---|---|
| `regular` | Regular (`400`) |
| `medium` | Medium (`500`) |
| `bold` | SemiBold (`600`) or Bold (`700`) — brand-defined |

| `brand-settings.json` | CSS | HTML |
|---|---|---|
| `fonts.families.display` | `--font-family-display` | display stack (titles) |
| `fonts.families.base` | `--font-family-base` | base stack (body, pretitles) |
| `fonts.weights.regular` | `--font-weight-regular` | `<text weight="regular">` |
| `fonts.weights.medium` | `--font-weight-medium` | `<text weight="medium">` |
| `fonts.weights.bold` | `--font-weight-bold` | `<text weight="bold">` |
| `fonts.body.family` | `--body-font-family` → `var(--font-family-*)` | `<text family="body">` |
| `fonts.body.weight` | `--body-font-weight` | default body ink weight |
| `fonts.body.sizeSm` | `--body-size-sm` → `var(--text-size-*)` | `<body-copy size="sm">` |
| `fonts.body.sizeMd` | `--body-size-md` → `var(--text-size-*)` | `<body-copy size="md">` (default) |
| `fonts.body.sizeLg` | `--body-size-lg` → `var(--text-size-*)` | `<body-copy size="lg">` |
| `fonts.paragraphTitle.family` | `--paragraph-title-font-family` → `var(--font-family-*)` | `<paragraph-title>` |
| `fonts.paragraphTitle.weight` | `--paragraph-title-font-weight` | |
| `fonts.paragraphTitle.sizeSm/Md/Lg` | `--paragraph-title-size-sm/md/lg` → `var(--text-size-*)` | `size="lg"` etc. |

Body copy uses **`<body-copy size="sm|md|lg">`** (brand-mapped). Default is `md` (Gratia/Riverton: step `400` / 16px). Use primitive `<text>` with a raw type-scale step for one-offs (`size="300"` for attribution or cover captions, `size="1600"` with `family="cover-title"` for cover titles). Omit `weight` on a role so the brand role weight applies; set `weight="regular|medium|bold"` only to override it.

`<text>` is the base typography primitive. Axes: `color`, raw `size`, `uppercase`, `context`, plus `family`, `weight`, `lineheight`, `letterspacing`. Semantic tags (`<body-copy>`, `<slide-pretitle>`, `<card-pretitle>`, `<slide-title>`, `<slide-subtitle>`, …) are presets that inherit shared axes and bake brand family/weight/size. Use `<slide-title-group>` when stacking pretitle + title + subtitle.

Example — Gratia-style named weights, then make slide-title `lg` use scale 800 (32px):

```json
"fonts": {
  "families": {
    "display": "\"DM Sans\", system-ui, sans-serif",
    "base": "\"DM Sans\", system-ui, sans-serif"
  },
  "weights": {
    "regular": 400,
    "medium": 500,
    "bold": 600
  },
  "body": {
    "family": "base",
    "weight": "regular"
  }
},
"slide": {
  "title": {
    "family": "display",
    "weight": "bold",
    "sizeSm": 800,
    "sizeMd": 1000,
    "sizeLg": 800
  }
}
```

### Spacing

Semantic spacing is a **spacing-scale step** from `design-system/tokens/spacing.css` (`20` → `var(--spacing-20)` = 80px). Hyphenated steps are strings (`"0-5"` = 2px). Component padding and gap live on that component (below), not in a top-level `spacing` object.

### Border radius and stroke scales

| JSON | CSS |
|---|---|
| `border.radius.none/sm/med/lg/full` | `--border-radius-*` |
| `border.size.none/sm/md` | `--border-size-*` |

Card and alert pick a step on these scales (`"med"`, `"sm"`, …), not a pixel value.

### Component tokens

CSS custom properties are component-leading (`--slide-pretitle-font-family`, not `--font-family-slide-pretitle`). Generic scales keep type first (`--font-weight-regular`, `--border-radius-med`).

#### Card pretitle

`<card-pretitle>` is a preset for labels inside cards. Default `color` is `subtle`, `context="surface"`. No markup size variants — one type-scale step per brand via `card.pretitle.size`.

| JSON | CSS | HTML |
|---|---|---|
| `card.pretitle.family` | `--card-pretitle-font-family` → `var(--font-family-*)` | `<card-pretitle>` |
| `card.pretitle.weight` | `--card-pretitle-font-weight` → `var(--font-weight-*)` | |
| `card.pretitle.uppercase` | `--card-pretitle-text-transform` | brand default; override with `uppercase="true\|false"` |
| `card.pretitle.letterSpacing` | `--card-pretitle-letter-spacing` | percentage string, e.g. `"2%"` |
| `card.pretitle.size` | `--card-pretitle-size` → `var(--text-size-*)` | brand-only (no `size` attribute) |

Slide and card pretitles use separate token groups (`slide.pretitle` vs `card.pretitle`). Duplicate family, weight, uppercase, and letter-spacing between them when both contexts should match; only `size` typically differs (e.g. slide step `350`, card step `300`).

Context and color are set in markup: `context="slide|surface"` and `color="subtle|base|strong"`.

#### Card

| JSON | CSS | HTML |
|---|---|---|
| `card.paddingSm/Md/Lg` | `--card-padding-*` | `<card size>` |
| `card.gapSm/Md/Lg` | `--card-gap-*` | `<card>` gap |
| `card.borderRadius` | `--card-border-radius` → `var(--border-radius-*)` | `<card>` |
| `card.borderSize.*` | `--card-border-size-*` → `var(--border-size-*)` | card stroke |
| `card.title.family` | `--card-title-font-family` → `var(--font-family-*)` | `<card-title>` |
| `card.title.weight` | `--card-title-font-weight` | |
| `card.title.sizeSm/Md/Lg` | `--card-title-size-sm/md/lg` → `var(--text-size-*)` | `size="lg"` etc. Default is `md`. |
| `card.metaPaddingTop` | `--card-meta-padding-top` | `<card-meta>` |

#### Alert

| JSON | CSS | HTML |
|---|---|---|
| `alert.paddingSm/Md/Lg` | `--alert-padding-*` | `<alert size>` |
| `alert.gap` | `--alert-gap` | `<alert>` |
| `alert.borderRadius` | `--alert-border-radius` → `var(--border-radius-*)` | |
| `alert.borderSize.*` | `--alert-border-size-*` → `var(--border-size-*)` | alert stroke |

#### Stack

| JSON | CSS | HTML |
|---|---|---|
| `stack.gapSm/Md/Lg` | `--stack-gap-*` | `<stack>` |

`<attribution-box>` is brand-agnostic — see `.cursor/skills/attribution-box/SKILL.md`. Do not add `attributionBox` keys to `brand-settings.json`.

## Logos

Each brand ships two standalone SVGs with **baked fills** (no `currentColor`, no `<symbol>` sprite):

| File | Use |
|---|---|
| `{slug}-logo.svg` | Default lockup on light backgrounds |
| `{slug}-logo-inverted.svg` | Light lockup on dark backgrounds |

Presets use `<img data-logo="cover|slide|slide-surface">`. The showcase (and later deck generation) picks default vs inverted from the luminance of that surface token. Do not wrap brand logos in `color-*` classes.

The Gratia mark inside `<attribution-box>` is a separate prepared-by lockup (`<img data-slot="logo">`); leave it alone.

## Figma

Add a **Primitives** mode named after the brand (see [figma.md](figma.md)). Do not duplicate Color / Spacing / Radius / Typography collections. Write primitive font families (`font-family/display`, `font-family/base`) using the first quoted family from `fonts.families` in `brand-settings.json` (e.g. `"Inter"` not the CSS stack). Create `__Logo/{Brand}` from `{slug}-logo.svg` (baked fills; do not bind paths to `color/slide-foreground-strong`). Logo wordmarks are not bound to the family variables.
