# DeckTool

Generate branded presentation decks from prompts, then push them into Figma for further tweaking.

HTML is the source of truth. A shared design system plus brand token overrides produce the slides. Figma instances that same library — it is not a second design system.

## Aim

1. Create presentation decks for various brands through prompts.
2. Push generated slides into Figma so a designer can keep editing them there.

The pieces that make that work:

| Block | Role |
| --- | --- |
| Brand tokens | `brands/{slug}/brand.json` overrides color, type, radius, and stroke. `brand.css` is generated. |
| Component set | Custom HTML elements in `design-system/components/` (Slide, Card, Slide Title, Alert, …). |
| Slide presets | Copy-ready HTML in `presets/` (title slides, content footers, Quick Fact Card). |
| Showcase | [`design-system/showcase/showcase.html`](design-system/showcase/showcase.html) — work on components and slide layouts in the browser, with a brand switcher. |
| Agent skills | `.cursor/skills/` — `new-brand`, `generate-deck`, `push-to-figma`. |
| HTML → Figma | `scripts/html-to-ir.js` parses a compiled deck; the push skill instances `figma/library.json` components in the target file. |

## Prompt workflow

Ask the agent; it loads the matching skill from [`AGENTS.md`](AGENTS.md).

- **New brand** — scaffold `brands/{slug}/`, edit tokens, validate contrast, add a Figma Primitives mode and logo.
- **New or edited deck** — copy presets into `decks/{deck-name}/`, replace copy, set `slides.json.brand`, compile.
- **Push to Figma** — compile, emit IR, instance the library on a deck page in the brand’s Primitives mode.

## Project structure

```
assets/           fonts, icons, logos
brands/           brand.json + generated brand.css + {slug}-logo.svg
design-system/    tokens, components, utilities, showcase/
viewer/           presentation template, viewer JS/CSS
presets/          copy-ready slide HTML
decks/            one folder per deck
figma/            library.json (Figma component/variable cache)
scripts/          compile, brand, and HTML→IR tooling (Node)
docs/             workflow documentation
.cursor/skills/   agent skills: new-brand, generate-deck, push-to-figma
```

## Quick start (manual)

1. Copy presets from `presets/` into `decks/{deck-name}/`
2. Set `"brand"` in `slides.json` (e.g. `"riverton"`)
3. Edit slide content (text only — keep paths and structure)
4. Compile: `npm run compile -- decks/{deck-name}`
5. Present: open `decks/{deck-name}/index.html` in a browser

New brand: `npm run new-brand -- acme --name "Acme Capital"` then [docs/brands.md](docs/brands.md).

Push to Figma: `npm run html-to-ir -- decks/{deck-name}` then `.cursor/skills/push-to-figma/`.

Phases and working order: [docs/overview.md](docs/overview.md). Also [docs/scripts.md](docs/scripts.md), [docs/figma.md](docs/figma.md), [docs/html-to-figma.md](docs/html-to-figma.md), and [AGENTS.md](AGENTS.md).
