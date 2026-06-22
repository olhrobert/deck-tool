# Deck Tool

HTML/CSS presentation decks with a design system, slide presets, and a browser viewer.

## Project structure

```
assets/           fonts, icons, logos
design-system/    tokens, components, utilities
viewer/           presentation template, viewer JS/CSS
presets/          copy-ready slide HTML
decks/            your slide content (one folder per deck)
scripts/          compile tooling (Node)
docs/             script documentation
```

## Quick start

1. Copy presets from `presets/` into `decks/{deck-name}/`
2. Edit slide content (text only — keep paths and structure)
3. Compile: `npm run compile -- decks/{deck-name}`
4. Present: open `decks/{deck-name}/index.html` in a browser

See [docs/scripts.md](docs/scripts.md) for compile script details.
