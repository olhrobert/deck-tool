# DeckTool

HTML/CSS design system for presentation slides, with brand token overrides, a browser showcase, compiled decks, and a local admin.

HTML is the source of truth. Brands only override tokens.

## Pieces

| Block | Role |
| --- | --- |
| Brand tokens | `brands/{slug}/brand-settings.json` overrides color, type, semantic spacing, radius, and stroke. `brand.css` is generated. |
| Component set | Custom HTML elements in `design-system/components/` (Slide, Card, Slide Title, …). |
| Slide presets | Layout examples in `presets/` (title, chapter, content) and brand slides in `presets/brands/{slug}/`. Loaded live by the showcase. |
| Decks | `decks/{slug}/` — numbered slide HTML plus `slides.json`. Compile with `npm run compile-deck -- decks/{slug}`. |
| Admin | Local brand and deck UI in `app/` (`pnpm install && pnpm dev` there). Reads and writes the working tree. Not for deploy. |
| Showcase | [`design-system/showcase/showcase.html`](design-system/showcase/showcase.html) — work on components and slide layouts in the browser, with a brand switcher. |
| Agent skills | `.cursor/skills/` — `new-brand`, `attribution-box`, `figma-to-preset`, `preset-to-figma`. |

## Project structure

```
assets/           fonts, icons, logos
brands/           brand-settings.json + generated brand.css + logo pair
decks/            one folder per talk: 01.html…, slides.json, compiled index.html
design-system/    tokens, components, utilities, showcase/
presets/          slide layout examples (title, chapter, content) and brand slides
scripts/          brand CSS, validation, deck compile, icon CSS, Figma sync (Node)
viewer/           deck shell (prev/next) used by compile-deck.js
app/              local admin for brands and decks (Next.js, not deployable)
docs/             design-system documentation
.cursor/skills/   agent skills
```

## Quick start

**Showcase** (library QA):

```bash
npm run showcase
```

Open [http://localhost:8080/design-system/showcase/showcase.html](http://localhost:8080/design-system/showcase/showcase.html).

**Admin** (brands and decks):

```bash
cd app && pnpm install && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Or run `.conductor/run.sh` from the repo root.

**Compile a deck:**

```bash
npm run compile-deck -- decks/test
```

New brand: `npm run new-brand -- acme --name "Acme Capital"` then [docs/brands.md](docs/brands.md).

See [docs/overview.md](docs/overview.md), [docs/brands.md](docs/brands.md), [docs/decks.md](docs/decks.md), [docs/scripts.md](docs/scripts.md), and [AGENTS.md](AGENTS.md).
