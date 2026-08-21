# Plan: brand management

First real surface on the shell. A brand is a token override — `brand.json` is
the source of truth, `brand.css` is generated, the logo is a `currentColor`
sprite. See `../../../docs/brands.md` for the model.

## Scope

| Screen | Route | Does |
| --- | --- | --- |
| List | `/brands` | All brands, colour swatch, decks using it, archived state, row actions |
| View | `/brands/[slug]` | Every token, logo, validation result, decks using it, Figma mode |
| Edit | `/brands/[slug]/edit` | Name, colours, fonts, radii, border sizes — writes `brand.json`, regenerates `brand.css` |
| Create | dialog on the list | Slug + name, runs `scripts/new-brand.js`, lands on edit |

## Decisions

**Archive is a field, not a move.** `"archived": true` in `brand.json`. One
source of truth, survives git, and `generate-brand-css.js` only reads the paths
in its `TOKEN_MAP` so an extra key is inert. Moving the directory would break
every `slides.json` that references the slug.

**Delete is guarded by deck usage.** `decks/*/slides.json` references brands by
slug. If any deck uses the brand, delete is refused and archive is offered
instead — that is what archive is for. An unused brand deletes its whole
directory.

**Validation is not reimplemented.** `scripts/validate-brand.js` exports
`validateBrand()` and `scripts/generate-brand-css.js` exports
`generateBrandCss()`. Both are required at runtime and their results surfaced.
The WCAG AA rules live in one place and stay there.

**Figma is read-only here.** `figma/library.json` names one Primitives mode per
brand. The view screen shows whether a brand has a mode and its id. Creating a
mode is the `push-to-figma` skill's job, not this UI's.

## Pulling logos from logo.dev

Search a company by name (or type a domain), preview the mark, and download it
into the brand directory. Keys go in `.env.local`; see `.env.example`. Both are
optional and the UI says what is missing rather than failing.

- `LOGO_DEV_PUBLISHABLE_KEY` (`pk_…`) builds `img.logo.dev` URLs and is meant to
  be public — preview URLs go to the browser.
- `LOGO_DEV_SECRET_KEY` (`sk_…`) is the name-to-domain search API, server-side
  only. Without it the picker still works, you just supply the domain.

**A pulled logo usually cannot become the deck sprite, and this is the whole
catch.** Decks render `<use href="#{slug}-logo">` against a `<symbol>` in an
SVG, in `currentColor` so the mark takes the slide's ink. logo.dev serves PNG,
JPG and WebP on every plan and **SVG only on Enterprise**. So:

- **SVG back** → rewritten into `<symbol id="{slug}-logo">` by
  `lib/svg-sprite.ts`, optionally with fills flattened to `currentColor`,
  written to `{slug}-logo.svg`, and `brand.logo` repointed at it.
- **Raster back** → saved as `{slug}-logo-source.png` and recorded under
  `logoSource` in `brand.json`. `brand.logo` is left alone. Repointing it at a
  PNG would break every deck using the brand and fail `validate-brand.js`,
  which looks for a `<symbol id>`.

The domain is stored on the brand either way, so the SVG can be pulled later
without searching again.

## Not in scope

- Editing the logo SVG. Upload replaces the file; drawing it is not this tool.
- Renaming a slug. It is the directory name and every deck's foreign key — a
  rename is a migration, and there are two decks. Do it in git.
- Deck and preset management. Separate surfaces, same pattern.

## Constraint

Local only. See [architecture.md](../architecture.md) — the app writes to the
repo working tree and cannot be hosted.
