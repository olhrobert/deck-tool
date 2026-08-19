# DeckTool

HTML/CSS presentation decks with a design system, slide presets, a browser viewer, and a Figma publish target.

When working in this repo:

1. **New brand** — load `.cursor/skills/new-brand/SKILL.md`
2. **New or edited deck** — load `.cursor/skills/generate-deck/SKILL.md`
3. **Push a deck to Figma** — load `.cursor/skills/push-to-figma/SKILL.md`

HTML is the source of truth. Brands only override tokens (`brands/{slug}/brand-settings.json`). Figma instances the library in `figma/library.json`; do not rebuild components per deck.

See `docs/brands.md` (including where each color token lands on slides), `docs/figma.md`, `docs/html-to-figma.md`, and `docs/scripts.md`.
