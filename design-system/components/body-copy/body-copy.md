---
id: body-copy
kind: component
use_when:
  - Paragraphs on the slide canvas or inside a card/callout
  - Speaker name/role on the story preset (`tone="strong"` / `tone="subtle"`)
not_when:
  - The slide headline (use slide-title)
  - A compact label (use badge) or cover title (use cover-title)
---

# Body copy

`<body-copy size="sm|md|lg" tone="strong|base|subtle" context="slide|surface">`. Default size is `md`; default tone is `subtle`. `context="surface"` on cards, callouts, badges. `context="slide"` on the canvas.

Canonical markup: `design-system/components/body-copy/body-copy-md.html`.
