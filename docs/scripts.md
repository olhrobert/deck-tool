# Scripts

Node is required. No `npm install` — they use only Node built-ins.

## `new-brand.js`

Scaffolds `brands/{slug}/` from the Riverton `brand-settings.json` template, copies the placeholder logo pair (default + inverted), and generates `brand.css`.

```bash
node scripts/new-brand.js acme --name "Acme Capital"
npm run new-brand -- acme --name "Acme Capital"
```

Then edit `brand-settings.json` / `{slug}-logo.svg` and run `validate-brand.js`. See [brands.md](brands.md).

---

## `validate-brand.js`

Checks `TOKEN_MAP` keys, type-scale and spacing-scale steps, `slide.canvas.maxWidth` as a pixel integer, color parse, `foundations.tone` opacities, `foundations.colorTheme.cover|slide`, WCAG AA for both slide canvas themes plus surface foreground-on-background pairs and each card, callout, badge, and stamp `foreground` on `background`, and that `{slug}-logo.svg` and `{slug}-logo-inverted.svg` exist as standalone SVGs with a root `viewBox`.

```bash
node scripts/validate-brand.js brands/riverton
npm run validate-brand -- brands/riverton
```

---

## `generate-brand-css.js`

Maps `brand-settings.json` → `brand.css`. Also writes `design-system/tokens/color-theme.css` (light/dark remaps; cover default stays in brand.css). Called by `new-brand.js` and the brand-settings edit hook.

```bash
node scripts/generate-brand-css.js brands/riverton
npm run generate-brand -- brands/riverton
```

Rebuild every brand (after editing several `brand-settings.json` files, or before opening the showcase):

```bash
node scripts/generate-all-brands.js
npm run generate-brand:all
```

---

## `generate-icon-css.js`

Maps every `assets/icons/*.svg` filename onto `:is(badge-icon, stamp-icon)[icon="{name}"]` CSS so badge and stamp icons resolve from any HTML path. Run after adding or renaming icons.

```bash
node scripts/generate-icon-css.js
npm run generate-icons
```
