---
id: divider
kind: component
use_when:
  - A hairline between stacked labels, copy blocks, or sections
  - Separating a column badge from the items below it
not_when:
  - A callout stripe or card stripe (those are component chrome)
  - Slide footer meta separators (those are built into slide-footer)
---

# Divider

Use `<divider></divider>` as a full-width hairline. Color is `components.divider.color.light|dark` (palette refs). Width is `components.divider.width` in pixels (Gratia and Riverton: `1`). Stroke follows inherited `color-theme`.

Do not restyle with utilities. Omit unused wrapping stacks.

Canonical markup: `design-system/components/divider/divider.html`.
