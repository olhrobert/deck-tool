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

Cover and slide settings live under `components.cover` and `components.slide` (colors, type, chrome), nested by group (`components.cover.canvas.background`, `components.slide.pretitle.family`, `components.slide.header.paddingLeft`). Top-level groups, in order: `foundations` (`basic`, `color` — `brand`, `semantic`, `chart` — then `font`, `border`) then `components` (`cover`, `slide`, `paragraphTitle`, `body`, `stack`, `card`). Shared tokens under `foundations.color` / `foundations.font` / `foundations.border`; component type roles keep their own groups under `components`. Only keys in `scripts/generate-brand-css.js` `TOKEN_MAP` become CSS variables. The type scale and the **global** spacing scale (`--spacing-0` … `--spacing-40`) stay in `design-system/tokens/`. Font sizes are type-scale steps (`800`, `400`, …); semantic spacing is a spacing-scale step (`20`, `16`, `"0-5"`, …); component radius and stroke name a `foundations.border.radius` / `foundations.border.size` step (`med`, `sm`, …). Pixels appear on those two generic scales and on `components.slide.canvas.maxWidth` (canvas cap, default `1280`).

`design-system/tokens/colors.css` holds the **same role names** as `brand-settings.json` (a fallback when no `brand.css` is loaded) plus opacity variants (`-strong` / `-base` / `-subtle`) for cover/slide foregrounds. Brand identity, status hues, and chart swatches live under `foundations.color.brand.1`…`6`, `foundations.color.semantic.*`, and `foundations.color.chart.1`…`4` (omit unused brand slots).

**Color layers:** hard-coded RGB/RGBA lives on `foundations.color` — `brand` / `semantic` / `chart` swatches. Card paint (including default quiet/emphasis) lives on `components.card` and **references** that palette: `"semantic.positiveQuiet"`, `"brand.3"`, `"chart.1"`, or `{ "color": "brand.1", "opacity": 0.8 }`. Cover/slide color fields work the same way (`"brand.2"`). The generator bakes refs into concrete `rgb`/`rgba` in `brand.css`. `validate-brand.js` resolves the same way before WCAG AA checks on cover/slide (and surface) foreground/background pairs, plus each card `foregroundStrong` on its `backgroundBase`.

### Cover

Title/cover canvas plus cover title type.

| `brand-settings.json` | CSS | What you see |
|---|---|---|
| `components.cover.canvas.background` | `--color-cover-background` | Title/cover fill. Ref a palette color (e.g. `"brand.2"`). `<slide class="bg-cover">` in every `presets/deck-titles/*.html`. |
| `components.cover.canvas.foreground` | `--color-cover-foreground` | Ink on the cover. Palette ref. Opacity variants: `-strong` (100%), `-base` (70%), `-subtle` (50%). Use `.color-cover-foreground-*`. |
| `components.cover.surface.background` | `--color-cover-surface-background` | Card fill on a cover (`.bg-cover-surface`). Palette ref. |
| `components.cover.surface.foreground` | `--color-cover-surface-foreground` | Ink on a card that sits on the cover. Palette ref. |
| `components.cover.surface.border` | `--color-cover-surface-border` | Card stroke on a cover surface. Often `{ "color": "brand.1", "opacity": 0.18 }`. |
| `components.cover.title.family` | `--cover-title-font-family` → `var(--font-family-*)` | `family="cover-title"` |
| `components.cover.title.weight` | `--cover-title-font-weight` → `var(--font-weight-*)` | default if `weight` is omitted |

### Slide

Content-slide canvas, title stack type, and chrome padding.

