# DeckTool overview

HTML/CSS design system for presentation slides. Brands override tokens. The showcase is the workbench for the library; decks are assembled talks; the admin edits brands and decks on disk.

## Aim

Build and QA a component set and slide layouts in the browser, under multiple brands. Assemble real decks from those layouts when needed.

## Pieces

| Piece | Where | Job |
| --- | --- | --- |
| Tokens | `design-system/tokens/` + `brands/{slug}/brand-settings.json` | Shared color roles, type scale, global spacing scale. Brands pick colors, families, weights, type-scale *steps*, semantic spacing *steps*, named radius/stroke steps, and `slide.canvas.maxWidth`. |
| Components | `design-system/components/` (canonical HTML + CSS) | Slide chrome, type, Card, Callout, Badge, Stamp, Attribution, … |
| Presets | `presets/` | Layouts with placeholder copy (`title-slides/`, `chapter-slides/`, `content-slides/`) and brand-locked slides (`brands/{slug}/`). Showcase loads the live files. Decks copy them into `decks/{slug}/`. |
| Decks | `decks/{slug}/` | A talk: `01.html`… plus `slides.json` (`title`, `brand`). `compile-deck.js` stitches them into `index.html`. |
| Admin | `app/` | Local Next.js UI for brands and decks. Not deployable. `pnpm install && pnpm dev` inside `app/`, or `.conductor/run.sh`. |
| Showcase | `design-system/showcase/` | Workbench: `showcase.html` loads CSS/JS, inlines component demos, `fetch()`es live presets, brand switcher |
| Skills | `.cursor/skills/` | Prompt workflows: new-brand, attribution-box, figma-to-preset, preset-to-figma |

Work **tokens → components/presets → showcase**. Assemble **decks** from presets when you need a talk. Do not reverse the library order.

The Gratia mark inside `<attribution-box>` is intentional (prepared-by), not a brand leak.

## How changes propagate

| What changed | Showcase / decks |
| --- | --- |
| Token value or `brand-settings.json` color | Automatic (CSS variables). Regenerate `brand.css` if you edited JSON (`npm run generate-brand -- brands/{slug}`). Compiled decks pick up the stylesheet on the next compile (or open). |
| Component CSS (padding, radius, type) | Automatic (same stylesheets) |
| Canonical component HTML | Showcase demos live in `showcase.js`; update the demo if markup changes |
| Preset HTML | Showcase: automatic (`fetch()` on reload). Decks: already-copied slides do not change until you re-add or edit the deck files. |
| New preset file | Showcase and admin add-slide list it if it contains a `<slide>`. No admin code change. |

Showcase always reflects the current state of the library. A deck is a snapshot of slides you chose to copy.

## Showcase

The showcase is the visual QA surface: brand switcher (Gratia / Riverton); Foundations (Brand), Components (type, chrome, and former layout primitives such as slide, stack, and media slot), and slide presets (Title / Chapter / Content layouts, plus a brand group such as Gratia) in the sidebar; full slide chrome (width fills up to `--slide-max-width`, height 800). Token roles are cover / slide / surface — not primary / secondary.

Serve the repo (`npm run showcase`) and open `design-system/showcase/showcase.html`.

## Decks and admin

See [decks.md](decks.md). Sample: `decks/test/` (Gratia). Admin: `cd app && pnpm install && pnpm dev` → [http://localhost:3000](http://localhost:3000).

## Components and presets

A component set and preset library that can express real decks, with new tokens only when a visual role is missing. Presets are layout examples; keep structure, classes, and stylesheet links when you edit them.

### Library

- Showcase inlines component samples in `showcase.js` and `fetch()`es live presets.
- Title presets (`title-slide-01`…`04`) include `<attribution-box>`; visibility follows `components.attributionBox.default` unless the slide sets `attribution="true|false"`.
- Chapter slides (`chapter-slide-01` mid stack, `chapter-slide-02` split).
- Content layouts: `content-slide-3-cards` (header, three-card row, slide-footer), `content-slide-12-cards` (centered header, twelve cards in four rows of three), `content-slide-split-media` (centered header, copy \| media \| copy), `content-slide-text-and-image` (title stack + photo well), `content-slide-service` (offering title, case study stack with stats, featured analyst), and `content-slide-steps-media` (numbered steps + browser well). Slide footer lives as a component (`design-system/components/slide-footer/`).
- Brand slides (`presets/brands/{slug}/`, `intent: brand`): drop-in as-is. Gratia: `gratia-fundraising` (dark opener, headline + four stats + screenshot well), `gratia-about` (founder story, Jackie portrait and signature), `gratia-services` (offerings catalog), `gratia-contact` (dark closer, logo + headline, contact card). The showcase Gratia group is visible only when the brand switcher is Gratia.
- Card, Media card, Analyst, Callout, Badge, Stamp, Divider, Slide footer canonical HTML lives under `design-system/components/`.
- Tokens: cover / slide / surface colors; named weights (`regular` / `medium` / `bold`); style roles on `foundations.font` (`title`, `heading`, `stat`, `text`, `label`); shared **type scale**. Components name a style role via `.font`. Brand `sizeSm` / `sizeMd` / `sizeLg` (and cover-title `sizeXl`) pick a scale step (e.g. `800`), not a pixel value. Canvas copy uses `<text size="<scale-step>">` (default `400`, tone `base`, style `text`). In-body titles use `family="heading"`; metrics use `family="stat"`; pretitles use `family="label"`. Cover titles use `<cover-title size="sm|md|lg|xl">` (default `md`, tone `strong`, `align` omitted = left). Semantic type tags (`<cover-title>`, `<slide-title>`, …) are presets of `<text>` (`tone`, `size`, `uppercase`, `context`).
- Cover ink uses `context="slide"` with `tone="strong|base|subtle"` on `<slide kind="cover">` (canvas follows `foundations.colorTheme.cover`). Logos are a baked pair (default + inverted) with `data-logo` luminance switching in the showcase and in compiled decks.

### Still open

- More content-slide presets (two-column copy, title + body + card variants) before inventing new chrome.
- New components only when a preset needs them. Candidates, not a backlog: list item, generic card body patterns, charts (tokens exist, no component). Every new piece gets canonical HTML next to its CSS, plus a showcase demo in `showcase.js`.
- Admin Presets and Settings nav items are locked placeholders until those screens exist.

## Docs

| Topic | Read |
| --- | --- |
| Tokens and color roles | [brands.md](brands.md) |
| Size / gap / padding / variant | [components.md](components.md) |
| Decks and compile | [decks.md](decks.md) |
| Brand / icon / Figma / compile scripts | [scripts.md](scripts.md) |
| Local admin | [app/docs/architecture.md](../app/docs/architecture.md) |
| Agent workflows | `.cursor/skills/new-brand/`, `.cursor/skills/attribution-box/`, `.cursor/skills/figma-to-preset/`, `.cursor/skills/preset-to-figma/` |
