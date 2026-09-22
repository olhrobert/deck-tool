---
id: cover-title
kind: component
use_when:
  - The main title on `<slide kind="cover">` (title and chapter presets)
not_when:
  - Content-slide headlines (use slide-title)
---

# Cover title

Use `<cover-title size="md" tone="strong" context="slide">`. Size `sm|md|lg|xl` maps to brand `components.coverTitle.size*`. Default size is `md`; default tone is `strong`. `align="left|center|right"` sets text alignment; omit it for left. Do not use `<slide-title>` on covers. Do not use `class="text-center"` on this tag.

Canonical markup: `design-system/components/cover-title/cover-title.html`.
