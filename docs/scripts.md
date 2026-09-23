# Scripts

Root scripts use only Node built-ins — no `npm install` at the repo root. The local admin under `app/` is a separate Next.js package (`pnpm install` inside `app/`).

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

Skip layout enums, uppercase flags, and other non-bindable settings.

### HTML ↔ Figma primitives

`<stack>` and `<text>` are **HTML-only**. Do not publish them as Figma components — the variant space is wrong (stack: direction × gap × columns × wrap × fill/hug; text: size × tone × family × line-height × letter-spacing), and Figma already has native equivalents.

| HTML | In Figma (author / push) | Pulling a design → HTML |
| --- | --- | --- |
| `<stack>` | Auto-layout frame (gap → nearest `--spacing-*`, direction / wrap / fill / hug on the frame; `justify-between` / trailing `mt-auto` → Gap Auto + Space between, not `itemSpacing: 0`) | Free auto-layout frames → `<stack>` (grids → `columns="3"`; nested fill rows → nested `direction="row"` stacks). Do not invent a Stack component. |
| `<text>` and free canvas type | Text object with family / size / weight / line-height / letter-spacing bound to Typography (and related) variables | Text objects → `<text>` (map px to the type scale; infer `context` from parent surface vs slide). Prefer semantic tags when the role is clear (`<slide-title>`, `<cover-title>`, `<card-title>`, …). Do not invent a Text component. |

Push already follows this: `build-component.js` walks `<stack>` / flex roots into an auto-layout IR and emits text nodes, never Stack or Text components (`scripts/figma/lib/html.js`). Semantic type inside Card / Badge / Stamp / Callout / Analyst stays nested text (or a real component like Badge), not a free Text set.

When pulling, auto-layout **inside** a known component instance stays that component — only free frames become `<stack>`. Figma → preset: [`.cursor/skills/figma-to-preset/SKILL.md`](../.cursor/skills/figma-to-preset/SKILL.md). Preset → Figma: [`.cursor/skills/preset-to-figma/SKILL.md`](../.cursor/skills/preset-to-figma/SKILL.md).

### `sync-brand-variables.js`

Writes `scripts/figma/variables.json` from Gratia `brand-settings.json` plus the shared scales. Default brand is `brands/gratia`.

```bash
node scripts/figma/sync-brand-variables.js
node scripts/figma/sync-brand-variables.js brands/gratia
npm run figma:sync-variables
```

### `build-component.js`

Walks canonical HTML (`<stack>` / flex roots → auto-layout frames; type tags → text objects — never Stack or Text components) and writes `scripts/figma/components/<name>.json`. Supported: `card`, `badge`, `stamp`, `callout`, `analyst` (or `all`). Most are `Variant`-only. Analyst is **Size-only** (`lg` \| `sm`) — no paint `variant` axis; fill follows card neutral. No Color theme axis — Light/Dark is a Color collection mode override. Fills, strokes, type, opacity, padding, gap, radius, and stroke weights bind to variables. Line-height and letter-spacing are applied as percent from those variables (Figma’s bound FLOAT line-height/tracking is pixels). Card/callout/analyst width `320` stays raw (no CSS token). Stamp mark/icon size is `defaultSize × scale` in px (Figma cannot bind the product). Badge/stamp/analyst icons come from `assets/icons/`. `createNodeFromSvg` wraps glyphs in a frame — keep that frame unfilled (`fills = []`); bind paint only to VECTOR / BOOLEAN_OPERATION (and similar glyph nodes), never the icon frame. Analyst nests Badge (specialization/tags) and Media-slot (photo flush, logo Size=10/7).

On the Components page, every component sits at **x=0** in a column with **200px** between them. Multi-variant sets are horizontal auto-layout groups with **40px padding**, **40px gap**, and `color-slide-background` fill — same as Card.

```bash
node scripts/figma/build-component.js card
node scripts/figma/build-component.js all
npm run figma:build-component -- analyst
```

### Template pages

Each slide template is a **page named after its HTML preset id**, with one component of the same name. Groups are separated by a page divider (`---`) and an empty uppercase section header:

| Section header (empty) | Slide pages | HTML |
| --- | --- | --- |
| TITLE SLIDES | `title-slide-01` … `title-slide-04` | `presets/title-slides/` |
| CHAPTER SLIDES | `chapter-slide-01`, `chapter-slide-02` | `presets/chapter-slides/` |
| CONTENT SLIDES | `content-slide-3-cards`, `content-slide-12-cards`, … | `presets/content-slides/` |
| GRATIA SLIDES | `gratia-about`, `gratia-contact`, `gratia-fundraising`, `gratia-services` | `presets/brands/gratia/` |

Publish each as a component (or component set only if a real axis exists). Default IR brand is Gratia (same as `build-component.js`). Layout presets keep placeholder copy; brand slides keep HTML copy. Page order: **Components**, then for each section a divider + empty header + that section’s slide pages. Apply removes leftover empty group pages (`Title slides`, `Templates`, …).

