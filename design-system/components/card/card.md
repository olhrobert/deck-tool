---
id: card
kind: component
use_when:
  - A labeled fact, metric, or short offering in a grid or row
  - Parallel items that should scan as equal blocks
not_when:
  - A person card (use analyst)
  - A photo or media header with title, description, and footer (use media-card)
  - A note, warning, or aside (use callout)
  - A tiny label (use badge) or a numeric/icon mark (use stamp)
  - Long narrative (use text on the slide)
---

# Card

Use `<card padding="md">` with `<card-pretitle>` (`tone="subtle" context="surface"`), `<card-title>`, optional `<text data-slot="text" size="350" tone="base" context="surface">`, and optional `<card-meta>`. Padding is `sm|md|lg|xl` (`xl` is `components.card.padding.xl`, spacing-12 on Gratia and Riverton). Omit `gap` so `sm` applies. Omit `layout` so `components.card.defaultLayout` applies. `<card-title size="sm|md|lg">` uses `components.card.title` sizes; for any other type-scale step use `<text family="heading" size="…">` (same brand family + weight, size from markup).

Variants: `neutral|emphasis|positive|warning|negative|informative`. Paint follows inherited `color-theme`. For a light card on a dark slide set `color-theme="light"`.

Keep `data-slot` attributes. Canonical markup: `design-system/components/card/card.html`.
