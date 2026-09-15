# DeckTool

HTML/CSS design system for presentation slides, with brand token overrides and a browser showcase.

When working in this repo:

1. **New brand** — load `.cursor/skills/new-brand/SKILL.md`
2. **Attribution box** — load `.cursor/skills/attribution-box/SKILL.md` (brand-agnostic Gratia credit; do not tokenize appearance. `components.attributionBox.default` is the show/hide default only.)

HTML is the source of truth. Brands only override tokens (`brands/{slug}/brand-settings.json`). Preset and component `.md` sidecars (`use_when` / `not_when`) sit next to the HTML; read them before picking a layout or component.

The showcase (`design-system/showcase/showcase.html`) is the visual QA surface. It `fetch()`es live component fragments and presets.

See `docs/brands.md` (including where each color token lands on slides), `docs/components.md`, and `docs/scripts.md`.
