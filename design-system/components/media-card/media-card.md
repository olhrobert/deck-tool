---
id: media-card
kind: component
use_when:
  - A card with a photo or media header, title, description, and a footer strip
  - Offerings or case tiles that should scan as equal media-led blocks
not_when:
  - A labeled fact or metric with no media header (use card)
  - A person card (use analyst)
  - A note, warning, or aside (use callout)
---

# Media card

`<media-card>` composes a flush header `<media-slot data-slot="image" padding="none" border="false" radius="none">`, a `<stack data-slot="body">` of `<card-pretitle>`, `<card-title>`, and `<text data-slot="text" size="350" tone="base" context="surface">`, a `<divider>`, and a `<stack data-slot="footer">` with `<card-meta>`. Type matches `<card>`. Radius and paint follow card tokens (`--card-border-radius`, `--card-neutral-background` when `variant="neutral"`). Variants match card. Optional `color-theme="light|dark"`.

Keep `data-slot` attributes. Omit unused optional slots (`pretitle`, `footer` and its preceding `<divider>`). Replace the header well with `<img data-slot="image" width="fill">` when artwork exists (240px tall, object-fit cover).

Canonical markup: `design-system/components/media-card/media-card.html`.
