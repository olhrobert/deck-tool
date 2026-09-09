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

Cover and slide settings live under `components.cover` and `components.slide` (colors, type, chrome), nested by group (`components.cover.canvas.background`, `components.slide.pretitle.family`, `components.slide.header.paddingLeft`). Top-level groups, in order: `foundations` (`basic`, `color` — `brand`, `semantic`, `chart` — then `tone`, `font`, `border`) then `components` (`cover`, `slide`, `paragraphTitle`, `body`, `stack`, `card`, `callout`, `badge`, `slideFooter`). Shared tokens under `foundations.color` / `foundations.tone` / `foundations.font` / `foundations.border`; component type roles keep their own groups under `components`. Only keys in `scripts/generate-brand-css.js` `TOKEN_MAP` become CSS variables. The type scale and the **global** spacing scale (`--spacing-0` … `--spacing-40`) stay in `design-system/tokens/`. Font sizes are type-scale steps (`800`, `400`, …); semantic spacing is a spacing-scale step (`20`, `16`, `"0-5"`, …); component radius and stroke name a `foundations.border.radius` / `foundations.border.size` step (`med`, `sm`, …). Pixels appear on those two generic scales and on `components.slide.canvas.maxWidth` (canvas cap, default `1280`).

`design-system/tokens/colors.css` holds the **same role names** as `brand-settings.json` (a fallback when no `brand.css` is loaded) plus opacity variants (`-strong` / `-base` / `-subtle`) derived from `foundations.tone`. Brand identity, status hues, and chart swatches live under `foundations.color.brand.1`…`6`, `foundations.color.semantic.*`, and `foundations.color.chart.1`…`4` (omit unused brand slots).

**Color layers:** hard-coded RGB/RGBA lives on `foundations.color` — `brand` / status `semantic` / `chart` swatches. `semantic.neutral` and `semantic.bright` ref `brand.*`. Card paint lives on `components.card.foreground` / `background` / `border.subtle` / `stripe.color`, keyed by family (`neutralQuiet`, `positiveEmphasis`, …), and **references** that palette: `"semantic.positive"`, `"brand.3"`, `"chart.1"`, or `{ "color": "brand.1", "opacity": 0.8 }`. Callout paint is the same pattern under `components.callout.foreground` / `background` / `stripe.color`, but quiet-only families (no emphasis). Cover/slide color fields work the same way (`"brand.2"`). A family’s `foreground` is a hue; CSS applies `foundations.tone.strong|base|subtle` as opacity. The generator bakes refs into concrete `rgb`/`rgba` in `brand.css`. `validate-brand.js` resolves the same way before WCAG AA checks on cover/slide (and surface) foreground/background pairs, plus each card and callout `foreground` on its `background`.

### Cover

Title/cover canvas plus cover title type.

