---
id: stack
kind: component
use_when:
  - Rows or columns of components with brand gap tokens
  - Split layouts (story copy | media)
not_when:
  - Slide chrome (use header-container / content-container / footer-container)
  - One-off spacing that utilities already cover inside a preset you are copying
---

# Stack

`<stack direction="row|col" gap="none|sm|md|lg" width="fill|hug">`. Gap comes from `components.stack` (`none`, not `0`). Row children that are stacks share width; other children need `width="fill"` to share the row. Prefer copying a preset that already uses stack over inventing a new split.

Canonical markup: `design-system/components/layout/stack.html`.
