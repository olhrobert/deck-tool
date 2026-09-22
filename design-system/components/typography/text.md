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

HTML typography primitive only. In Figma this is a **text object** with type tokens bound (family, size, weight, line-height, letter-spacing) — never a Text component (too many axes). On pull, free text objects become `<text>` (or a semantic preset when the role is clear). See `docs/scripts.md` → HTML ↔ Figma primitives.

`<text size="<scale-step>" family="title|heading|stat|text|label" tone="strong|base|subtle" context="slide|surface">`. Default size is `400`; default tone is `base`; default style is `foundations.font.text`. Style roles bake brand family + weight only — size stays on `size`. `family="display"` / `family="base"` pick a named stack without a role weight. `context="surface"` on cards, callouts, badges. `context="slide"` on the canvas. Type boxes shrink in flex columns (`min-width: 0`) and break long tokens (`overflow-wrap: anywhere`) so copy fills the column instead of overflowing.

Canonical markup: `design-system/components/typography/text.html`.
