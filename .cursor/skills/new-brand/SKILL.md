---
name: new-brand
description: >-
  Create a new DeckTool brand (token override) besides riverton/vantage.
  Scaffolds brands/{slug}/, generates CSS, validates contrast, and adds a
  Figma Primitives mode plus __Logo component. Use when the user asks for a
  new brand, client theme, or brand.json.
---

# New brand

HTML brands live in `brands/{slug}/`. Figma theming is an extra **Primitives** mode, not a new Color collection.

## Steps

1. Read `docs/brands.md` and `docs/figma.md`.
2. Scaffold (do not invent a schema):

```bash
node scripts/new-brand.js {slug} --name "{Display Name}"
```

3. Put the real colors, fonts, radii, and border sizes into `brands/{slug}/brand.json`. Keep values as `rgb()` / `rgba()`.
4. Replace `brands/{slug}/logo.svg` with a `<symbol id="{slug}-logo">` sprite, `fill="currentColor"`.
5. Validate:

```bash
node scripts/validate-brand.js brands/{slug}
```

Fix contrast failures before continuing.

6. Figma (`figma/library.json` `fileKey`), `use_figma` with `skillNames`: `figma-use,figma-generate-library`:
   - Add a Primitives mode named `{Display Name}`
   - Write primitive color values for that mode from `brand.json` (map via `primitive/color/*` dsb keys)
   - Flatten the logo SVG, create `__Logo/{Display Name}`, size from viewBox, bind fills to `color/text-strong`
   - `setSharedPluginData("dsb", "key", "component/logo-{slug}")`
   - Return modeId + component id; append both to `figma/library.json`

7. Stop. Do not assemble a deck unless the user asked for one (then `generate-deck`).

## Do not

- Duplicate Color / Spacing / Radius collections
- Edit `brand.css` by hand
- Skip `validate-brand.js`
