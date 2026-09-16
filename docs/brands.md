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

The showcase brand switcher loads `brands/{slug}/brand.css`. After JSON edits, regenerate with `npm run generate-brand -- brands/{slug}` (or the brand-settings edit hook).

## `brand-settings.json` fields

Each HTML component is its own group under `components` (`coverTitle`, `slideTitle`, `attributionBox`, `headerContainer`, …). Type style lives on `foundations.font` (`title`, `heading`, `stat`, `text`, `label`); components name one role via `.font`. Canvas colors are themed: `components.slide.canvas.background.light|dark`. `foundations.colorTheme.cover` / `slide` is `light` or `dark` — covers (`<slide kind="cover">`) use the cover default when `color-theme` is omitted. Top-level groups, in order: `foundations` (`basic`, `color` — `brand`, `semantic`, `chart` — then `colorTheme`, `tone`, `font`, `border`) then `components` (one group per component tag). Shared tokens under `foundations.color` / `foundations.colorTheme` / `foundations.tone` / `foundations.font` / `foundations.border`. `TOKEN_MAP` in `scripts/generate-brand-css.js` is the allow-list: keys with a CSS name become variables; `components.card.defaultLayout` is validated only (stripe default is a generated selector). The type scale and the **global** spacing scale (`--spacing-0` … `--spacing-40`) stay in `design-system/tokens/`. Font sizes are type-scale steps (`800`, `400`, …); semantic spacing is a spacing-scale step (`20`, `16`, `"0-5"`, …); component radius and stroke name a `foundations.border.radius` / `foundations.border.size` step (`med`, `sm`, …). Pixels appear on those two generic scales, on `components.slide.canvas.maxWidth` (canvas cap, default `1280`), and on `components.divider.width` (hairline stroke, typically `1`).

`design-system/tokens/colors.css` holds the **same role names** as `brand-settings.json` (a fallback when no `brand.css` is loaded) plus opacity variants (`-strong` / `-base` / `-subtle`) derived from `foundations.tone`. Brand identity, status hues, and chart swatches live under `foundations.color.brand.1`…`6`, `foundations.color.semantic.*`, and `foundations.color.chart.1`…`4` (omit unused brand slots).

**Color layers:** hard-coded RGB/RGBA lives on `foundations.color` — `brand` / status `semantic` / `chart` swatches. `semantic.neutral` and `semantic.bright` ref `brand.*`. Slide canvas paint is themed (`components.slide.canvas.background.light|dark`). Card/badge/stamp paint is keyed by variant then color-theme (`neutral.light`, `emphasis.dark`, `positive.dark`). Callout paint is themed (`neutral.light|dark`) for background, foreground, and stripe. Palette refs: `"semantic.positive"`, `"brand.3"`, `"chart.1"`, or `{ "color": "brand.1", "opacity": 0.8 }`. A family’s `foreground` is a hue; CSS applies `foundations.tone.strong|base|subtle` as opacity. `design-system/tokens/color-theme.css` is generated (light/dark remaps). Cover default (`slide[kind="cover"]:not([color-theme])`) is emitted in `brand.css` from `foundations.colorTheme.cover`, not hard-coded in the token file. The generator bakes refs into concrete `rgb`/`rgba` in `brand.css`. `validate-brand.js` checks WCAG AA on both canvas themes, slide surface, and each card/callout/badge/stamp `foreground` on its `background`.

### Cover

Cover is a **layout kind**, not a component group. Title/chapter presets use `<slide kind="cover">`. When `color-theme` is omitted, `foundations.colorTheme.cover` applies (Gratia and Riverton: `dark` — today’s former cover canvas colors). Type uses `context="slide"`; ink follows the resolved `--color-slide-foreground`. Cover title tokens live on `components.coverTitle`.

