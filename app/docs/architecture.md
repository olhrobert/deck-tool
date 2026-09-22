# Architecture

## This app cannot be deployed

It is a local tool. The UI is a front end for the repository working tree: it
reads and writes `brands/`, `decks/` and `presets/` on disk, and calls the
Node scripts in `scripts/` as child processes. There is no database and no API.

That means:

- **`process.cwd()` must be the `app/` directory**, which is what `pnpm dev`
  and `pnpm start` give you. The repo root is resolved once in
  `src/lib/repo.ts` and every path is built from it — nothing else should
  compute `..`.
- **Every mutation is a server action.** Nothing touching `fs` may be imported
  from a client component; the modules that do are marked `import "server-only"`.
- **Writes are not transactional.** A crash between writing `brand-settings.json`
  and regenerating `brand.css` leaves the two out of step. Git is the undo
  button — that is the whole recovery story, and it is adequate because there
  is one user on one machine.
- **Deploying this to a host would silently do nothing useful.** A serverless
  filesystem is ephemeral and read-only in practice, so writes would appear to
  succeed and vanish. If this ever needs to be hosted, the file layer behind
  `src/lib/brands.ts` / `src/lib/decks.ts` has to be swapped for a real store
  first, and the scripts in `scripts/` have to move with it.

## Layers

```
src/lib/repo.ts           repo root + path helpers, slug validation
src/lib/brand-scripts.ts  runs validate-brand / generate-brand-css as child processes
src/lib/brand-tokens.ts   flatten brand-settings.json, resolve refs, live contrast
src/lib/brands.ts         read/write brands, deck usage, archive, delete, logo.dev pull
src/lib/decks.ts          decks, presets list, reorder, add/remove slides, compile
src/lib/slide-preview.ts  compose viewer/deck.html around one slide for thumbs
src/lib/logo-dev.ts       logo.dev search + image fetch (keys from .env.local)
src/lib/svg-sprite.ts     SVG → <symbol> helper (optional logo.dev SVG path)
src/lib/color.ts          parse / convert / contrast (oklch edit space → writable literals)
src/app/(admin)/brands/actions.ts
src/app/(admin)/decks/actions.ts   mutation surfaces
src/app/repo/[...path]/route.ts    read-only GET of allowlisted repo trees
```

## Brand file

Source of truth is `brands/{slug}/brand-settings.json` (not a flat `brand.json`).
The editor walks every leaf. Palette refs (`brand.3`, `semantic.positive`) and
`{ "color", "opacity" }` paints stay as written. Colour literals may be edited
in oklch and are converted to `rgb` / `rgba` / `#rrggbb` on save. Live contrast
mirrors `scripts/validate-brand.js`; save re-runs that script on a temp copy
unless the user overrides.

Archive is `foundations.basic.archived`. Logos are a baked pair
(`{slug}-logo.svg` + inverted); see `docs/brands.md`.

## Decks

On-disk contract: `decks/{slug}/{nn}.html` + `slides.json`. Order is the
filenames. Adding a slide copies a preset and rewrites `../../../` asset paths
to `../../` when the source was a brand slide. Compile shells out to
`scripts/compile-deck.js`. See `docs/decks.md`.

## Secrets

`LOGO_DEV_SECRET_KEY` is read only inside `src/lib/logo-dev.ts`, which is
`server-only`. Search runs in a server action and returns names, domains and
image URLs — the secret never reaches the browser. The publishable key does
reach the browser, by design: it exists to sit in an `<img src>`.

## Tests

`pnpm test` runs Node's built-in runner over `src/**/*.test.mts` with
`--experimental-strip-types`. It suits pure modules like `color.ts` and
`svg-sprite.ts`; anything that touches the filesystem or the network is
exercised through the running app instead. `verify` runs it between typecheck
and build.

`scripts/` stays the single source of truth for validation and CSS generation;
the app never reimplements either. It runs them as **child processes**, not
imports. They are CommonJS files outside the app, and requiring them through a
computed path dies under Turbopack with "Cannot find module as expression is
too dynamic" — while a literal import would bundle a build-time copy, which
defeats the point. `runScript` spawns `process.execPath` and parses the
`error:` / `warning:` lines the CLIs already print.
