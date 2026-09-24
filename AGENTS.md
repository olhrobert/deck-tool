# DeckTool

HTML/CSS design system for presentation slides, with brand token overrides and a browser showcase.

When working in this repo:

1. **New brand** — load `.cursor/skills/new-brand/SKILL.md`
2. **Create deck** — load `.cursor/skills/create-deck/SKILL.md` (ask for title, brand, and slide plan before writing; assemble from existing presets/components).
3. **Attribution box** — load `.cursor/skills/attribution-box/SKILL.md` (brand-agnostic Gratia credit; do not tokenize appearance. `components.attributionBox.default` is the show/hide default only.)
4. **Figma → preset** — load `.cursor/skills/figma-to-preset/SKILL.md` (Figma slide URL → HTML preset; existing components only).
5. **Preset → Figma** — load `.cursor/skills/preset-to-figma/SKILL.md` (HTML preset → per-slide pages under TITLE / CHAPTER / CONTENT / GRATIA SLIDES; existing Components-page mains only). Regenerate IR in the repo; the user applies it with the DeckTool Sync plugin. Do not rebuild templates via `use_figma` without warning first (see `.cursor/rules/figma-build-via-plugin.mdc`).
6. **Figma pull** — load `.cursor/skills/figma-pull/SKILL.md` (explicit only: Figma template tweaks → preset HTML and the mapper, then regenerate IR).

HTML is the source of truth. Brands only override tokens (`brands/{slug}/brand-settings.json`). Layout presets (`presets/{role}/`, `intent: layout`) have placeholder copy. Brand slides (`presets/brands/{slug}/`, `intent: brand`) are drop-in for that brand — do not rewrite their copy. A deck is `decks/{slug}/{nn}.html` plus `slides.json`; `scripts/compile-deck.js` builds `index.html`. The local admin in `app/` edits brands and decks on disk. Preset and component `.md` sidecars (`use_when` / `not_when`) sit next to the HTML; read them before picking a layout or slide.

The showcase (`design-system/showcase/showcase.html`) is the visual QA surface. Component samples are inlined in `showcase.js`; canonical HTML stays next to each component’s CSS. The showcase `fetch()`es live presets. Do not start the showcase server or inspect it in the browser; the user does that and will report issues.

**Admin vs design-system work.** New components, presets, and decks usually need no admin code change — the brand editor walks `brand-settings.json`, and the decks UI lists every preset HTML that contains a `<slide>`. Update the admin only when the on-disk contract changes (new value kinds, compile/path rules, or new contrast rules). See `app/docs/architecture.md`.

See `docs/brands.md` (including where each color token lands on slides), `docs/components.md`, `docs/decks.md`, and `docs/scripts.md`.
