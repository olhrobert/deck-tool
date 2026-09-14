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

Cover and slide settings live under `components.cover` and `components.slide` (cover title type, slide canvas/chrome). Canvas colors are themed: `components.slide.canvas.background.light|dark`. `foundations.colorTheme.cover` / `slide` is `light` or `dark` — covers (`<slide kind="cover">`) use the cover default when `color-theme` is omitted. Top-level groups, in order: `foundations` (`basic`, `color` — `brand`, `semantic`, `chart` — then `colorTheme`, `tone`, `font`, `border`) then `components` (`cover`, `slide`, `paragraphTitle`, `body`, `stack`, `card`, `callout`, `badge`, `stamp`, `slideFooter`). Shared tokens under `foundations.color` / `foundations.colorTheme` / `foundations.tone` / `foundations.font` / `foundations.border`; component type roles keep their own groups under `components`. `TOKEN_MAP` in `scripts/generate-brand-css.js` is the allow-list: keys with a CSS name become variables; `components.card.defaultLayout` is validated only (stripe default is a generated selector). The type scale and the **global** spacing scale (`--spacing-0` … `--spacing-40`) stay in `design-system/tokens/`. Font sizes are type-scale steps (`800`, `400`, …); semantic spacing is a spacing-scale step (`20`, `16`, `"0-5"`, …); component radius and stroke name a `foundations.border.radius` / `foundations.border.size` step (`med`, `sm`, …). Pixels appear on those two generic scales and on `components.slide.canvas.maxWidth` (canvas cap, default `1280`).

`design-system/tokens/colors.css` holds the **same role names** as `brand-settings.json` (a fallback when no `brand.css` is loaded) plus opacity variants (`-strong` / `-base` / `-subtle`) derived from `foundations.tone`. Brand identity, status hues, and chart swatches live under `foundations.color.brand.1`…`6`, `foundations.color.semantic.*`, and `foundations.color.chart.1`…`4` (omit unused brand slots).

**Color layers:** hard-coded RGB/RGBA lives on `foundations.color` — `brand` / status `semantic` / `chart` swatches. `semantic.neutral` and `semantic.bright` ref `brand.*`. Slide canvas paint is themed (`components.slide.canvas.background.light|dark`). Card/badge/stamp paint is keyed by variant then color-theme (`neutral.light`, `emphasis.dark`, `positive.dark`). Callout paint is themed (`neutral.light|dark`) for background, foreground, and stripe. Palette refs: `"semantic.positive"`, `"brand.3"`, `"chart.1"`, or `{ "color": "brand.1", "opacity": 0.8 }`. A family’s `foreground` is a hue; CSS applies `foundations.tone.strong|base|subtle` as opacity. `design-system/tokens/color-theme.css` is generated (light/dark remaps). Cover default (`slide[kind="cover"]:not([color-theme])`) is emitted in `brand.css` from `foundations.colorTheme.cover`, not hard-coded in the token file. The generator bakes refs into concrete `rgb`/`rgba` in `brand.css`. `validate-brand.js` checks WCAG AA on both canvas themes, slide surface, and each card/callout/badge/stamp `foreground` on its `background`.

### Cover

Cover is a **layout kind**, not a separate color role. Title/chapter presets use `<slide kind="cover">`. When `color-theme` is omitted, `foundations.colorTheme.cover` applies (Gratia and Riverton: `dark` — today’s former cover canvas colors). Type uses `context="slide"`; ink follows the resolved `--color-slide-foreground`.

| `brand-settings.json`           | CSS                                                  | What you see                                      |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `foundations.colorTheme.cover`  | `slide[kind="cover"]:not([color-theme])` remaps      | Default canvas theme for cover slides             |
| `components.cover.title.family` | `--cover-title-font-family` → `var(--font-family-*)` | `family="cover-title"`                            |
| `components.cover.attributionBox.default` | `--cover-attribution-box-display` (`flex` \| `none`) | Title-slide `<attribution-box>` when `attribution` is omitted. Override with `attribution="true\|false"`. |

### Slide

Content-slide canvas, title stack type, and chrome padding.

