# DeckTool

HTML/CSS design system for presentation slides, with brand token overrides and a browser showcase.

When working in this repo:

1. **New brand** — load `.cursor/skills/new-brand/SKILL.md`
2. **Attribution box** — load `.cursor/skills/attribution-box/SKILL.md` (brand-agnostic Gratia credit; do not tokenize appearance. `components.attributionBox.default` is the show/hide default only.)
3. **Figma → preset** — load `.cursor/skills/figma-to-preset/SKILL.md` (Figma slide URL → HTML preset; existing components only).

HTML is the source of truth. Brands only override tokens (`brands/{slug}/brand-settings.json`). Layout presets (`presets/{role}/`, `intent: layout`) have placeholder copy. Brand slides (`presets/brands/{slug}/`, `intent: brand`) are drop-in for that brand — do not rewrite their copy. A deck is `decks/{slug}/{nn}.html` plus `slides.json`; `scripts/compile-deck.js` builds `index.html`. The local admin in `app/` edits brands and decks on disk. Preset and component `.md` sidecars (`use_when` / `not_when`) sit next to the HTML; read them before picking a layout or slide.

The showcase (`design-system/showcase/showcase.html`) is the visual QA surface. Component samples are inlined in `showcase.js`; canonical HTML stays next to each component’s CSS. The showcase `fetch()`es live presets. Do not start the showcase server or inspect it in the browser; the user does that and will report issues.

See `docs/brands.md` (including where each color token lands on slides), `docs/components.md`, and `docs/scripts.md`.