| `brand-settings.json`           | CSS                                                  | What you see                                      |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `foundations.colorTheme.cover`  | `slide[kind="cover"]:not([color-theme])` remaps      | Default canvas theme for cover slides             |
| `components.coverTitle.font` | `--cover-title-font-family` / `-weight` → `var(--font-{role}-*)` | style role (`title` typically) |
| `components.coverTitle.sizeSm/Md/Lg/Xl` | `--cover-title-size-sm/md/lg/xl` → `var(--text-size-*)` | `size="xl"` etc. Default is `md`.            |
| `components.attributionBox.default` | `--attribution-box-display` (`flex` \| `none`) | Title-slide `<attribution-box>` when `attribution` is omitted. Override with `attribution="true\|false"`. |

### Slide

`<slide>` canvas and shared surface paint. Title stack tokens live on `components.slideTitle`. Chrome padding lives on `headerContainer` / `contentContainer` / `footerContainer`.

| `brand-settings.json`                                   | CSS                                                     | What you see / HTML                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `components.slide.canvas.background.light` / `dark` | `--color-slide-background-light` / `-dark` (resolved `--color-slide-background`) | Canvas fill. `<slide>` default is light (`foundations.colorTheme.slide`). `color-theme="dark"` or `kind="cover"` uses dark. `.bg-slide`. |
| `components.slide.canvas.foreground.light` / `dark` | `--color-slide-foreground-light` / `-dark` (resolved `--color-slide-foreground`) | Ink on the canvas. `context="slide"` with `tone="strong\|base\|subtle"`. |
| `components.slide.canvas.maxWidth`                      | `--slide-max-width`                                     | `<slide>` canvas cap (pixels)                                                                                                    |
| `components.slide.surface.background`                   | `--color-slide-surface-background`                      | Cards, `<attribution-box>` fill. Palette ref. `.bg-slide-surface`.                                                               |
| `components.slide.surface.foreground`                   | `--color-slide-surface-foreground`                      | Ink on those panels (cards, attribution). Palette ref.                                                                           |
| `components.slideTitle.pretitle.default`                     | `--slide-pretitle-default` (`text` \| `badge`)      | Brand default for the optional pre slot on `<slide-title-group>`                                                                 |
| `components.slideTitle.pretitle.font`                        | `--slide-pretitle-font-family` / `-weight`              | style role (`label` typically)                                                                                                   |
| `components.slideTitle.pretitle.uppercase`                   | `--slide-pretitle-text-transform`                       | brand default; override with `uppercase="true\|false"`                                                                           |
| `components.slideTitle.pretitle.letterSpacing`               | `--slide-pretitle-letter-spacing`                       | percentage string, e.g. `"2%"`                                                                                                   |
| `components.slideTitle.pretitle.size`                        | `--slide-pretitle-size` → `var(--text-size-*)`          | brand-only (no `size` attribute); text pretitles only                                                                            |
| `components.slideTitle.title.gap`                            | `--slide-title-gap`                                     | `<slide-title-group>`                                                                                                            |
| `components.slideTitle.title.font`                           | `--slide-title-font-family` / `-weight`                 | style role (`title` typically)                                                                                                   |
| `components.slideTitle.title.sizeSm/Md/Lg`                   | `--slide-title-size-sm/md/lg` → `var(--text-size-*)`    | `size="lg"` etc.                                                                                                                 |
| `components.slideTitle.subtitle.font`                        | `--slide-subtitle-font-family` / `-weight`              | style role (`text` typically)                                                                                                    |
| `components.slideTitle.subtitle.size`                        | `--slide-subtitle-size` → `var(--text-size-*)`          |                                                                                                                                  |
| `components.headerContainer.paddingTop/Right/Bottom/Left`  | `--slide-header-padding-*`                              | `<header-container>`                                                                                                             |
| `components.contentContainer.paddingTop/Right/Bottom/Left` | `--slide-content-padding-*`                             | `<content-container>`                                                                                                            |
| `components.footerContainer.paddingTop/Right/Bottom/Left`  | `--slide-footer-padding-*`                              | `<footer-container>`                                                                                                             |

`<slide>` fills its container up to `canvas.maxWidth`. Cover slides (`<slide kind="cover">`) do not use this chrome. Defaults: maxWidth 1280, header 16/20/0/20, content 10/20/0/20, footer 4/4/4/4 (top/right/bottom/left). Set `color-theme="dark"` on a content slide to use the dark canvas (and dark card/badge/stamp paint). Nested `color-theme="light"` on a card restores light (quiet) paint.

