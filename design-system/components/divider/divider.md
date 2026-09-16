---
id: divider
kind: component
use_when:
  - A hairline between stacked labels, copy blocks, or sections
  - Separating a column badge from the items below it
  - A full-height rule between columns (`orientation="vertical"`)
not_when:
  - A callout stripe or card stripe (those are component chrome)
  - Slide footer meta separators (those are built into slide-footer)
---

# Divider

Use `<divider></divider>` as a full-width hairline. Set `orientation="vertical"` in a row to get a full-height rule (`align-self: stretch`). Color is `components.divider.color.light|dark` (palette refs). Width is `components.divider.width` in pixels (Gratia and Riverton: `1`). Stroke follows inherited `color-theme`. Showcase chrome and `<attribution-box-separator>` use the same `--divider-color`.

Do not restyle with utilities. Omit unused wrapping stacks. On `content-slide-service`, the column rule is a sibling of the padded main and sidebar stacks (`gap="0"`) so it runs from the top of the slide to the footer.

Canonical markup: `design-system/components/divider/divider.html`.
