---
id: text
kind: component
use_when:
  - Paragraphs on the slide canvas or inside a card/callout
  - In-body headings (`family="display"`)
  - Speaker name/role on the story preset (`tone="strong"` / `tone="subtle"`)
not_when:
  - The slide headline (use slide-title)
  - Cover titles (use cover-title)
  - A compact label (use badge)
---

# Text

`<text size="<scale-step>" family="display|base|body" tone="strong|base|subtle" context="slide|surface">`. Default size is `400`; default tone is `base`; default family follows `components.bodyCopy`. Use `family="display"` for in-body headings. `context="surface"` on cards, callouts, badges. `context="slide"` on the canvas.

Canonical markup: `design-system/components/typography/text.html`.
