# DeckTool overview

Generate branded presentation decks from prompts, then push them into Figma for further tweaking.

HTML is the source of truth. Brands override tokens. The Figma file instances the same component library — it is not a second design system.

## Aim

1. Create presentation decks for various brands through prompts.
2. Push generated slides into Figma so a designer can keep editing them there.

## Pieces

| Piece | Where | Job |
| --- | --- | --- |
| Tokens | `design-system/tokens/` + `brands/{slug}/brand-settings.json` | Shared color roles, type scale, global spacing scale. Brands pick colors, families, weights, type-scale *steps*, semantic spacing *steps*, named radius/stroke steps, and `slide.maxWidth` (pixels on the generic `borderRadius` / `borderSize` scales and the slide canvas cap). |
| Components | `design-system/components/` (HTML fragments + CSS + `registry.json`) | Slide chrome, type, Card, Alert, Attribution, … |
| Presets | `presets/` | Starting-point title slides, content slides, footers. A copied slide may diverge. |
| Showcase | `design-system/showcase/showcase.html` | Workbench: `fetch()` of live component and preset files, brand switcher |
| Decks | `decks/{name}/` | Real slides; compiled `index.html` via `scripts/compile-deck.js` |
| Refresh | `scripts/refresh-components.js` | Restamp registered component HTML in a deck; keep slot copy and unique layout |
| Skills | `.cursor/skills/` | Prompt workflows: new-brand, generate-deck, push-to-figma |
| Figma | `figma/library.json` + MCP | Instance the library from HTML IR |

Work **tokens → showcase → components/presets → deck generation → Figma**. Do not reverse that order.

The Gratia mark inside `<attribution-box>` is intentional (prepared-by), not a brand leak.

## How changes propagate

| What changed | Showcase | Decks |
| --- | --- | --- |
| Token value or `brand-settings.json` color | Automatic (CSS variables) | Automatic (CSS variables) |
| Component CSS (padding, radius, type) | Automatic (same stylesheets) | Automatic (same stylesheets) |
| Component HTML structure (wrappers, slots) | Automatic (`fetch()` loads live files on reload) | Run `npm run refresh -- decks/{name}` then `npm run compile -- decks/{name}` |
| Preset HTML | Automatic (`fetch()` loads live files on reload) | Only affects new decks that copy the preset; existing decks keep their snapshot |

Showcase always reflects the current state of the library. Decks contain a **copy** of component markup, so structural HTML changes require `refresh-components.js` to update instances in place while preserving slide copy and unique layout.

---

## Phase 1 — Tokens done; make the showcase the workbench

**Status:** Done.

The showcase is the visual QA surface: brand switcher (Gratia / Riverton), Slides / Comps / Type tabs, full slide chrome (width fills up to `--slide-max-width`, height 800). Token roles are cover / slide / surface — not primary / secondary.

---

## Phase 2 — Components and presets

**Status:** In progress — library and tokens are in good shape. Remaining work is more content-slide presets (and components only if a preset needs them).

**Goal:** A component set and preset library that can express real decks, with new tokens only when a visual role is missing. Presets are starting points; a real slide may diverge. Showcase always loads the live files.

### Done

- Showcase `fetch()`es live component fragments and presets (no inlined fork).
- `registry.json` + `refresh-components.js` restamp Alert, Slide Title, Quick Fact Card, and Attribution in a deck without wiping unique layout.
- Title presets (01–04), footers (01–02), one content slide (`content-slide-01`: header, fact row, section + body, alert, footer-01).
- Quick Fact Card lives with the component, not as a slide preset.
- Tokens: cover / slide / surface colors; named weights (`regular` / `medium` / `bold`) plus per-role families that pick those names; shared **type scale** (`--text-size-800` = 32px, …). Brand `sizeLg` / `sizeMd` / `sizeSm` pick a scale step (e.g. `800`), not a pixel value. Body/cover titles use the scale in HTML (`<text size="400">`). `<copy>` is gone.
- Cover ink uses role classes (`.color-cover-foreground-*`). Attribution type sizes use the type scale. Logos are a baked pair (default + inverted) with `data-logo` luminance switching in the showcase.


### Still open

- **More content-slide presets** — only `content-slide-01.html` exists. Add body patterns (two-column copy, title + body + alert variants) in `presets/content-slides/` before inventing new chrome.
- **Kept for later:** `.bg-cover-surface` and `<stack>` (plus unused utilities). Do not remove them; they are for upcoming presets.
- **New components only when a preset needs them** — candidates, not a backlog: list item, generic card body patterns, charts (tokens exist, no component). Every new piece gets a fragment the showcase can load.

---

## Phase 3 — Deck generation

**Goal:** Prompts produce decks by copying presets and replacing copy — not by inventing layout.

Fine-tune `.cursor/skills/generate-deck/`, `presets/README.md`, and `compile-deck.js`. Point the skill at the Phase 2 content-slide presets. Sample decks become fixtures; run `refresh` on them after component HTML changes.

Out of scope until then: rewriting skills around missing presets, cleaning sample-deck structure except as it blocks Phase 2 visuals.

---

## Phase 4 — Push to Figma

**Goal:** Compiled HTML instances the Figma library in the deck brand’s Primitives mode.

Expected work: realign Figma variables with the current token roles (cover/slide, five font families, weights), add missing library pieces (Alert, …), then fine-tune `html-to-ir.js` and `push-to-figma`. CSS/Figma defaultVariant mismatches stay a mapping concern, not a reason to change HTML in Phase 1–2.

---

## Docs by phase

| Phase | Read |
| --- | --- |
| 1–2 | [brands.md](brands.md), this file |
| 3 | [scripts.md](scripts.md), `.cursor/skills/generate-deck/` |
| 4 | [figma.md](figma.md), [html-to-figma.md](html-to-figma.md), `.cursor/skills/push-to-figma/` |
