---
id: slide-title
kind: component
use_when:
  - The slide’s headline stack (optional pre, title, optional subtitle)
  - Content-slide chrome in `<header-container>`, or a column headline (story preset)
not_when:
  - In-body section headings (use paragraph-title)
  - Cover titles on `<slide kind="cover">` (use `family="cover-title"` on `<text>`)
---

# Slide title

Use `<slide-title-group>` with `<slide-title data-slot="main" size="md" tone="strong" context="slide">`. Size `sm|md|lg` maps to brand `components.slide.title.size*`.

Optional pre slot from `components.slide.pretitle.default`: `text` → `<slide-pretitle data-slot="pre" tone="subtle" context="slide">`; `badge` → `<badge data-slot="pre" variant="neutral"><badge-text data-slot="label" tone="strong" context="surface">`. Override per slide only if the user asks. Optional `<slide-subtitle data-slot="sub">`. Omit unused optional slots.

Canonical markup: `design-system/components/slide-title/slide-title-group-md.html`.