| `brand-settings.json` | CSS | What you see / HTML |
|---|---|---|
| `components.slide.canvas.background` | `--color-slide-background` | Default content-slide canvas. Palette ref. `<slide>` fill. `.bg-slide`. |
| `components.slide.canvas.foreground` | `--color-slide-foreground` | Ink on the content canvas. Palette ref. Slide Title, paragraph titles, `<body-copy>`, footer logos. `.color-slide-foreground-*`. |
| `components.slide.canvas.maxWidth` | `--slide-max-width` | `<slide>` canvas cap (pixels) |
| `components.slide.surface.background` | `--color-slide-surface-background` | Cards, `<attribution-box>` fill. Palette ref. `.bg-slide-surface`. |
| `components.slide.surface.foreground` | `--color-slide-surface-foreground` | Ink on those panels (cards, attribution). Palette ref. |
| `components.slide.surface.border` | `--color-slide-surface-border` | Card stroke and attribution separator. Palette ref (often with opacity). `.border-color-slide-surface`. |
| `components.slide.pretitle.family` | `--slide-pretitle-font-family` → `var(--font-family-*)` | `<slide-pretitle>` |
| `components.slide.pretitle.weight` | `--slide-pretitle-font-weight` → `var(--font-weight-*)` | |
| `components.slide.pretitle.uppercase` | `--slide-pretitle-text-transform` | brand default; override with `uppercase="true\|false"` |
| `components.slide.pretitle.letterSpacing` | `--slide-pretitle-letter-spacing` | percentage string, e.g. `"2%"` |
| `components.slide.pretitle.size` | `--slide-pretitle-size` → `var(--text-size-*)` | brand-only (no `size` attribute) |
| `components.slide.title.gap` | `--slide-title-gap` | `<slide-title-group>` |
| `components.slide.title.family` | `--slide-title-font-family` → `var(--font-family-*)` | `<slide-title>` |
| `components.slide.title.weight` | `--slide-title-font-weight` | default for slide titles |
| `components.slide.title.sizeSm/Md/Lg` | `--slide-title-size-sm/md/lg` → `var(--text-size-*)` | `size="lg"` etc. |
| `components.slide.subtitle.family` | `--slide-subtitle-font-family` → `var(--font-family-*)` | `<slide-subtitle>` |
| `components.slide.subtitle.weight` | `--slide-subtitle-font-weight` | |
| `components.slide.subtitle.size` | `--slide-subtitle-size` → `var(--text-size-*)` | |
| `components.slide.header.paddingTop/Right/Bottom/Left` | `--slide-header-padding-*` | `<slide-header>` |
| `components.slide.content.paddingTop/Right/Bottom/Left` | `--slide-content-padding-*` | `<slide-content>` |
| `components.slide.footer.paddingTop/Right/Bottom/Left` | `--slide-footer-padding-*` | `<slide-footer>` |

`<slide>` fills its container up to `canvas.maxWidth`. Cover slides (`<slide class="bg-cover">`) do not use this chrome. Defaults: maxWidth 1280, header 16/20/0/20, content 10/20/0/20, footer 4/4/4/4 (top/right/bottom/left).

`<slide-pretitle>` defaults: `color` is `subtle`, `context="slide"`. No markup size variants — one type-scale step per brand via `components.slide.pretitle.size`.

### Shared color tokens

| `brand-settings.json` | CSS | What you see |
|---|---|---|
| `foundations.color.brand.1`…`6` | `--color-palette-brand-1` … `--color-palette-brand-6` | Hard-coded identity swatches (omit unused). Role colors ref these by name (`"brand.2"`). |
| `foundations.color.semantic.positiveQuiet` / `positiveEmphasis` / `negativeQuiet` / `negativeEmphasis` / `warningQuiet` / `warningEmphasis` / `informativeQuiet` / `informativeEmphasis` | `--color-semantic-positive-quiet` … | Hard-coded status hues (between Brand and Chart). Cards ref these plus opacity. |
| `foundations.color.chart.1`…`4` | `--color-palette-chart-1` … `--color-palette-chart-4` | Hard-coded chart palette. `.color-palette-chart-*` utilities. Roles may ref (`"chart.1"`). |

Palette refs drop `foundations.color.`: `"brand.2"`, `"semantic.positiveQuiet"`, `"chart.1"`.

