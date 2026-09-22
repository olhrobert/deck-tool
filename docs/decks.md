# Decks

A deck is a real talk: an ordered set of filled-in slides for one brand. Presets and the showcase stay the library; decks are the assembled artifact.

```
decks/{slug}/
  slides.json     title, brand, slides[]
  01.html         one <slide> per file
  02.html
  …
  index.html      compiled — do not hand-edit
```

## Contract

| Field | Role |
| --- | --- |
| Directory name | Slug (`[a-z0-9][a-z0-9-]*`). Foreign key for brand usage. |
| `slides.json` | `title`, optional `brand`, optional `archived`, and `slides` (filename list). Compile rewrites `slides` from a numeric sort of the HTML files on disk. |
| `{nn}.html` | Standalone HTML with one `<slide>…</slide>`. Stylesheet links are `../../design-system/` and `../../assets/` (same depth as `presets/{kind}/`). |
| `index.html` | Output of `scripts/compile-deck.js`. |

Slide **order lives in the filenames**. Reordering means renumbering (`01.html`, `02.html`, …). A manifest-only order would be discarded on the next compile.

## Create

Copy a layout or brand preset into the deck folder (or use the admin Decks UI). Brand slides under `presets/brands/{slug}/` use `../../../` paths — rewrite those to `../../` when the file lands in `decks/{slug}/`. The admin does that rewrite automatically.

```bash
npm run compile-deck -- decks/test
npm run compile-deck:all
```

Open `decks/{slug}/index.html` from a static server (`npm run showcase`) so the `../../` links resolve.

## Brand and logos

`slides.json` `"brand"` must match a directory under `brands/` that has `brand-settings.json`. Compile regenerates that brand’s `brand.css` and injects it into `index.html`.

Presets keep placeholder logos in the HTML. The compiled viewer reads the brand pair from the deck root (`data-logo` / `data-logo-inverted` on `<deck>`) and swaps default vs inverted from the slide canvas luminance — same rule as the showcase. Attribution marks stay the Gratia credit.

## Admin

The local app under `app/` lists, creates, reorders, compiles, archives, and deletes decks. It shells out to `compile-deck.js`; it does not reimplement compile. Start with `pnpm install && pnpm dev` inside `app/`. See [app/docs/architecture.md](../app/docs/architecture.md).

## Sample

`decks/test/` is a Gratia sample (title, chapter, content presets) used to verify compile and the admin.
