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

## `add-pool-logo.js`

Downloads the deck logo pool into `assets/logos/pool/` from Wikimedia Commons (wordmark + white inverted pair). Extra slugs can come from Simple Icons. Brandfetch CDN URLs must stay hotlinked — do not scrape them.

```bash
node scripts/add-pool-logo.js --seed
node scripts/add-pool-logo.js --file ~/Downloads/acme.svg acme
npm run add-pool-logo -- --file ~/Downloads/acme.svg acme
```

`--seed` replaces `assets/logos/pool/` with the current deck set (Wikimedia Commons wordmarks). `--force` overwrites a single Simple Icons add. Use `--file` for a lockup that is not in the seed or Simple Icons.

---

## `generate-icon-css.js`

Maps every `assets/icons/*.svg` filename onto `:is(badge-icon, stamp-icon)[icon="{name}"]` CSS so badge and stamp icons resolve from any HTML path. Run after adding or renaming icons.

```bash
node scripts/generate-icon-css.js
npm run generate-icons
```

---

## Figma sync

Gratia-only. Node emits JSON; a plugin applies it in the target file (Plugin API). The file key lives in `scripts/figma/.figma-file.json` (gitignored). Re-run the extract scripts after brand or component edits; they also regenerate `scripts/figma/plugin/code.js`.

CSS names become Figma names by dropping the `--` (`--spacing-0-5` → `spacing-0-5`, `--slide-pretitle-font-family` → `slide-pretitle-font-family`). Slashes are not used, so Figma does not nest extra groups. Light/dark CSS suffixes become **Color collection modes**, not extra variables.

| Collection | Modes | Contents |
| --- | --- | --- |
| Spacing | Value | `--spacing-*` scale |
| Typography | Value | `--text-size-*`, `--font-family-*`, `--font-weight-*`, line-heights |
| Shape | Value | `--border-radius-*`, `--border-size-*` |
| Brand | Value | Palette, semantic, chart, `font-*-family` / `font-*-weight` aliases, and tone. Tone is stored 0–100 in Figma (`1` CSS → `100`) so bound opacity matches; code syntax still uses `var(--tone-*)`. |
| Color | Light, Dark | Themed paints (`--card-neutral-background`, slide canvas, …). Palette refs stay aliases. If Light and Dark share an extra opacity (e.g. 20% border), that opacity is applied on the layer so the variable can keep the alias; if the two modes differ (e.g. 10% / 100%), the extra opacity is baked into that mode’s `a`. Nested `color-theme="light"` on a dark slide is an instance **mode override** on this collection. |

| Component | Value | Component token aliases (`--card-padding-md` → `spacing-4`, …) |

Skip layout enums, uppercase flags, and other non-bindable settings. `<stack>` is still auto-layout, never a Figma component.

### `sync-brand-variables.js`

Writes `scripts/figma/variables.json` from Gratia `brand-settings.json` plus the shared scales. Default brand is `brands/gratia`.

```bash
node scripts/figma/sync-brand-variables.js
node scripts/figma/sync-brand-variables.js brands/gratia
npm run figma:sync-variables
```

### `build-component.js`

Walks canonical HTML (`<stack>` and flex roots → auto-layout IR, never a Stack component) and writes `scripts/figma/components/<name>.json`. Supported: `card`, `badge`, `stamp`, `callout`, `analyst` (or `all`). Each is `Variant`-only except analyst, which also has `Size=lg|sm` (body padding + logo well). No Color theme axis — Light/Dark is a Color collection mode override. Fills, strokes, type, opacity, padding, gap, radius, and stroke weights bind to variables. Line-height and letter-spacing are applied as percent from those variables (Figma’s bound FLOAT line-height/tracking is pixels). Card/callout/analyst width `320` stays raw (no CSS token). Stamp mark/icon size is `defaultSize × scale` in px (Figma cannot bind the product). Badge/stamp/analyst icons come from `assets/icons/`. Analyst nests the Badge component for specialization and tags.

```bash
node scripts/figma/build-component.js card
node scripts/figma/build-component.js all
npm run figma:build-component -- analyst
```

### Apply in Figma

In the DeckTool file: **Plugins → Development → Import plugin from manifest…** and choose [`scripts/figma/plugin/manifest.json`](../scripts/figma/plugin/manifest.json). Run **Sync brand variables**, then **Build card / badge / stamp / callout / analyst** (or **Sync variables and components**). Upserts by name; an existing set with that name is replaced. Analyst requires Badge.

---

## `compile-deck.js`

Stitches `decks/{slug}/*.html` into `decks/{slug}/index.html` using `viewer/deck.html`. Slide order is the numeric filename sort; `slides.json` keeps `title`, `brand`, and any other fields, and its `slides` array is rewritten from disk. Regenerates that brand's `brand.css` from `brand-settings.json`. Preset logos stay placeholders in the HTML; the viewer swaps `data-logo` to the brand pair.

```bash
node scripts/compile-deck.js decks/test
npm run compile-deck -- decks/test
npm run compile-deck:all
```

Open `decks/{slug}/index.html` from a static server (`npm run showcase`) so the `../../` stylesheets resolve.