The optional pre slot on `<slide-title-group>` is either `<slide-pretitle>` (`default: "text"`) or a quiet neutral `<badge data-slot="pre">` with `<badge-text>` (`default: "badge"`). Brand `components.slideTitle.pretitle.default` picks which to use when authoring; decks may still override per slide. Gratia defaults to `badge`; Riverton to `text`. Text pretitles: `tone` is `subtle`, `context="slide"`. No markup size variants — one type-scale step per brand via `components.slideTitle.pretitle.size`. `align="left|center|right"` on the group (default `left`) aligns the stack; set `align="center"` on split-media presets.

### Shared color tokens

| `brand-settings.json`                                                          | CSS                                                    | What you see                                                                                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `foundations.color.brand.1`…`6`                                                | `--color-palette-brand-1` … `--color-palette-brand-6`  | Hard-coded identity swatches (omit unused). Role colors ref these by name (`"brand.2"`).                                              |
| `foundations.color.semantic.neutral` / `bright`                                | `--color-semantic-neutral` / `--color-semantic-bright` | Dark and light ink hues. Refs (`"brand.1"`, `"brand.5"`).                                                                             |
| `foundations.color.semantic.positive` / `negative` / `warning` / `informative` | `--color-semantic-positive` …                          | Hard-coded status hues (between Brand and Chart). Cards ref these plus opacity.                                                       |
| `foundations.colorTheme.cover` / `slide`                                       | (not a CSS variable; drives cover default remaps)      | `light` or `dark`. Cover slides omit `color-theme` and pick this. Content slides default to `slide`. |
| `foundations.tone.strong` / `base` / `subtle`                                  | `--tone-strong` / `--tone-base` / `--tone-subtle`      | Opacity for type and card ink (typically `1` / `0.7` / `0.5`). Canvas `-strong`/`-base`/`-subtle` and card `tone="…"` use these. |
| `foundations.color.chart.1`…`4`                                                | `--color-palette-chart-1` … `--color-palette-chart-4`  | Hard-coded chart palette. `.color-palette-chart-*` utilities. Roles may ref (`"chart.1"`).                                            |

Palette refs drop `foundations.color.`: `"brand.2"`, `"semantic.positive"`, `"semantic.neutral"`, `"chart.1"`.

**Typical mapping:** title/chapter slides → `<slide kind="cover">` (brand cover color-theme, usually dark); content slides → light canvas; light cards → `components.card.*.neutral.light`; dark cards inherit `color-theme="dark"` (`neutral.dark`). Stripe chrome → `components.card.stripe`.

### Font tokens

Named families (`display`, `base`) live under `foundations.font.family` as CSS stacks. Named weights (`regular`, `medium`, `bold`) live under `foundations.font.weight` as CSS numbers matching `@font-face` in `design-system/tokens/fonts.css`. **Style roles** (`title`, `heading`, `stat`, `text`, `label`) each name one family + one weight. Components do not set family/weight — they set `.font` to a role. `<text family="heading">` names a role; `<text weight="bold">` still names a weight and overrides it. A brand can map two weight names to the same number (e.g. medium and bold both 500).

**Sizes are type-scale steps**, not pixels. The scale lives in `design-system/tokens/typography.css` (`--text-size-800` = 32px, `--text-size-400` = 16px, …). `<slide-title size="lg">` uses whatever step `components.slideTitle.title.sizeLg` names.

| Named weight | Typical file                                     |
| ------------ | ------------------------------------------------ |
| `regular`    | Regular (`400`)                                  |
| `medium`     | Medium (`500`)                                   |
| `bold`       | SemiBold (`600`) or Bold (`700`) — brand-defined |

