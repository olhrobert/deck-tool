---
id: slide-title
kind: component
use_when:
  - The slide’s headline stack (optional pre, title, optional subtitle)
  - Content-slide chrome in `<header-container>`, or a column headline (text-and-image / service presets)
not_when:
  - In-body section headings (use text family="heading")
  - Cover titles on `<slide kind="cover">` (use cover-title)
---

# Slide title

Use `<slide-title-group>` with `<slide-title data-slot="main" size="md" tone="strong" context="slide">`. Size `sm|md|lg` maps to brand `components.slideTitle.title.size*`.

`align="left|center|right"` on `<slide-title-group>` (and on a standalone `<slide-title>`) sets the stack and text alignment. Default is `left` when omitted.

Optional pre slot from `components.slideTitle.pretitle.default`: `text` → `<slide-pretitle data-slot="pre" tone="subtle" context="slide">`; `badge` → `<badge data-slot="pre" variant="neutral"><badge-text data-slot="label" tone="strong" context="surface">`. In Figma the pre slot is the **Slide-pretitle** component (`Type=badge` \| `Type=label`). Override per slide only if the user asks. Optional `<slide-subtitle data-slot="sub">`. Omit unused optional slots.

Canonical markup: `design-system/components/slide-title/slide-title-group.html`. Centered stack: `align="center"` on `<slide-title-group>`.