| `brand-settings.json`                                   | CSS                                                     | What you see / HTML                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `components.slide.canvas.background.light` / `dark` | `--color-slide-background-light` / `-dark` (resolved `--color-slide-background`) | Canvas fill. `<slide>` default is light (`foundations.colorTheme.slide`). `color-theme="dark"` or `kind="cover"` uses dark. `.bg-slide`. |
| `components.slide.canvas.foreground.light` / `dark` | `--color-slide-foreground-light` / `-dark` (resolved `--color-slide-foreground`) | Ink on the canvas. `context="slide"` with `tone="strong\|base\|subtle"`. |
| `components.slide.canvas.maxWidth`                      | `--slide-max-width`                                     | `<slide>` canvas cap (pixels)                                                                                                    |
| `components.slide.surface.background`                   | `--color-slide-surface-background`                      | Cards, `<attribution-box>` fill. Palette ref. `.bg-slide-surface`.                                                               |
| `components.slide.surface.foreground`                   | `--color-slide-surface-foreground`                      | Ink on those panels (cards, attribution). Palette ref.                                                                           |
| `components.slide.surface.border`                       | `--color-slide-surface-border`                          | Card stroke and attribution separator. Palette ref (often with opacity). `.border-color-slide-surface`.                          |
| `components.slide.pretitle.default`                     | `--slide-pretitle-default` (`text` \| `badge`)      | Brand default for the optional pre slot on `<slide-title-group>`                                                                 |
| `components.slide.pretitle.family`                      | `--slide-pretitle-font-family` → `var(--font-family-*)` | `<slide-pretitle>` (when `default` is `text`)                                                                                    |
| `components.slide.pretitle.weight`                      | `--slide-pretitle-font-weight` → `var(--font-weight-*)` |                                                                                                                                  |
| `components.slide.pretitle.uppercase`                   | `--slide-pretitle-text-transform`                       | brand default; override with `uppercase="true\|false"`                                                                           |
| `components.slide.pretitle.letterSpacing`               | `--slide-pretitle-letter-spacing`                       | percentage string, e.g. `"2%"`                                                                                                   |
| `components.slide.pretitle.size`                        | `--slide-pretitle-size` → `var(--text-size-*)`          | brand-only (no `size` attribute); text pretitles only                                                                            |
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

`<slide>` fills its container up to `canvas.maxWidth`. Cover slides (`<slide kind="cover">`) do not use this chrome. Defaults: maxWidth 1280, header 16/20/0/20, content 10/20/0/20, footer 4/4/4/4 (top/right/bottom/left). Set `color-theme="dark"` on a content slide to use the dark canvas (and dark card/badge/stamp paint). Nested `color-theme="light"` on a card restores light (quiet) paint.

The optional pre slot on `<slide-title-group>` is either `<slide-pretitle>` (`default: "text"`) or a quiet neutral `<badge data-slot="pre">` with `<badge-text>` (`default: "badge"`). Brand `components.slide.pretitle.default` picks which to use when authoring; decks may still override per slide. Gratia defaults to `badge`; Riverton to `text`. Text pretitles: `tone` is `subtle`, `context="slide"`. No markup size variants — one type-scale step per brand via `components.slide.pretitle.size`.

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

Context and tone are set in markup: `context="slide|surface"` and `tone="subtle|base|strong"`. Cover type uses `context="slide"` (canvas ink follows `color-theme`). Attribution still uses `context="surface"` because it sits on the attribution box.

#### Card

Paint axes on `<card>`: `variant="neutral|emphasis|positive|warning|negative|informative"`, optional `color-theme="light|dark"` (inherits), `layout="basic|stripe"`. Light/dark paint is `components.card.*.{variant}.light|dark`. Omit `layout` to use `components.card.defaultLayout`. Nested `context="surface"` ink follows the card's resolved tokens.

| JSON                                               | CSS                                                               | HTML                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `components.card.defaultLayout`                    | stripe selector in brand.css when `"stripe"`                      | default `<card>` layout when the attribute is omitted (not a CSS variable)                                    |
| `components.card.foreground.{variant}.{theme}`     | `--card-{variant}-foreground-light\|dark` (resolved `--card-{variant}-foreground`) | Ink hue. Variants `neutral\|emphasis\|positive\|…`; theme `light\|dark`. |
| `components.card.background.{variant}.{theme}`     | `--card-{variant}-background-light\|dark` (resolved `--card-{variant}-background`) | Card fill. |
| `components.card.padding.sm/md/lg`                 | `--card-padding-*`                                                | `<card padding>`                                                                                              |
| `components.card.gap.none/sm/md/lg`                | `--card-gap-*`                                                    | `<card gap>` (`none` → spacing `0` / 0px)                                                                     |
| `components.card.border.radius`                    | `--card-border-radius` → `var(--border-radius-*)`                 | `<card layout="basic">`                                                                                       |
| `components.card.border.sizeTop/Bottom/Left/Right` | `--card-border-size-*` → `var(--border-size-*)`                   | basic stroke                                                                                                  |
| `components.card.border.subtle.{variant}.{theme}`  | `--card-{variant}-border-subtle-light\|dark` (resolved `--card-{variant}-border-subtle`) | Basic (non-stripe) outline. |
| `components.card.stripe.width`                     | `--card-stripe-width` → `var(--border-size-*)`                    | Left accent width on `layout="stripe"`.                                                                       |
| `components.card.stripe.color.{variant}.{theme}`   | `--card-{variant}-stripe-light\|dark` (resolved `--card-{variant}-stripe`) | Stripe accent color. |
| `components.card.title.family`                     | `--card-title-font-family` → `var(--font-family-*)`               | `<card-title>`                                                                                                |
| `components.card.title.weight`                     | `--card-title-font-weight`                                        |                                                                                                               |
| `components.card.title.sizeSm/Md/Lg`               | `--card-title-size-sm/md/lg` → `var(--text-size-*)`               | `size="lg"` etc. Default is `md`.                                                                             |
| `components.card.meta.paddingTop`                  | `--card-meta-padding-top`                                         | `<card-meta>`                                                                                                 |

