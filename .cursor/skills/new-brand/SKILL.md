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

3. Put the real colors, fonts, radii, and border sizes into `brands/{slug}/brand-settings.json`. Keep values as `rgb()` / `rgba()`. Map colors by slide role using **Color tokens** in `docs/brands.md` (`cover.background` = title fill, not “the logo color”).
4. Replace `brands/{slug}/{slug}-logo.svg` and `{slug}-logo-inverted.svg` with standalone SVGs (root `viewBox`, baked fills, no `currentColor`). Inverted is the light lockup for dark backgrounds.
5. Validate:

```bash
node scripts/validate-brand.js brands/{slug}
```

Fix contrast failures before continuing.

6. Figma (`figma/library.json` `fileKey`), `use_figma` with `skillNames`: `figma-use,figma-generate-library`:
   - Add a Primitives mode named `{Display Name}`
   - Write primitive color values for that mode from `brand-settings.json` (map via `primitive/color/*` dsb keys — role names: `cover-background`, `slide-foreground`, …)
   - Write `primitive/font-family/heading` and `primitive/font-family/body` for that mode — first quoted family from `fonts.heading` / `fonts.body` (not the CSS stack). If the file still has `font-family/display` / `font-family/base`, write those keys from heading/body. Load those fonts before `setValueForMode`
   - Import `{slug}-logo.svg` as `__Logo/{Display Name}`, size from viewBox. Do not recolor paths; keep baked fills.
   - `setSharedPluginData("dsb", "key", "component/logo-{slug}")`
   - Return modeId + component id; append both to `figma/library.json`

7. Stop. Do not assemble a deck unless the user asked for one (then `generate-deck`).

## Do not

- Duplicate Color / Spacing / Radius collections
- Edit `brand.css` by hand
- Skip `validate-brand.js`
