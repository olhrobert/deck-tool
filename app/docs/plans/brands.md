# Plan: brand management

A brand is a token override. `brand-settings.json` is the file, `brand.css` is
generated, and the app does not keep a second copy of the tokens. Logos are a
baked pair (default + inverted). See `../../../docs/brands.md` for the model.

## Scope

| Screen | Route | Does |
| --- | --- | --- |
| List | `/brands` | All brands, palette swatches, decks using it, archived state, row actions |
| View | `/brands/[slug]` | Every token leaf, logo, validation result, decks using it |
| Edit | `/brands/[slug]/edit` | Every leaf in `brand-settings.json` — writes that file, regenerates `brand.css` |
| Create | dialog on the list | Slug + name, runs `scripts/new-brand.js`, lands on edit |

## Decisions

**Archive is a field, not a move.** `"archived": true` on `foundations.basic` in
`brand-settings.json`. The CSS generator ignores it: an extra key is inert.
Moving the directory would break every `slides.json` that references the slug.

**Delete is guarded by deck usage.** `decks/*/slides.json` references brands by
slug. If any deck uses the brand, delete is refused and archive is offered
instead — that is what archive is for. An unused brand deletes its whole
directory.

**Validation is not reimplemented.** The editor mirrors the WCAG pairs for a
live preview, then `scripts/validate-brand.js` runs as a child process on a
temp copy before save (unless the user overrides). CSS regeneration is always
`scripts/generate-brand-css.js`.

**The token table is the file.** `brand-tokens.ts` walks every leaf. New keys
that follow the existing shapes (literal colour, palette ref, paint object,
number, boolean, text) show up without a code change. New value kinds or new
contrast rules need an app update.

## Pulling logos from logo.dev

Search a company by name (or type a domain), preview the mark, and download it
into the brand directory. Keys go in `.env.local`; see `.env.example`. Both are
optional and the UI says what is missing rather than failing.

- `LOGO_DEV_PUBLISHABLE_KEY` (`pk_…`) builds `img.logo.dev` URLs and is meant to
  be public — preview URLs go to the browser.
- `LOGO_DEV_SECRET_KEY` (`sk_…`) is the name-to-domain search API, server-side
  only. Without it the picker still works, you just supply the domain.

**Slide logos are baked SVGs, not sprites.** Decks and the showcase use
`<img data-logo>` with `{slug}-logo.svg` / `{slug}-logo-inverted.svg`. logo.dev
serves PNG/JPG/WebP on every plan and SVG only on some plans. So:

- **SVG back** → written to `foundations.basic.logo` (optionally through the
  symbol helper if `currentColor` flattening is requested). Replace the
  inverted file by hand.
- **Raster back** → saved as `{slug}-logo-source.png` under
  `foundations.basic.logoSource`. The SVG lockup is left alone. Pointing
  `logo` at a PNG would break decks and fail `validate-brand.js`.

The domain is stored on the brand either way so an SVG can be pulled later
without searching again.

## Not in scope

- Editing the logo SVG by hand drawing. Upload replaces the file.
- Renaming a slug. It is the directory name and every deck's foreign key —
  rename in git.
- A dedicated Presets browser. Presets are chosen when creating or adding
  slides on a deck (sidebar Presets nav stays locked until that screen exists).

## Constraint

Local only. See [architecture.md](../architecture.md) — the app writes to the
repo working tree and cannot be hosted.
