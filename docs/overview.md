# DeckTool overview

Generate branded presentation decks from prompts, then push them into Figma for further tweaking.

HTML is the source of truth. Brands override tokens. The Figma file instances the same component library — it is not a second design system.

## Aim

1. Create presentation decks for various brands through prompts.
2. Push generated slides into Figma so a designer can keep editing them there.

## Pieces

| Piece      | Where                                                | Job                                                              |
| ---------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| Tokens     | `design-system/tokens/` + `brands/{slug}/brand.json` | Shared scale; brands override color, type, radius, stroke        |
| Components | `design-system/components/`                          | Slide chrome, type, Card, Alert, Attribution, …                  |
| Presets    | `presets/`                                           | Copy-ready title slides, content slides, footers                 |
| Showcase   | `design-system/showcase/showcase.html`               | Workbench for tokens, components, and presets                    |
| Decks      | `decks/{name}/`                                      | Real slides; compiled `index.html` via `scripts/compile-deck.js` |
| Skills     | `.cursor/skills/`                                    | Prompt workflows: new-brand, generate-deck, push-to-figma        |
| Figma      | `figma/library.json` + MCP                           | Instance the library from HTML IR                                |

Work **tokens → showcase → components/presets → deck generation → Figma**. Do not reverse that order.

The Gratia mark inside `<attribution-box>` is intentional (prepared-by), not a brand leak.

## How changes propagate

| What changed | Showcase | Decks |
| --- | --- | --- |
| Token value or `brand.json` color | Automatic (CSS variables) | Automatic (CSS variables) |
| Component CSS (padding, radius, type) | Automatic (same stylesheets) | Automatic (same stylesheets) |
| Component HTML structure (wrappers, slots) | Automatic (`fetch()` loads live files on reload) | Run `npm run refresh -- decks/{name}` then `npm run compile -- decks/{name}` |
| Preset HTML | Automatic (`fetch()` loads live files on reload) | Only affects new decks that copy the preset; existing decks keep their snapshot |

Showcase always reflects the current state of the library. Decks contain a **copy** of component markup, so structural HTML changes require `refresh-components.js` to update instances in place while preserving slide copy and unique layout.

---

## Phase 1 — Tokens done; make the showcase the workbench

**Status:** Done. Open `design-system/showcase/showcase.html` to review.

**Goal:** After the token cleanup, `showcase.html` is the place to see every current component and preset under Gratia, Riverton, and the token fallback — so Phase 2 can be visual, not speculative.

Tokens are done. Do not reopen Figma mapping here.

### Fixes that matter

1. **Re-sync showcase slides with `presets/`.** Showcase inlines title and footer markup. It has already drifted (`deck-title-03` lost the two-tone title). Keep inlining so the brand stylesheet still applies; treat presets as source and copy into the showcase after preset edits.
2. **Show a full content slide.** Titles and stripped footers are not enough. Add one 1280×800 chrome slide (`slide-header` / `slide-content` / `slide-footer`) so padding, type, cards, and footer can be judged on the canvas.
3. **Make the Comps tab a catalog of what exists.** Group and label Alert, Attribution, Card / Quick Fact Card, Slide Title (lg/md/sm). Today it is unlabeled Alert + Attribution + a QFC row; Slide Title lives only under Type.
4. **Make the Type tab prove the new font roles.** Cover title, slide title, card title, paragraph title, body — with the sizes brands actually set. Drop `size="base"` / `family="heading"` examples; those are leftovers from the old token model (`text` has no `size="base"`).
5. **Brand switcher.** Apply on change (the Load button is extra). Include a Default option that uses `tokens/colors.css` with no `brand.css`. Gratia and Riverton are enough to list by hand.

When Phase 1 is done: switching brand restyles every showcase example, and nothing on the page still speaks the old token names.

---

## Phase 2 — Components and presets

**Goal:** A component set and preset library that can express real decks, with new tokens only when a visual role is missing.

### Fine-tune what exists

- Replace leftover inline `style="color: …"` on title presets (`deck-title-03`, `deck-title-04`) with role classes (`.color-cover-foreground-*`).
- Tokenize values still hardcoded on components (attribution copy is `12px` / `8px` instead of body size tokens).
- One body type API: `<text>` vs `<copy>`, numeric sizes vs `sm` / `base`. Pick one and use it in components, presets, and showcase.
- Exercise cover surface (`.bg-cover-surface`) if covers need a card-on-cover treatment.
- Drop or use `<stack>` — it is unused; layouts are utility flex.

### Fill the preset gap

Content slides start from `presets/content-slides/content-slide-01.html`. Add more body patterns (two-column copy, title + body + alert variants) as new files there before inventing new chrome.

### Add components only when a preset needs them

Candidates, not a backlog: list item (in-scope / out-of-scope), generic card body patterns, charts (tokens exist, no component). Add tokens only when the new piece cannot use cover / slide / surface / highlight / status.

Keep showcase in lockstep: every new component or preset gets a labeled example.

---

## Phase 3 — Deck generation

**Goal:** Prompts produce decks by copying presets and replacing copy — not by inventing layout.

Fine-tune `.cursor/skills/generate-deck/`, `presets/README.md`, and `compile-deck.js`. Point the skill at the Phase 2 content-slide presets. Sample decks become fixtures, not the template source.

Out of scope until then: rewriting skills around missing presets, cleaning sample-deck structure except as it blocks Phase 2 visuals.

---

## Phase 4 — Push to Figma

**Goal:** Compiled HTML instances the Figma library in the deck brand’s Primitives mode.

Expected work: realign Figma variables with the Phase 1 token roles (cover/slide, five font families), add missing library pieces (Alert, …), then fine-tune `html-to-ir.js` and `push-to-figma`. CSS/Figma defaultVariant mismatches stay a mapping concern, not a reason to change HTML in Phase 1–2.

---

## Docs by phase

| Phase | Read                                                                                        |
| ----- | ------------------------------------------------------------------------------------------- |
| 1–2   | [brands.md](brands.md), this file                                                           |
| 3     | [scripts.md](scripts.md), `.cursor/skills/generate-deck/`                                   |
| 4     | [figma.md](figma.md), [html-to-figma.md](html-to-figma.md), `.cursor/skills/push-to-figma/` |