| `brand-settings.json`                    | CSS                                                      | HTML                              |
| ---------------------------------------- | -------------------------------------------------------- | --------------------------------- |
| `foundations.font.family.display`        | `--font-family-display`                                  | display stack                     |
| `foundations.font.family.base`           | `--font-family-base`                                     | base stack                        |
| `foundations.font.weight.regular`        | `--font-weight-regular`                                  | `<text weight="regular">`         |
| `foundations.font.weight.medium`         | `--font-weight-medium`                                   | `<text weight="medium">`          |
| `foundations.font.weight.bold`           | `--font-weight-bold`                                     | `<text weight="bold">`            |
| `foundations.font.title.family` / `weight` | `--font-title-family` / `--font-title-weight`          | `<text family="title">`; `<cover-title>`, `<slide-title>` |
| `foundations.font.heading.family` / `weight` | `--font-heading-family` / `--font-heading-weight`    | `<text family="heading">`; `<card-title>`, `<callout-title>` |
| `foundations.font.stat.family` / `weight` | `--font-stat-family` / `--font-stat-weight`             | `<text family="stat">`            |
| `foundations.font.text.family` / `weight` | `--font-text-family` / `--font-text-weight`             | `<text>` default; subtitle, badge, stamp, footer |
| `foundations.font.label.family` / `weight` | `--font-label-family` / `--font-label-weight`           | `<text family="label">`; `<slide-pretitle>`, `<card-pretitle>` |

Canvas copy uses **`<text size="<scale-step>">`**. Default size is `400` (16px); default tone is `base`; default style is `foundations.font.text`. Use `family="heading"` for in-body titles, `family="stat"` for metrics, `family="label"` for pretitles, `family="title"` for cover-scale headlines that are not `<slide-title>` / `<cover-title>`. Style roles are **family + weight only** — size stays on the element. Cover titles use **`<cover-title size="sm|md|lg|xl">`** (`coverTitle.font` plus `size*`). Omit `weight` on a role so the brand role weight applies; set `weight="regular|medium|bold"` only to override it.

`<text>` is the canvas typography primitive. Axes: `tone`, raw `size`, `uppercase`, `context`, plus `family`, `weight`, `lineheight`, `letterspacing`. Semantic tags (`<cover-title>`, `<slide-pretitle>`, `<card-pretitle>`, `<slide-title>`, `<slide-subtitle>`, …) are presets that inherit shared axes, take style from `.font`, and bake size where the component has size tokens. Default tone is `strong` on `<cover-title>`. Use `<slide-title-group>` when stacking pretitle + title + subtitle.

