---
id: stack
kind: component
use_when:
  - Rows or columns of components with a spacing-scale gap
  - Split layouts (text-and-image title | media, split-media copy | media | copy, service copy | divider | analyst, steps | media, actions list | result cards, 12-cards / services stamp cards, contact headline | card)
  - Equal card grids (3-cards row, services catalog)
not_when:
  - Slide chrome (use header-container / content-container / footer-container)
  - One-off spacing that utilities already cover inside a preset you are copying
---

# Stack

`<stack direction="row|col" columns="3" gap="<spacing-step>" wrap="true" width="fill|hug" height="fill|hug">`. Gap is a spacing-scale step (`0`…`40`, `0-5`, …) from `design-system/tokens/spacing.css`. Default is `4` (16px). Use `gap="0"` for none. `wrap="true"` allows row children to wrap. Omit `width` / `height` to hug. `width` is horizontal only; `height` is vertical only.

## Card grids (3 columns)

Two markup patterns. Do not add a `pack` (or similar) attribute — the HTML structure is what maps to Figma.

**Hold column width** — leftover cards stay one column wide. One `<stack columns="3" gap="2" width="fill">` with the cards as direct children. Example: `gratia-services` (eleven cards). In Figma this is a 3-column grid; empty cells in the last row stay empty.

**Fill the row** — leftover cards grow to share the row. A column stack of row stacks; each row is `<stack direction="row" gap="2" width="fill">` with `<card width="fill">` children. Example: `content-slide-12-cards` (four rows of three). A row with only two fill cards stretches them to half width. In Figma this is auto-layout: a vertical frame of horizontal frames whose children Fill.

`content-slide-3-cards` is a single fill row (always full). Prefer copying the preset that already matches the leftover-row behavior over inventing a hybrid.

Row stacks hug children’s height (`align-items: flex-start`). Set `height="fill"` on a child to stretch it to the row, or `class="items-center"` on the row to vertically center children (text-and-image). Nested stacks do not auto-share width — set `width="fill"` on each child that should. Column stacks stretch children so text wraps; set `width="hug"` to opt out.

Canonical markup: `design-system/components/stack/stack.html`.
