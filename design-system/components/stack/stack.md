---
id: stack
kind: component
use_when:
  - Rows or columns of components with a spacing-scale gap
  - Split layouts (story copy | media, split-media copy | media | copy)
not_when:
  - Slide chrome (use header-container / content-container / footer-container)
  - One-off spacing that utilities already cover inside a preset you are copying
---

# Stack

`<stack direction="row|col" gap="<spacing-step>" wrap="true" width="fill|hug" height="fill|hug">`. Gap is a spacing-scale step (`0`…`40`, `0-5`, …) from `design-system/tokens/spacing.css`. Default is `4` (16px). Use `gap="0"` for none. `wrap="true"` allows row children to wrap. Omit `width` / `height` to hug. `width` is horizontal only; `height` is vertical only.

Row stacks hug children’s height (`align-items: flex-start`). Set `height="fill"` on a child to stretch it to the row, or `class="items-center"` on the row to vertically center children (story). Nested stacks do not auto-share width — set `width="fill"` on each child that should. Column stacks stretch children so text wraps; set `width="hug"` to opt out. Prefer copying a preset that already uses stack over inventing a new split.

Canonical markup: `design-system/components/stack/stack.html`.