**Typical mapping:** title slide → `components.cover.*`; content slides → `components.slide.*`; quiet default cards → `components.card.defaultQuiet.*` (refs `brand.*` + opacity); status cards → `components.card.positiveQuiet.*` (refs `semantic.*` / `brand.*` / `chart.*` + opacity); stripe chrome → quiet `borderStrong`.

### Font tokens

Named families (`display`, `base`) live under `foundations.font.family` as CSS stacks. Role family fields (`components.cover.title.family`, `components.body.family`, …) name one of those two — they do not repeat the stack. Named weights (`regular`, `medium`, `bold`) live under `foundations.font.weight` as CSS numbers matching `@font-face` in `design-system/tokens/fonts.css`. `<text weight="bold">` and `components.slide.title.weight: "bold"` both resolve to `foundations.font.weight.bold`. A brand can map two names to the same number (e.g. medium and bold both 500).

**Sizes are type-scale steps**, not pixels. The scale lives in `design-system/tokens/typography.css` (`--text-size-800` = 32px, `--text-size-400` = 16px, …). `<slide-title size="lg">` uses whatever step `components.slide.title.sizeLg` names.

| Named weight | Typical file |
|---|---|
| `regular` | Regular (`400`) |
| `medium` | Medium (`500`) |
| `bold` | SemiBold (`600`) or Bold (`700`) — brand-defined |

| `brand-settings.json` | CSS | HTML |
|---|---|---|
| `foundations.font.family.display` | `--font-family-display` | display stack (titles) |
| `foundations.font.family.base` | `--font-family-base` | base stack (body, pretitles) |
| `foundations.font.weight.regular` | `--font-weight-regular` | `<text weight="regular">` |
| `foundations.font.weight.medium` | `--font-weight-medium` | `<text weight="medium">` |
| `foundations.font.weight.bold` | `--font-weight-bold` | `<text weight="bold">` |
| `components.body.family` | `--body-font-family` → `var(--font-family-*)` | `<text family="body">` |
| `components.body.weight` | `--body-font-weight` | default body ink weight |
| `components.body.sizeSm` | `--body-size-sm` → `var(--text-size-*)` | `<body-copy size="sm">` |
| `components.body.sizeMd` | `--body-size-md` → `var(--text-size-*)` | `<body-copy size="md">` (default) |
| `components.body.sizeLg` | `--body-size-lg` → `var(--text-size-*)` | `<body-copy size="lg">` |
| `components.paragraphTitle.family` | `--paragraph-title-font-family` → `var(--font-family-*)` | `<paragraph-title>` |
| `components.paragraphTitle.weight` | `--paragraph-title-font-weight` | |
| `components.paragraphTitle.sizeSm/Md/Lg` | `--paragraph-title-size-sm/md/lg` → `var(--text-size-*)` | `size="lg"` etc. |

Body copy uses **`<body-copy size="sm|md|lg">`** (brand-mapped). Default is `md` (Gratia/Riverton: step `400` / 16px). Use primitive `<text>` with a raw type-scale step for one-offs (`size="300"` for attribution or cover captions, `size="1600"` with `family="cover-title"` for cover titles). Omit `weight` on a role so the brand role weight applies; set `weight="regular|medium|bold"` only to override it.

`<text>` is the base typography primitive. Axes: `color`, raw `size`, `uppercase`, `context`, plus `family`, `weight`, `lineheight`, `letterspacing`. Semantic tags (`<body-copy>`, `<slide-pretitle>`, `<card-pretitle>`, `<slide-title>`, `<slide-subtitle>`, …) are presets that inherit shared axes and bake brand family/weight/size. Use `<slide-title-group>` when stacking pretitle + title + subtitle.

Example — Gratia-style named weights, then make slide-title `lg` use scale 800 (32px):

