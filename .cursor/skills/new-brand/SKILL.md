---
name: new-brand
description: >-
  Create a new DeckTool brand (token override) besides riverton/gratia.
  Scaffolds brands/{slug}/, generates CSS, and validates contrast. Use when
  the user asks for a new brand, client theme, or brand-settings.json.
---

# New brand

HTML brands live in `brands/{slug}/`.

## Steps

1. Read `docs/brands.md`.
2. Scaffold (do not invent a schema):

```bash
node scripts/new-brand.js {slug} --name "{Display Name}"
```

3. Put the real colors, fonts, semantic spacing, radii, and border sizes into `brands/{slug}/brand-settings.json` under `foundations` and `components`. Define hard-coded RGB/RGBA on `foundations.color.brand.1`…`N` (as many as needed, ≤6), status hues on `foundations.color.semantic` (`positive`, `negative`, `warning`, `informative`), and `foundations.color.chart.1`…`4`. Set `semantic.neutral` to `"brand.1"` and `semantic.bright` to the light ink swatch (`"brand.5"` or `"brand.4"`). Set `foundations.tone` (`strong` / `base` / `subtle`) as opacities `1` / `0.7` / `0.5`. Set `foundations.colorTheme.cover` / `slide` to `light` or `dark`. Set `components.slide.canvas.background|foreground` to `{ "light": …, "dark": … }` palette refs — not raw RGB. `components.cover` is title type plus `attributionBox.default` (boolean; show the Gratia attribution box on title slides when `attribution` is omitted). Card paint lives under `components.card.foreground` / `background` / `border.subtle` / `stripe.color`, keyed by variant then color-theme (`neutral.light`, `emphasis.dark`, `positive.dark`), as palette refs (`semantic.*` / `brand.*` / `chart.*` with opacity). `components.card.stripe.width` names a `border.size` step. Callout paint lives under `components.callout.foreground` / `background` / `stripe.color`, keyed by variant then color-theme (`neutral.light`, `positive.dark`, …). `components.callout.stripe.width` names a `border.size` step. Badge paint lives under `components.badge.foreground` / `background` / `border.color`, keyed by the same themed families as card (including themed `emphasis`). `components.badge.border.hasBorderByDefault` is a boolean; `components.badge.border.width` names a `border.size` step used when the badge is bordered. `components.badge.icon.size` names a spacing-scale step for optional leading/trailing `<badge-icon>` marks. Stamp paint lives under `components.stamp.foreground` / `background`, keyed by the same themed families as card (including themed `emphasis`). `components.stamp.defaultSize` names a spacing-scale step for the default square; `components.stamp.icon.scale` and `components.stamp.text.scale` are unitless fractions (0–1] of that square; `components.stamp.border.radius` names a `border.radius` step (`full` compiles to `50%` so the stamp stays circular). Map roles using **Color tokens** in `docs/brands.md`. Spacing values are scale steps from `design-system/tokens/spacing.css`. Component `borderRadius` / `borderSize` name steps on the generic `border.radius` / `border.size` scales, not pixels. Do not add paint or spacing keys for the attribution box — load `.cursor/skills/attribution-box/SKILL.md`.
4. Replace `brands/{slug}/{slug}-logo.svg` and `{slug}-logo-inverted.svg` with standalone SVGs (root `viewBox`, baked fills, no `currentColor`). Inverted is the light lockup for dark backgrounds.
5. Validate:

```bash
node scripts/validate-brand.js brands/{slug}
```

Fix contrast failures before continuing. Open the showcase and switch to the new brand.

## Do not

- Edit `brand.css` by hand
- Skip `validate-brand.js`