Example — Gratia-style named weights and style roles, then make slide-title `lg` use scale 800 (32px):

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
  "title": { "family": "display", "weight": "bold" },
  "heading": { "family": "base", "weight": "bold" },
  "stat": { "family": "base", "weight": "bold" },
  "text": { "family": "base", "weight": "regular" },
  "label": { "family": "base", "weight": "medium" }
},
"slideTitle": {
  "title": {
    "font": "title",
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
| `components.card.pretitle.font`          | `--card-pretitle-font-family` / `-weight`              | style role (`label` typically)                     |
| `components.card.pretitle.uppercase`     | `--card-pretitle-text-transform`                       | brand default; override with `uppercase="true\|false"` |
| `components.card.pretitle.letterSpacing` | `--card-pretitle-letter-spacing`                       | percentage string, e.g. `"2%"`                         |
| `components.card.pretitle.size`          | `--card-pretitle-size` → `var(--text-size-*)`          | brand-only (no `size` attribute)                       |

Slide and card pretitles use separate token groups (`components.slideTitle.pretitle` vs `components.card.pretitle`). Both typically set `"font": "label"`; uppercase, letter-spacing, and `size` can still differ (e.g. slide step `350`, card step `300`).

Context and tone are set in markup: `context="slide|surface"` and `tone="subtle|base|strong"`. Cover type uses `context="slide"` (canvas ink follows `color-theme`). Attribution still uses `context="surface"` because it sits on the attribution box.

#### Card

Paint axes on `<card>`: `variant="neutral|emphasis|positive|warning|negative|informative"`, optional `color-theme="light|dark"` (inherits), `layout="basic|stripe"`. Light/dark paint is `components.card.*.{variant}.light|dark`. Omit `layout` to use `components.card.defaultLayout`. Nested `context="surface"` ink follows the card's resolved tokens.

| JSON                                               | CSS                                                               | HTML                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `components.card.defaultLayout`                    | stripe selector in brand.css when `"stripe"`                      | default `<card>` layout when the attribute is omitted (not a CSS variable)                                    |
| `components.card.foreground.{variant}.{theme}`     | `--card-{variant}-foreground-light\|dark` (resolved `--card-{variant}-foreground`) | Ink hue. Variants `neutral\|emphasis\|positive\|…`; theme `light\|dark`. |
| `components.card.background.{variant}.{theme}`     | `--card-{variant}-background-light\|dark` (resolved `--card-{variant}-background`) | Card fill. |
| `components.card.padding.sm/md/lg/xl`              | `--card-padding-*`                                                | `<card padding>`                                                                                              |
| `components.card.gap.none/sm/md/lg`                | `--card-gap-*`                                                    | `<card gap>` (`none` → spacing `0` / 0px)                                                                     |
| `components.card.border.radius`                    | `--card-border-radius` → `var(--border-radius-*)`                 | `<card layout="basic">`                                                                                       |
| `components.card.border.sizeTop/Bottom/Left/Right` | `--card-border-size-*` → `var(--border-size-*)`                   | basic stroke                                                                                                  |
| `components.card.border.subtle.{variant}.{theme}`  | `--card-{variant}-border-subtle-light\|dark` (resolved `--card-{variant}-border-subtle`) | Basic (non-stripe) outline. |
| `components.card.stripe.width`                     | `--card-stripe-width` → `var(--border-size-*)`                    | Left accent width on `layout="stripe"`.                                                                       |
| `components.card.stripe.color.{variant}.{theme}`   | `--card-{variant}-stripe-light\|dark` (resolved `--card-{variant}-stripe`) | Stripe accent color. |
| `components.card.title.font`                       | `--card-title-font-family` / `-weight`                            | style role (`heading` typically)                                                                              |
| `components.card.title.sizeSm/Md/Lg`               | `--card-title-size-sm/md/lg` → `var(--text-size-*)`               | `size="lg"` etc. Default is `md`. For a custom scale step, use `<text family="heading" size="…">` instead.   |
| `components.card.meta.font`                        | `--card-meta-font-family` / `-weight`                             | style role (`text` typically)                                                                                 |
| `components.card.meta.paddingTop`                  | `--card-meta-padding-top`                                         | `<card-meta>`                                                                                                 |

#### Callout

`<callout>` is a left-rule note with stacked title + description. Semantic variants only: `variant="neutral|positive|warning|negative|informative"` (no emphasis). Background, foreground, and stripe are themed (`neutral.light|dark`). Title uses `tone="strong"`, description `tone="base"` on the family’s `foreground` hue. Omit `gap` to use `callout.gap.sm`. Nested `context="surface"` ink follows the callout variant (strong / base / subtle). Padding is `components.callout.padding`.

| JSON                                         | CSS                                                          | HTML                                                |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `components.callout.background.{family}.{theme}` | `--callout-{family}-background-light\|dark` (resolved `--callout-{family}-background`) | Fill per variant. |
| `components.callout.foreground.{family}.{theme}` | `--callout-{family}-foreground-light\|dark` (resolved `--callout-{family}-foreground`) | Ink hue; strong/base opacity is `foundations.tone`. |
| `components.callout.title.font`              | `--callout-title-font-family` / `-weight`                    | style role (`heading`)                              |
| `components.callout.title.size`              | `--callout-title-size` → `var(--text-size-*)`                | brand-only; no `size` attribute                     |
| `components.callout.description.font`        | `--callout-description-font-family` / `-weight`              | style role (`text`)                                 |
| `components.callout.description.size`        | `--callout-description-size` → `var(--text-size-*)`          | brand-only; no `size` attribute                     |
| `components.callout.stripe.width`            | `--callout-stripe-width` → `var(--border-size-*)`            | left accent width                                   |
| `components.callout.stripe.color.{family}.{theme}` | `--callout-{family}-stripe-light\|dark` (resolved `--callout-{family}-stripe`) | left accent color |
| `components.callout.gap.none/sm/md/lg`       | `--callout-gap-*`                                            | `<callout gap>`; omitted uses `sm`                  |
| `components.callout.padding.sm/md/lg`        | `--callout-padding-*`                                        | `<callout padding>`; omitted uses `md`              |

#### Badge

`<badge>` is a hugging label. Paint axes: `variant="neutral|emphasis|positive|warning|negative|informative"`, optional `color-theme="light|dark"` (inherits), `border="true|false"` (brand `badge.border.hasBorderByDefault` when omitted). Paint uses the same themed families as card. Nested `context="surface"` ink follows the badge. Optional `<badge-icon data-slot="leading|trailing" icon="…">` marks use filenames from `assets/icons/` (no `.svg`) and paint with the badge text ink.

| JSON                                     | CSS                                                     | HTML                                                                   |
| ---------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `components.badge.background.{variant}.{theme}` | `--badge-{variant}-background-light\|dark` (resolved `--badge-{variant}-background`) | Fill. |
| `components.badge.foreground.{variant}.{theme}` | `--badge-{variant}-foreground-light\|dark` (resolved `--badge-{variant}-foreground`) | Ink hue; strong/base/subtle opacity is `foundations.tone`. |
| `components.badge.text.font`             | `--badge-text-font-family` / `-weight`                  | style role (`text` typically)                                          |
| `components.badge.text.size`             | `--badge-text-size` → `var(--text-size-*)`              | brand-only; no `size` attribute                                        |
| `components.badge.icon.size`             | `--badge-icon-size` → `var(--spacing-*)`                | `<badge-icon>` width/height                                            |
| `components.badge.border.hasBorderByDefault` | `--badge-border-default` → `badge.border.width` or `none` | default when `border` is omitted; override with `border="true\|false"` |
| `components.badge.border.radius`         | `--badge-border-radius` → `var(--border-radius-*)`      | badge corner                                                           |
| `components.badge.border.width`          | `--badge-border-width` → `var(--border-size-*)`         | stroke when bordered (`border="true"` or `hasBorderByDefault` is true) |
| `components.badge.border.color.{variant}.{theme}` | `--badge-{variant}-border-light\|dark` (resolved `--badge-{variant}-border`) | stroke paint when bordered. |
| `components.badge.padding.block`         | `--badge-padding-block` → `var(--spacing-*)`            | vertical padding                                                       |
| `components.badge.padding.inline`        | `--badge-padding-inline` → `var(--spacing-*)`           | horizontal padding                                                     |

#### Stamp

`<stamp>` is a fixed square with one occupant — a number (`<stamp-text>`) or an icon (`<stamp-icon icon="…">`). Paint axes: `variant="neutral|emphasis|positive|warning|negative|informative"`, optional `color-theme="light|dark"` (inherits). `size` is a spacing-scale step (`size="12"` → `--spacing-12`); omit it to use the brand default. Icon and type scale with the square via brand unitless factors (`icon.scale`, `text.scale`) — do not set padding or absolute icon/type sizes. Nested ink follows the stamp variant. `components.stamp.border.radius` of `full` compiles to `50%` so the stamp stays circular at every size; `none` / `sm` / `med` / `lg` keep the brand pixel corner (rectangle).

| JSON                                     | CSS                                                     | HTML                                                                   |
| ---------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `components.stamp.background.{variant}.{theme}` | `--stamp-{variant}-background-light\|dark` (resolved `--stamp-{variant}-background`) | Fill. |
| `components.stamp.foreground.{variant}.{theme}` | `--stamp-{variant}-foreground-light\|dark` (resolved `--stamp-{variant}-foreground`) | Ink hue; strong/base/subtle opacity is `foundations.tone`. |
| `components.stamp.defaultSize`           | `--stamp-default-size` → `var(--spacing-*)`             | default when `size` is omitted                                         |
| `components.stamp.icon.scale`            | `--stamp-icon-scale`                                    | `<stamp-icon>` size as fraction of the stamp square (0–1]              |
| `components.stamp.text.font`             | `--stamp-text-font-family` / `-weight`                  | style role (`text` typically)                                          |
| `components.stamp.text.scale`            | `--stamp-text-scale`                                    | `<stamp-text>` size as fraction of the stamp square (0–1]              |
| `components.stamp.border.radius`         | `--stamp-border-radius`                                 | `full` → `50%`; otherwise `var(--border-radius-*)`                     |

#### Slide footer

`<slide-footer>` is the chrome bar (logo, optional notes, deck title / chapter / page). It lives inside `<footer-container>` on content slides, or at the bottom of a cover layout. Nested type omits `context`; ink follows the slide canvas (`--color-slide-foreground-*`, so it tracks `color-theme`). Do not hardcode white/black. Optional slots (notes, deck-title, chapter, logo) may be omitted; `|` separators hide when a neighbor is missing. Page is required.

| JSON                                | CSS                                               | HTML                                                                  |
| ----------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- | -------------------- |
| `components.slideFooter.font`       | `--slide-footer-font-family` / `-weight`              | style role (`text` typically)                                         |
| `components.slideFooter.textSize`   | `--slide-footer-text-size` → `var(--text-size-*)` | notes / deck title / chapter / page (brand-only; no `size` attribute) |
| `components.slideFooter.logoHeight` | `--slide-footer-logo-height` → `var(--spacing-*)` | `<img data-slot="logo">` height                                       |
| `components.slideFooter.gap`        | `--slide-footer-gap` → `var(--spacing-*)`         | space around `                                                        | ` between meta items |

#### Stack

`<stack gap>` is a spacing-scale step from `design-system/tokens/spacing.css` (`0`…`40`, `0-5`, …), not a brand token. Default is `4` (16px). Use `gap="0"` for none. Do not add `components.stack`.

#### Divider

`<divider>` is a hairline. Omit `orientation` for full width; `orientation="vertical"` is full height in a row. Color is themed (`light` | `dark`); width is a pixel integer, not a border.size step.

| JSON                              | CSS                      | HTML         |
| --------------------------------- | ------------------------ | ------------ |
| `components.divider.color.light`  | `--divider-color-light`  | light stroke |
| `components.divider.color.dark`   | `--divider-color-dark`   | dark stroke  |
| `components.divider.width`        | `--divider-width`        | stroke in px |

Resolved `--divider-color` follows `color-theme` (and the cover default). Showcase chrome and `<attribution-box-separator>` use the same stroke. `.border-color-divider` is the utility.

`<attribution-box>` appearance is brand-agnostic — see `.cursor/skills/attribution-box/SKILL.md`. Do not add paint, spacing, or type keys for it. Title slides include the box in markup; `components.attributionBox.default` shows or hides it when `attribution` is omitted (`true` Riverton, `false` Gratia). Override with `attribution="true|false"` on `<slide kind="cover">`.

## Logos

Each brand ships two standalone SVGs with **baked fills** (no `currentColor`, no `<symbol>` sprite):

| File                       | Use                                 |
| -------------------------- | ----------------------------------- |
| `{slug}-logo.svg`          | Default lockup on light backgrounds |
| `{slug}-logo-inverted.svg` | Light lockup on dark backgrounds    |

Presets use `<img data-logo>` (or `data-logo="slide"`). `data-logo="cover"` is an alias for the same canvas. `data-logo="slide-surface"` uses `--color-slide-surface-background`. Inside `<slide-footer>`, omit the `data-logo` value (keep the attribute) so the logo follows the slide canvas (`color-theme`). The showcase picks default vs inverted from the luminance of `--color-slide-background` on that slide. Do not wrap brand logos in `color-*` classes.

The Gratia mark inside `<attribution-box>` is a separate prepared-by lockup (`<img data-slot="logo">`); leave it alone.

Content marks (partners, analyst firms, logo grids) live in `assets/logos/pool/{slug}.svg` plus `{slug}-inverted.svg` (`thoughtworks.png` is the one raster). Do not put `data-logo` on them — that attribute is only for the presenting brand lockup. Add more with `scripts/add-pool-logo.js` (see [scripts.md](scripts.md)).