```json
"font": {
  "family": {
    "display": "\"DM Sans\", system-ui, sans-serif",
    "base": "\"DM Sans\", system-ui, sans-serif"
  },
  "weight": {
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
| `foundations.border.radius.none/sm/med/lg/full` | `--border-radius-*` |
| `foundations.border.size.none/sm/md` | `--border-size-*` |

Cards pick a step on these scales (`"med"`, `"sm"`, …), not a pixel value.

### Component tokens

CSS custom properties are component-leading (`--slide-pretitle-font-family`, not `--font-family-slide-pretitle`). Generic scales keep type first (`--font-weight-regular`, `--border-radius-med`).

#### Card pretitle

`<card-pretitle>` is a preset for labels inside cards. Default `color` is `subtle`, `context="surface"`. No markup size variants — one type-scale step per brand via `components.card.pretitle.size`.

| JSON | CSS | HTML |
|---|---|---|
| `components.card.pretitle.family` | `--card-pretitle-font-family` → `var(--font-family-*)` | `<card-pretitle>` |
| `components.card.pretitle.weight` | `--card-pretitle-font-weight` → `var(--font-weight-*)` | |
| `components.card.pretitle.uppercase` | `--card-pretitle-text-transform` | brand default; override with `uppercase="true\|false"` |
| `components.card.pretitle.letterSpacing` | `--card-pretitle-letter-spacing` | percentage string, e.g. `"2%"` |
| `components.card.pretitle.size` | `--card-pretitle-size` → `var(--text-size-*)` | brand-only (no `size` attribute) |

Slide and card pretitles use separate token groups (`components.slide.pretitle` vs `components.card.pretitle`). Duplicate family, weight, uppercase, and letter-spacing between them when both contexts should match; only `size` typically differs (e.g. slide step `350`, card step `300`).

Context and color are set in markup: `context="slide|surface"` and `color="subtle|base|strong"`.

#### Card

Paint axes on `<card>` (omit for today's quiet default box): `variant="default|positive|warning|negative|informative"`, `emphasis="true|false"`, `layout="basic|stripe"`. Omit `layout` to use `components.card.layout`. Type, padding, and gap stay brand tokens below. Nested `context="surface"` ink follows the card's variant/emphasis tokens.

| JSON | CSS | HTML |
|---|---|---|
| `components.card.layout` | `--card-layout` | default `<card>` layout when the attribute is omitted |
| `components.card.defaultQuiet` / `defaultEmphasis` / `positiveQuiet` / … | `--card-{family}-*` (also `--color-{variant}-{tone}-*`) | Card paint. Default families ref `brand.*` + opacity; status families ref `semantic.*` (and `brand` / `chart`) with opacity. |
| `components.card.padding.sm/md/lg` | `--card-padding-*` | `<card padding>` |
| `components.card.gap.sm/md/lg` | `--card-gap-*` | `<card gap>` |
| `components.card.border.radius` | `--card-border-radius` → `var(--border-radius-*)` | `<card layout="basic">` |
| `components.card.border.sizeTop/Bottom/Left/Right` | `--card-border-size-*` → `var(--border-size-*)` | basic stroke; stripe uses left `md` + `foundations.border.radius.none` |
| `components.card.title.family` | `--card-title-font-family` → `var(--font-family-*)` | `<card-title>` |
| `components.card.title.weight` | `--card-title-font-weight` | |
| `components.card.title.sizeSm/Md/Lg` | `--card-title-size-sm/md/lg` → `var(--text-size-*)` | `size="lg"` etc. Default is `md`. |
| `components.card.meta.paddingTop` | `--card-meta-padding-top` | `<card-meta>` |

#### Stack

| JSON | CSS | HTML |
|---|---|---|
| `components.stack.gap.sm/md/lg` | `--stack-gap-*` | `<stack>` |

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

Add a **Primitives** mode named after the brand (see [figma.md](figma.md)). Do not duplicate Color / Spacing / Radius / Typography collections. Write primitive font families (`font-family/display`, `font-family/base`) using the first quoted family from `foundations.font.family` in `brand-settings.json` (e.g. `"Inter"` not the CSS stack). Create `__Logo/{Brand}` from `{slug}-logo.svg` (baked fills; do not bind paths to `color/slide-foreground-strong`). Logo wordmarks are not bound to the family variables.
