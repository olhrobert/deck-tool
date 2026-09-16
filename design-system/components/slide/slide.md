---
id: slide
kind: component
use_when:
  - Every slide. One `<slide>` per HTML file in a deck
not_when:
  - Nesting slides
---

# Slide

Content slides omit `color-theme` (brand light canvas). Use `color-theme="dark"` only when the user asks. `<slide kind="cover">` uses `foundations.colorTheme.cover` when `color-theme` is omitted. The HTML attribute is `color-theme`, not CSS `color-scheme`.

Slides clip overflow (`overflow: hidden`) so media, shadows, and fixed-size wells cannot paint outside the 1280×800 canvas.

Canonical markup: `design-system/components/slide/slide.html`.