| `brand-settings.json`                 | CSS                                                  | What you see                                                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components.cover.canvas.background`  | `--color-cover-background`                           | Title/cover fill. Ref a palette color (e.g. `"brand.2"`). `<slide class="bg-cover">` in every `presets/title-slides/*.html` and `presets/chapter-slides/*.html`.    |
| `components.cover.canvas.foreground`  | `--color-cover-foreground`                           | Ink on the cover. Palette ref. Opacity variants (`-strong` / `-base` / `-subtle`) use `foundations.tone`. Use `context="cover"` with `tone="strong\|base\|subtle"`. |
| `components.cover.surface.background` | `--color-cover-surface-background`                   | Card fill on a cover (`.bg-cover-surface`). Palette ref.                                                                                                            |
| `components.cover.surface.foreground` | `--color-cover-surface-foreground`                   | Ink on a card that sits on the cover. Palette ref.                                                                                                                  |
| `components.cover.surface.border`     | `--color-cover-surface-border`                       | Card stroke on a cover surface. Often `{ "color": "brand.1", "opacity": 0.18 }`.                                                                                    |
| `components.cover.title.family`       | `--cover-title-font-family` → `var(--font-family-*)` | `family="cover-title"`                                                                                                                                              |
| `components.cover.title.weight`       | `--cover-title-font-weight` → `var(--font-weight-*)` | default if `weight` is omitted                                                                                                                                      |

### Slide

Content-slide canvas, title stack type, and chrome padding.

| `brand-settings.json`                                   | CSS                                                     | What you see / HTML                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `components.slide.canvas.background`                    | `--color-slide-background`                              | Default content-slide canvas. Palette ref. `<slide>` fill. `.bg-slide`.                                                          |
| `components.slide.canvas.foreground`                    | `--color-slide-foreground`                              | Ink on the content canvas. Palette ref. Slide Title, paragraph titles, `<body-copy>`, footer logos. `.color-slide-foreground-*`. |
| `components.slide.canvas.maxWidth`                      | `--slide-max-width`                                     | `<slide>` canvas cap (pixels)                                                                                                    |
| `components.slide.surface.background`                   | `--color-slide-surface-background`                      | Cards, `<attribution-box>` fill. Palette ref. `.bg-slide-surface`.                                                               |
| `components.slide.surface.foreground`                   | `--color-slide-surface-foreground`                      | Ink on those panels (cards, attribution). Palette ref.                                                                           |
| `components.slide.surface.border`                       | `--color-slide-surface-border`                          | Card stroke and attribution separator. Palette ref (often with opacity). `.border-color-slide-surface`.                          |
| `components.slide.pretitle.family`                      | `--slide-pretitle-font-family` → `var(--font-family-*)` | `<slide-pretitle>`                                                                                                               |
| `components.slide.pretitle.weight`                      | `--slide-pretitle-font-weight` → `var(--font-weight-*)` |                                                                                                                                  |
| `components.slide.pretitle.uppercase`                   | `--slide-pretitle-text-transform`                       | brand default; override with `uppercase="true\|false"`                                                                           |
| `components.slide.pretitle.letterSpacing`               | `--slide-pretitle-letter-spacing`                       | percentage string, e.g. `"2%"`                                                                                                   |
| `components.slide.pretitle.size`                        | `--slide-pretitle-size` → `var(--text-size-*)`          | brand-only (no `size` attribute)                                                                                                 |
| `components.slide.title.gap`                            | `--slide-title-gap`                                     | `<slide-title-group>`                                                                                                            |
| `components.slide.title.family`                         | `--slide-title-font-family` → `var(--font-family-*)`    | `<slide-title>`                                                                                                                  |
| `components.slide.title.weight`                         | `--slide-title-font-weight`                             | default for slide titles                                                                                                         |
| `components.slide.title.sizeSm/Md/Lg`                   | `--slide-title-size-sm/md/lg` → `var(--text-size-*)`    | `size="lg"` etc.                                                                                                                 |
| `components.slide.subtitle.family`                      | `--slide-subtitle-font-family` → `var(--font-family-*)` | `<slide-subtitle>`                                                                                                               |
| `components.slide.subtitle.weight`                      | `--slide-subtitle-font-weight`                          |                                                                                                                                  |
| `components.slide.subtitle.size`                        | `--slide-subtitle-size` → `var(--text-size-*)`          |                                                                                                                                  |
| `components.slide.header.paddingTop/Right/Bottom/Left`  | `--slide-header-padding-*`                              | `<header-container>`                                                                                                             |
| `components.slide.content.paddingTop/Right/Bottom/Left` | `--slide-content-padding-*`                             | `<content-container>`                                                                                                            |
| `components.slide.footer.paddingTop/Right/Bottom/Left`  | `--slide-footer-padding-*`                              | `<footer-container>`                                                                                                             |

`<slide>` fills its container up to `canvas.maxWidth`. Cover slides (`<slide class="bg-cover">`) do not use this chrome. Defaults: maxWidth 1280, header 16/20/0/20, content 10/20/0/20, footer 4/4/4/4 (top/right/bottom/left).

`<slide-pretitle>` defaults: `tone` is `subtle`, `context="slide"`. No markup size variants — one type-scale step per brand via `components.slide.pretitle.size`.

### Shared color tokens

| `brand-settings.json`                                                          | CSS                                                    | What you see                                                                                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `foundations.color.brand.1`…`6`                                                | `--color-palette-brand-1` … `--color-palette-brand-6`  | Hard-coded identity swatches (omit unused). Role colors ref these by name (`"brand.2"`).                                              |
| `foundations.color.semantic.neutral` / `bright`                                | `--color-semantic-neutral` / `--color-semantic-bright` | Dark and light ink hues. Refs (`"brand.1"`, `"brand.5"`).                                                                             |
| `foundations.color.semantic.positive` / `negative` / `warning` / `informative` | `--color-semantic-positive` …                          | Hard-coded status hues (between Brand and Chart). Cards ref these plus opacity.                                                       |
| `foundations.tone.strong` / `base` / `subtle`                                  | `--tone-strong` / `--tone-base` / `--tone-subtle`      | Opacity for type and card ink (typically `1` / `0.7` / `0.5`). Cover/slide `-strong`/`-base`/`-subtle` and card `tone="…"` use these. |
| `foundations.color.chart.1`…`4`                                                | `--color-palette-chart-1` … `--color-palette-chart-4`  | Hard-coded chart palette. `.color-palette-chart-*` utilities. Roles may ref (`"chart.1"`).                                            |

Palette refs drop `foundations.color.`: `"brand.2"`, `"semantic.positive"`, `"semantic.neutral"`, `"chart.1"`.

**Typical mapping:** title slide → `components.cover.*`; content slides → `components.slide.*`; quiet neutral cards → `components.card.foreground.neutralQuiet` (`semantic.neutral`) plus matching `background` / `border.subtle`; stripe chrome → `components.card.stripe`.

### Font tokens

Named families (`display`, `base`) live under `foundations.font.family` as CSS stacks. Role family fields (`components.cover.title.family`, `components.body.family`, …) name one of those two — they do not repeat the stack. Named weights (`regular`, `medium`, `bold`) live under `foundations.font.weight` as CSS numbers matching `@font-face` in `design-system/tokens/fonts.css`. `<text weight="bold">` and `components.slide.title.weight: "bold"` both resolve to `foundations.font.weight.bold`. A brand can map two names to the same number (e.g. medium and bold both 500).

**Sizes are type-scale steps**, not pixels. The scale lives in `design-system/tokens/typography.css` (`--text-size-800` = 32px, `--text-size-400` = 16px, …). `<slide-title size="lg">` uses whatever step `components.slide.title.sizeLg` names.

| Named weight | Typical file                                     |
| ------------ | ------------------------------------------------ |
| `regular`    | Regular (`400`)                                  |
| `medium`     | Medium (`500`)                                   |
| `bold`       | SemiBold (`600`) or Bold (`700`) — brand-defined |

| `brand-settings.json`                    | CSS                                                      | HTML                              |
| ---------------------------------------- | -------------------------------------------------------- | --------------------------------- |
| `foundations.font.family.display`        | `--font-family-display`                                  | display stack (titles)            |
| `foundations.font.family.base`           | `--font-family-base`                                     | base stack (body, pretitles)      |
| `foundations.font.weight.regular`        | `--font-weight-regular`                                  | `<text weight="regular">`         |
| `foundations.font.weight.medium`         | `--font-weight-medium`                                   | `<text weight="medium">`          |
| `foundations.font.weight.bold`           | `--font-weight-bold`                                     | `<text weight="bold">`            |
| `components.body.family`                 | `--body-font-family` → `var(--font-family-*)`            | `<text family="body">`            |
| `components.body.weight`                 | `--body-font-weight`                                     | default body ink weight           |
| `components.body.sizeSm`                 | `--body-size-sm` → `var(--text-size-*)`                  | `<body-copy size="sm">`           |
| `components.body.sizeMd`                 | `--body-size-md` → `var(--text-size-*)`                  | `<body-copy size="md">` (default) |
| `components.body.sizeLg`                 | `--body-size-lg` → `var(--text-size-*)`                  | `<body-copy size="lg">`           |
| `components.paragraphTitle.family`       | `--paragraph-title-font-family` → `var(--font-family-*)` | `<paragraph-title>`               |
| `components.paragraphTitle.weight`       | `--paragraph-title-font-weight`                          |                                   |
| `components.paragraphTitle.sizeSm/Md/Lg` | `--paragraph-title-size-sm/md/lg` → `var(--text-size-*)` | `size="lg"` etc.                  |

Body copy uses **`<body-copy size="sm|md|lg">`** (brand-mapped). Default is `md` (Gratia/Riverton: step `400` / 16px). Use primitive `<text>` with a raw type-scale step for one-offs (`size="300"` for attribution or cover captions, `size="1600"` with `family="cover-title"` for cover titles). Omit `weight` on a role so the brand role weight applies; set `weight="regular|medium|bold"` only to override it.

`<text>` is the base typography primitive. Axes: `tone`, raw `size`, `uppercase`, `context`, plus `family`, `weight`, `lineheight`, `letterspacing`. Semantic tags (`<body-copy>`, `<slide-pretitle>`, `<card-pretitle>`, `<slide-title>`, `<slide-subtitle>`, …) are presets that inherit shared axes and bake brand family/weight/size. Use `<slide-title-group>` when stacking pretitle + title + subtitle.

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

| JSON                                            | CSS                 |
| ----------------------------------------------- | ------------------- |
| `foundations.border.radius.none/sm/med/lg/full` | `--border-radius-*` |
| `foundations.border.size.none/sm/md/lg`         | `--border-size-*`   |

Cards pick a step on these scales (`"med"`, `"sm"`, …), not a pixel value.

### Component tokens

CSS custom properties are component-leading (`--slide-pretitle-font-family`, not `--font-family-slide-pretitle`). Generic scales keep type first (`--font-weight-regular`, `--border-radius-med`).

#### Card pretitle

`<card-pretitle>` is a preset for labels inside cards. Default `tone` is `subtle`, `context="surface"`. No markup size variants — one type-scale step per brand via `components.card.pretitle.size`.

| JSON                                     | CSS                                                    | HTML                                                   |
| ---------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| `components.card.pretitle.family`        | `--card-pretitle-font-family` → `var(--font-family-*)` | `<card-pretitle>`                                      |
| `components.card.pretitle.weight`        | `--card-pretitle-font-weight` → `var(--font-weight-*)` |                                                        |
| `components.card.pretitle.uppercase`     | `--card-pretitle-text-transform`                       | brand default; override with `uppercase="true\|false"` |
| `components.card.pretitle.letterSpacing` | `--card-pretitle-letter-spacing`                       | percentage string, e.g. `"2%"`                         |
| `components.card.pretitle.size`          | `--card-pretitle-size` → `var(--text-size-*)`          | brand-only (no `size` attribute)                       |

Slide and card pretitles use separate token groups (`components.slide.pretitle` vs `components.card.pretitle`). Duplicate family, weight, uppercase, and letter-spacing between them when both contexts should match; only `size` typically differs (e.g. slide step `350`, card step `300`).

Context and tone are set in markup: `context="slide|surface|cover"` and `tone="subtle|base|strong"`. Title/cover type uses `context="cover"` (not `.color-cover-foreground-*`). Attribution on a cover still uses `context="surface"` because it sits on the attribution box.

#### Card

Paint axes on `<card>` (omit for today's quiet neutral box): `variant="neutral|positive|warning|negative|informative"`, `emphasis="true|false"`, `layout="basic|stripe"`. Omit `layout` to use `components.card.defaultLayout`. Type, padding, and gap stay brand tokens below. Nested `context="surface"` ink follows the card's variant/emphasis tokens.

| JSON                                               | CSS                                                               | HTML                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `components.card.defaultLayout`                    | `--card-default-layout`                                           | default `<card>` layout when the attribute is omitted                                                         |
| `components.card.foreground.{family}`              | `--card-{family}-foreground` (also `--color-{family}-foreground`) | Ink hue per recipe (`neutralQuiet`, `positiveEmphasis`, …). Strong/base/subtle opacity is `foundations.tone`. |
| `components.card.background.{family}`              | `--card-{family}-background`                                      | Card fill per recipe.                                                                                         |
| `components.card.padding.sm/md/lg`                 | `--card-padding-*`                                                | `<card padding>`                                                                                              |
| `components.card.gap.none/sm/md/lg`                | `--card-gap-*`                                                    | `<card gap>` (`none` → spacing `0` / 0px)                                                                     |
| `components.card.border.radius`                    | `--card-border-radius` → `var(--border-radius-*)`                 | `<card layout="basic">`                                                                                       |
| `components.card.border.sizeTop/Bottom/Left/Right` | `--card-border-size-*` → `var(--border-size-*)`                   | basic stroke                                                                                                  |
| `components.card.border.subtle.{family}`           | `--card-{family}-border-subtle`                                   | Basic (non-stripe) outline; badge reuses it.                                                                  |
| `components.card.stripe.width`                     | `--card-stripe-width` → `var(--border-size-*)`                    | Left accent width on `layout="stripe"`.                                                                       |
| `components.card.stripe.color.{family}`            | `--card-{family}-stripe`                                          | Stripe accent color.                                                                                          |
| `components.card.title.family`                     | `--card-title-font-family` → `var(--font-family-*)`               | `<card-title>`                                                                                                |
| `components.card.title.weight`                     | `--card-title-font-weight`                                        |                                                                                                               |
| `components.card.title.sizeSm/Md/Lg`               | `--card-title-size-sm/md/lg` → `var(--text-size-*)`               | `size="lg"` etc. Default is `md`.                                                                             |
| `components.card.meta.paddingTop`                  | `--card-meta-padding-top`                                         | `<card-meta>`                                                                                                 |

#### Callout

`<callout>` is a left-rule note with stacked title + description. Semantic variants only: `variant="neutral|positive|warning|negative|informative"` (no emphasis). Paint lives on quiet-only families (`neutralQuiet`, `positiveQuiet`, …). Title uses `tone="strong"`, description `tone="base"` on the family’s `foreground` hue. Omit `gap` to use `callout.gap.sm`. Nested `context="surface"` ink follows the callout variant. Padding still reuses card.

| JSON                                         | CSS                                                          | HTML                                                |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `components.callout.background.{family}`     | `--callout-{family}-background`                              | Fill per quiet recipe.                              |
| `components.callout.foreground.{family}`     | `--callout-{family}-foreground`                              | Ink hue; strong/base opacity is `foundations.tone`. |
| `components.callout.title.family`            | `--callout-title-font-family` → `var(--font-family-*)`       | `<callout-title>`                                   |
| `components.callout.title.weight`            | `--callout-title-font-weight`                                |                                                     |
| `components.callout.title.size`              | `--callout-title-size` → `var(--text-size-*)`                | brand-only; no `size` attribute                     |
| `components.callout.description.family`      | `--callout-description-font-family` → `var(--font-family-*)` | `<callout-description>`                             |
| `components.callout.description.weight`      | `--callout-description-font-weight`                          |                                                     |
| `components.callout.description.size`        | `--callout-description-size` → `var(--text-size-*)`          | brand-only; no `size` attribute                     |
| `components.callout.stripe.width`            | `--callout-stripe-width` → `var(--border-size-*)`            | left accent width                                   |
| `components.callout.stripe.color.{family}`   | `--callout-{family}-stripe`                                  | left accent color                                   |
| `components.callout.gap.none/sm/md/lg`       | `--callout-gap-*`                                            | `<callout gap>`; omitted uses `sm`                  |
| _(reuse)_ `components.card.padding.sm/md/lg` | `--card-padding-*`                                           | `<callout padding>`                                 |

#### Badge

`<badge>` is a hugging label. Paint axes: `variant="neutral|positive|warning|negative|informative"`, `emphasis="true|false"`, `border="true|false"` (brand `badge.border` when omitted). Default quiet fill is brand `badge.background` (not card). With border, stroke always follows the matching card `border.subtle`. Ink and status/emphasis fills reuse card. Nested `context="surface"` ink follows the badge variant.

| JSON                                                                             | CSS                                                | HTML                                                                   |
| -------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `components.badge.textSize`                                                      | `--badge-text-size` → `var(--text-size-*)`         | `<badge-text>` (brand-only; no `size` attribute)                       |
| `components.badge.border`                                                        | `--badge-border-width` → `sm` or `none`            | default when `border` is omitted; override with `border="true\|false"` |
| `components.badge.borderRadius`                                                  | `--badge-border-radius` → `var(--border-radius-*)` | badge corner                                                           |
| `components.badge.background`                                                    | `--badge-background`                               | default quiet fill (palette ref, optional opacity)                     |
| _(reuse)_ `components.card.foreground` / `background` / `border.subtle.{family}` | `--card-{family}-*`                                | ink, status/emphasis fills, and (when bordered) stroke paint           |

#### Slide footer

`<slide-footer>` is the chrome bar (logo, optional notes, deck title / chapter / page). It lives inside `<footer-container>` on content slides, or at the bottom of a cover layout. `context="slide"` (default) or `context="cover"` sets nested type ink from that canvas’s foreground tokens and is the logo surface when `data-logo` has no value. Nested type omits `context`. Do not hardcode white/black. Optional slots (notes, deck-title, chapter, logo) may be omitted; `|` separators hide when a neighbor is missing. Page is required.

| JSON                                | CSS                                               | HTML                                                                  |
| ----------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- | -------------------- |
| `components.slideFooter.textSize`   | `--slide-footer-text-size` → `var(--text-size-*)` | notes / deck title / chapter / page (brand-only; no `size` attribute) |
| `components.slideFooter.logoHeight` | `--slide-footer-logo-height` → `var(--spacing-*)` | `<img data-slot="logo">` height                                       |
| `components.slideFooter.gap`        | `--slide-footer-gap` → `var(--spacing-*)`         | space around `                                                        | ` between meta items |

#### Stack

| JSON                                 | CSS             | HTML                                       |
| ------------------------------------ | --------------- | ------------------------------------------ |
| `components.stack.gap.none/sm/md/lg` | `--stack-gap-*` | `<stack gap>` (`none` → spacing `0` / 0px) |

`<attribution-box>` is brand-agnostic — see `.cursor/skills/attribution-box/SKILL.md`. Do not add `attributionBox` keys to `brand-settings.json`.

## Logos

Each brand ships two standalone SVGs with **baked fills** (no `currentColor`, no `<symbol>` sprite):

| File                       | Use                                 |
| -------------------------- | ----------------------------------- |
| `{slug}-logo.svg`          | Default lockup on light backgrounds |
| `{slug}-logo-inverted.svg` | Light lockup on dark backgrounds    |

Presets use `<img data-logo="cover|slide|slide-surface">`. Inside `<slide-footer>`, omit the `data-logo` value (keep the attribute) so the logo follows the footer’s `context`. The showcase (and later deck generation) picks default vs inverted from the luminance of that surface token. Do not wrap brand logos in `color-*` classes.

The Gratia mark inside `<attribution-box>` is a separate prepared-by lockup (`<img data-slot="logo">`); leave it alone.

## Figma

Add a **Primitives** mode named after the brand (see [figma.md](figma.md)). Do not duplicate Color / Spacing / Radius / Typography collections. Write primitive font families (`font-family/display`, `font-family/base`) using the first quoted family from `foundations.font.family` in `brand-settings.json` (e.g. `"Inter"` not the CSS stack). Create `__Logo/{Brand}` from `{slug}-logo.svg` (baked fills; do not bind paths to `color/slide-foreground-strong`). Logo wordmarks are not bound to the family variables.
