# DeckTool overview

HTML/CSS design system for presentation slides. Brands override tokens. The showcase is the workbench.

## Aim

Build and QA a component set and slide layouts in the browser, under multiple brands.

## Pieces

| Piece | Where | Job |
| --- | --- | --- |
| Tokens | `design-system/tokens/` + `brands/{slug}/brand-settings.json` | Shared color roles, type scale, global spacing scale. Brands pick colors, families, weights, type-scale *steps*, semantic spacing *steps*, named radius/stroke steps, and `slide.canvas.maxWidth`. |
| Components | `design-system/components/` (HTML fragments + CSS) | Slide chrome, type, Card, Callout, Badge, Stamp, Attribution, … |
| Presets | `presets/` | Title, chapter, and content slide layouts. Showcase loads the live files. |
| Showcase | `design-system/showcase/` | Workbench: `showcase.html` loads CSS/JS, `fetch()`es live fragments and presets, brand switcher |
| Skills | `.cursor/skills/` | Prompt workflows: new-brand, attribution-box |

Work **tokens → components/presets → showcase**. Do not reverse that order.

The Gratia mark inside `<attribution-box>` is intentional (prepared-by), not a brand leak.

## How changes propagate

| What changed | Showcase |
| --- | --- |
| Token value or `brand-settings.json` color | Automatic (CSS variables). Regenerate `brand.css` if you edited JSON (`npm run generate-brand -- brands/{slug}`). |
| Component CSS (padding, radius, type) | Automatic (same stylesheets) |
| Component or preset HTML | Automatic (`fetch()` loads live files on reload) |

Showcase always reflects the current state of the library.

## Showcase

The showcase is the visual QA surface: brand switcher (Gratia / Riverton); Foundations (Brand), Components (type, chrome, and former layout primitives such as slide, stack, and media slot), and Slide presets (Title / Chapter / Content) in the sidebar; full slide chrome (width fills up to `--slide-max-width`, height 800). Token roles are cover / slide / surface — not primary / secondary.

Serve the repo (`npm run showcase`) and open `design-system/showcase/showcase.html`.

## Components and presets

A component set and preset library that can express real decks, with new tokens only when a visual role is missing. Presets are layout examples; keep structure, classes, and stylesheet links when you edit them.

### Library

- Showcase `fetch()`es live component fragments and presets (no inlined fork).
- Title presets (`title-slide-01`…`04`) include `<attribution-box>`; visibility follows `components.attributionBox.default` unless the slide sets `attribution="true|false"`.
- Chapter slides (`chapter-slide-01` mid stack, `chapter-slide-02` split).
- Content slides: `content-slide-3-cards` (header, three-card row, slide-footer), `content-slide-split-media` (centered header, copy \| media \| copy), and `content-slide-story` (copy + photo well). Slide footer lives as a component (`design-system/components/slide-footer/`).
- Card, Analyst, Callout, Badge, Stamp, Divider, Slide footer fragments live under `design-system/components/`.
- Tokens: cover / slide / surface colors; named weights (`regular` / `medium` / `bold`) plus per-role families that pick those names; shared **type scale**. Brand `sizeSm` / `sizeMd` / `sizeLg` (and cover-title `sizeXl`) pick a scale step (e.g. `800`), not a pixel value. Canvas copy uses `<text size="<scale-step>">` (default `400`, tone `base`). In-body headings add `family="display"`. Cover titles use `<cover-title size="sm|md|lg|xl">` (default `md`, tone `strong`). Semantic type tags (`<cover-title>`, `<slide-title>`, …) are presets of `<text>` (`tone`, `size`, `uppercase`, `context`).
- Cover ink uses `context="slide"` with `tone="strong|base|subtle"` on `<slide kind="cover">` (canvas follows `foundations.colorTheme.cover`). Logos are a baked pair (default + inverted) with `data-logo` luminance switching in the showcase.

### Still open

- More content-slide presets (two-column copy, title + body + card variants) before inventing new chrome.
- New components only when a preset needs them. Candidates, not a backlog: list item, generic card body patterns, charts (tokens exist, no component). Every new piece gets a fragment the showcase can load.

## Docs

| Topic | Read |
| --- | --- |
| Tokens and color roles | [brands.md](brands.md) |
| Size / gap / padding / variant | [components.md](components.md) |
| Brand / icon scripts | [scripts.md](scripts.md) |
| Agent workflows | `.cursor/skills/new-brand/`, `.cursor/skills/attribution-box/` |
