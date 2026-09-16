---
id: text
kind: component
use_when:
  - Paragraphs on the slide canvas or inside a card/callout
  - In-body headings (`family="heading"`)
  - Stats / metrics (`family="stat"`)
  - Pretitles / small labels (`family="label"`)
  - Speaker name/role on brand narrative slides (`tone="strong"` / `tone="subtle"`)
not_when:
  - The slide headline (use slide-title)
  - Cover titles (use cover-title)
  - A compact label (use badge)
---

# Text

`<text size="<scale-step>" family="title|heading|stat|text|label" tone="strong|base|subtle" context="slide|surface">`. Default size is `400`; default tone is `base`; default style is `foundations.font.text`. Style roles bake brand family + weight only — size stays on `size`. `family="display"` / `family="base"` pick a named stack without a role weight. `context="surface"` on cards, callouts, badges. `context="slide"` on the canvas. Type boxes shrink in flex columns (`min-width: 0`) and break long tokens (`overflow-wrap: anywhere`) so copy fills the column instead of overflowing.

Canonical markup: `design-system/components/typography/text.html`.
