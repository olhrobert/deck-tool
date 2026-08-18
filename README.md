# Deck Tool

HTML/CSS presentation decks with a design system, slide presets, a browser viewer, and a Figma publish target.

HTML is the source of truth. Brands override tokens. Figma instances the library — it is not a second design system.

## Project structure

```
assets/           fonts, icons, logos
brands/           brand.json + generated brand.css + logo.svg
design-system/    tokens, components, utilities
viewer/           presentation template, viewer JS/CSS
presets/          copy-ready slide HTML
decks/            one folder per deck
figma/            library.json (Figma component/variable cache)
scripts/          compile, brand, and HTML→IR tooling (Node)
docs/             workflow documentation
.cursor/skills/   agent skills: new-brand, generate-deck, push-to-figma
```

## Quick start

1. Copy presets from `presets/` into `decks/{deck-name}/`
2. Set `"brand"` in `slides.json` (e.g. `"riverton"`)
3. Edit slide content (text only — keep paths and structure)
4. Compile: `npm run compile -- decks/{deck-name}`
5. Present: open `decks/{deck-name}/index.html` in a browser

New brand: `npm run new-brand -- acme --name "Acme Capital"` then [docs/brands.md](docs/brands.md).

Push to Figma: `npm run html-to-ir -- decks/{deck-name}` then `.cursor/skills/push-to-figma/`.

See [docs/scripts.md](docs/scripts.md), [docs/figma.md](docs/figma.md), and [AGENTS.md](AGENTS.md).