#### Callout

`<callout>` is a left-rule note with stacked title + description. Semantic variants only: `variant="neutral|positive|warning|negative|informative"` (no emphasis). Background, foreground, and stripe are themed (`neutral.light|dark`). Title uses `tone="strong"`, description `tone="base"` on the family’s `foreground` hue. Omit `gap` to use `callout.gap.sm`. Nested `context="surface"` ink follows the callout variant (strong / base / subtle). Padding is `components.callout.padding`.

| JSON                                         | CSS                                                          | HTML                                                |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `components.callout.background.{family}.{theme}` | `--callout-{family}-background-light\|dark` (resolved `--callout-{family}-background`) | Fill per variant. |
| `components.callout.foreground.{family}.{theme}` | `--callout-{family}-foreground-light\|dark` (resolved `--callout-{family}-foreground`) | Ink hue; strong/base opacity is `foundations.tone`. |
| `components.callout.title.family`            | `--callout-title-font-family` → `var(--font-family-*)`       | `<callout-title>`                                   |
| `components.callout.title.weight`            | `--callout-title-font-weight`                                |                                                     |
| `components.callout.title.size`              | `--callout-title-size` → `var(--text-size-*)`                | brand-only; no `size` attribute                     |
| `components.callout.description.family`      | `--callout-description-font-family` → `var(--font-family-*)` | `<callout-description>`                             |
| `components.callout.description.weight`      | `--callout-description-font-weight`                          |                                                     |
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
| `components.badge.text.family`           | `--badge-text-font-family` → `var(--font-family-*)`     | `<badge-text>`                                                         |
| `components.badge.text.weight`           | `--badge-text-font-weight`                              |                                                                        |
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
| `components.stamp.text.family`           | `--stamp-text-font-family` → `var(--font-family-*)`     | `<stamp-text>`                                                         |
| `components.stamp.text.weight`           | `--stamp-text-font-weight`                              |                                                                        |
| `components.stamp.text.scale`            | `--stamp-text-scale`                                    | `<stamp-text>` size as fraction of the stamp square (0–1]              |
| `components.stamp.border.radius`         | `--stamp-border-radius`                                 | `full` → `50%`; otherwise `var(--border-radius-*)`                     |

#### Slide footer

`<slide-footer>` is the chrome bar (logo, optional notes, deck title / chapter / page). It lives inside `<footer-container>` on content slides, or at the bottom of a cover layout. Nested type omits `context`; ink follows the slide canvas (`--color-slide-foreground-*`, so it tracks `color-theme`). Do not hardcode white/black. Optional slots (notes, deck-title, chapter, logo) may be omitted; `|` separators hide when a neighbor is missing. Page is required.

| JSON                                | CSS                                               | HTML                                                                  |
| ----------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- | -------------------- |
| `components.slideFooter.textSize`   | `--slide-footer-text-size` → `var(--text-size-*)` | notes / deck title / chapter / page (brand-only; no `size` attribute) |
| `components.slideFooter.logoHeight` | `--slide-footer-logo-height` → `var(--spacing-*)` | `<img data-slot="logo">` height                                       |
| `components.slideFooter.gap`        | `--slide-footer-gap` → `var(--spacing-*)`         | space around `                                                        | ` between meta items |

#### Stack

| JSON                                 | CSS             | HTML                                       |
| ------------------------------------ | --------------- | ------------------------------------------ |
| `components.stack.gap.none/sm/md/lg` | `--stack-gap-*` | `<stack gap>` (`none` → spacing `0` / 0px) |

`<attribution-box>` appearance is brand-agnostic — see `.cursor/skills/attribution-box/SKILL.md`. Do not add paint, spacing, or type keys for it. Title slides include the box in markup; `components.cover.attributionBox.default` shows or hides it when `attribution` is omitted (`true` Riverton, `false` Gratia). Override with `attribution="true|false"` on `<slide kind="cover">`.

## Logos

Each brand ships two standalone SVGs with **baked fills** (no `currentColor`, no `<symbol>` sprite):

| File                       | Use                                 |
| -------------------------- | ----------------------------------- |
| `{slug}-logo.svg`          | Default lockup on light backgrounds |
| `{slug}-logo-inverted.svg` | Light lockup on dark backgrounds    |

Presets use `<img data-logo>` (or `data-logo="slide"`). `data-logo="cover"` is an alias for the same canvas. `data-logo="slide-surface"` uses `--color-slide-surface-background`. Inside `<slide-footer>`, omit the `data-logo` value (keep the attribute) so the logo follows the slide canvas (`color-theme`). The showcase picks default vs inverted from the luminance of `--color-slide-background` on that slide. Do not wrap brand logos in `color-*` classes.

The Gratia mark inside `<attribution-box>` is a separate prepared-by lockup (`<img data-slot="logo">`); leave it alone.