**Pretitle:** Figma uses `components.slideTitle.pretitle.default` for the build brand. `badge` → Slide-pretitle `Type=badge`; `text` → `Type=label`. Gratia is badge; Riverton is label. Preset HTML may still use `<slide-pretitle>`; the push resolves the variant unless the markup is an explicit `<badge data-slot="pre">`.

**Brand-logo:** `Brand=Gratia|Riverton` × `Theme=light|dark`. Light is `{slug}-logo.svg`; dark is `{slug}-logo-inverted.svg` (white lockup). Template IR uses `Theme=dark` when the resolved slide theme is dark (explicit `color-theme`, or `foundations.colorTheme.cover` on `<slide kind="cover">`) or the `<img data-logo>` src is inverted. Color collection Dark does not invert baked logo fills — pick the Theme variant.

### `build-template.js`

Walks every preset `<slide>` that has HTML into IR at `scripts/figma/templates/<id>.json`, then regenerates the plugin. `<stack>` / layout `<div>` → auto-layout frames; known tags → Components-page instances (`Card`, `Slide-title`, `Slide-footer`, `Cover-title`, `Stamp`, `Badge`, `Divider`, `Media-slot`, `Analyst`, `Attribution-box`, `Brand-logo`, …). Cards whose children are not the catalog slots become tokenized frames (`cardFrame`), because Figma instances cannot gain extra children. Never emits Stack or Text components. `<cover-title width="fill|hug">` / `height` map through `horizontalSize` / `verticalSize` (omit to hug). A `<slide kind="cover">` with no `color-theme` takes `foundations.colorTheme.cover` as the template Color mode, the same default CSS uses. On a dark canvas, `<attribution-box>` gets an explicit light Color mode so the prepared-by chip does not inherit the cover. Agent workflow: [`.cursor/skills/preset-to-figma/SKILL.md`](../.cursor/skills/preset-to-figma/SKILL.md). A new slide from a Figma frame still uses [`.cursor/skills/figma-to-preset/SKILL.md`](../.cursor/skills/figma-to-preset/SKILL.md).

```bash
node scripts/figma/build-template.js all
node scripts/figma/build-template.js content-slide-3-cards
npm run figma:build-template -- all
```

### Apply in Figma

In the DeckTool file: **Plugins → Development → Import plugin from manifest…** and choose [`scripts/figma/plugin/manifest.json`](../scripts/figma/plugin/manifest.json). Run **Sync brand variables**, then **Build card / badge / stamp / callout / analyst** (or **Sync variables and components**). Upserts by name; an existing set with that name is replaced. Analyst requires Badge and Media-slot. Rebuilds keep the Components column at x=0 with 200px gaps.

**Templates:** **Build all templates**, or **Build template →** section → one preset (e.g. `title-slide-01`). Upserts by name onto per-slide pages under TITLE / CHAPTER / CONTENT / GRATIA SLIDES (divider + empty header + one page per preset). The per-slide submenu is regenerated with the plugin whenever `generate-plugin.js` / `build-template.js` runs. Requires the Components-page mains already built. **Sync variables and components** does **not** rebuild templates.

**Agents:** regenerate IR with `build-template.js`, then stop and ask the user to run the plugin. Do **not** rebuild a template by shipping the builder through `use_figma` unless the user explicitly overrides after a cost warning — that path is token-expensive. Small inspect / one-property `use_figma` calls are fine. See [`.cursor/rules/figma-build-via-plugin.mdc`](../.cursor/rules/figma-build-via-plugin.mdc) and [`.cursor/skills/preset-to-figma/SKILL.md`](../.cursor/skills/preset-to-figma/SKILL.md).

### Pull a template back

Explicit only. Nothing here runs from **Build all templates**. An agent captures the live template component, diffs it against the IR, then edits the preset HTML and [build-template.js](../scripts/figma/build-template.js) so the next build emits that IR. Do not hand-edit `scripts/figma/templates/<id>.json`.

```bash
node scripts/figma/diff-template.js chapter-slide-02 scripts/figma/pull/out/chapter-slide-02.snapshot.json
npm run figma:diff-template -- chapter-slide-02 scripts/figma/pull/out/chapter-slide-02.snapshot.json
```

`--copy` also lists text `characters` differences. Snapshots under `scripts/figma/pull/out/` are gitignored. The walk lives in [scripts/figma/pull/snapshot-walk.js](../scripts/figma/pull/snapshot-walk.js) and runs in Figma (`use_figma`); the plugin cannot write the repo. Components-page mains are out of scope. Agent steps: [`.cursor/skills/figma-pull/SKILL.md`](../.cursor/skills/figma-pull/SKILL.md).

---

## `compile-deck.js`

Stitches `decks/{slug}/*.html` into `decks/{slug}/index.html` using `viewer/deck.html`. Slide order is the numeric filename sort; `slides.json` keeps `title`, `brand`, and any other fields, and its `slides` array is rewritten from disk. Regenerates that brand's `brand.css` from `brand-settings.json`. Preset logos stay placeholders in the HTML; the viewer swaps `data-logo` to the brand pair.

```bash
node scripts/compile-deck.js decks/test
npm run compile-deck -- decks/test
npm run compile-deck:all
```

Open `decks/{slug}/index.html` from a static server (`npm run showcase`) so the `../../` stylesheets resolve.
