---
name: new-brand
description: >-
    Create a new DeckTool brand (token override) besides riverton/gratia.
    Scaffolds brands/{slug}/, generates CSS, validates contrast, and adds a
    Figma Primitives mode plus __Logo component. Use when the user asks for a
    new brand, client theme, or brand-settings.json.
---

# New brand

HTML brands live in `brands/{slug}/`. Figma theming is an extra **Primitives** mode, not a new Color collection.

## Steps

1. Read `docs/brands.md` and `docs/figma.md`.
2. Scaffold (do not invent a schema):

```bash
node scripts/new-brand.js {slug} --name "{Display Name}"
```

3. Put the real colors, fonts, semantic spacing, radii, and border sizes into `brands/{slug}/brand-settings.json` under `foundations` and `components`. Define hard-coded RGB/RGBA on `foundations.color.brand.1`…`N` (as many as needed, ≤6), status hues on `foundations.color.semantic` (`positive`, `negative`, `warning`, `informative`), and `foundations.color.chart.1`…`4`. Set `semantic.neutral` to `"brand.1"` and `semantic.bright` to the light ink swatch (`"brand.5"` or `"brand.4"`). Set `foundations.tone` (`strong` / `base` / `subtle`) as opacities `1` / `0.7` / `0.5`. Set `components.cover` / `components.slide` color fields to palette refs (`"brand.2"` or `{ "color": "brand.1", "opacity": 0.18 }`) — not raw RGB. Card paint lives under `components.card.foreground` / `background` / `border.subtle` / `stripe.color`, keyed by flat family (`neutralQuiet`, `positiveEmphasis`, …), as palette refs (`semantic.*` / `brand.*` / `chart.*` with opacity). `components.card.stripe.width` names a `border.size` step. Callout paint lives under `components.callout.foreground` / `background` / `stripe.color`, keyed by quiet-only families (`neutralQuiet`, `positiveQuiet`, …). `components.callout.stripe.width` names a `border.size` step. Map roles using **Color tokens** in `docs/brands.md`. Spacing values are scale steps from `design-system/tokens/spacing.css`. Component `borderRadius` / `borderSize` name steps on the generic `border.radius` / `border.size` scales, not pixels. Do not add `attributionBox` keys — load `.cursor/skills/attribution-box/SKILL.md`.
4. Replace `brands/{slug}/{slug}-logo.svg` and `{slug}-logo-inverted.svg` with standalone SVGs (root `viewBox`, baked fills, no `currentColor`). Inverted is the light lockup for dark backgrounds.
5. Validate:

```bash
node scripts/validate-brand.js brands/{slug}
```

Fix contrast failures before continuing.

6. Figma (`figma/library.json` `fileKey`), `use_figma` with `skillNames`: `figma-use,figma-generate-library`:
    - Add a Primitives mode named `{Display Name}`
    - Write primitive color values for that mode from `brand-settings.json` (map via `primitive/color/*` dsb keys — role names: `cover-background`, `slide-foreground`, …)
    - Write primitive font families for that mode from `brand-settings.json` (first quoted family, not the CSS stack): `font.family.display` / `font.family.base`. The live Figma file may still expose `font-family/heading` and `font-family/body` — write those from `display` / `base` until the library pass. If the file still has `font-family/display` / `font-family/base`, write those keys the same way. Load those fonts before `setValueForMode`
    - Import `{slug}-logo.svg` as `__Logo/{Display Name}`, size from viewBox. Do not recolor paths; keep baked fills.
    - `setSharedPluginData("dsb", "key", "component/logo-{slug}")`
    - Return modeId + component id; append both to `figma/library.json`

7. Stop. Do not assemble a deck unless the user asked for one (then `generate-deck`).

## Do not

- Duplicate Color / Spacing / Radius collections
- Edit `brand.css` by hand
- Skip `validate-brand.js`
