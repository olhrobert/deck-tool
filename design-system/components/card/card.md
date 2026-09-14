---
id: card
kind: component
use_when:
  - A labeled fact, metric, or short offering in a grid or row
  - Parallel items that should scan as equal blocks
not_when:
  - A note, warning, or aside (use callout)
  - A tiny label (use badge) or a numeric/icon mark (use stamp)
  - Long narrative (use body-copy on the slide)
---

# Card

Use `<card padding="md">` with `<card-pretitle>` (`tone="subtle" context="surface"`), `<card-title>`, optional `<body-copy data-slot="text">`, and optional `<card-meta>`. Omit `gap` so `sm` applies. Omit `layout` so `components.card.defaultLayout` applies.

Variants: `neutral|emphasis|positive|warning|negative|informative`. Paint follows inherited `color-theme`. For a light card on a dark slide set `color-theme="light"`.

Keep `data-slot` attributes. Canonical markup: `design-system/components/card/card.html`.
