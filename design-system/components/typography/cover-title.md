---
id: cover-title
kind: component
use_when:
  - The main title on `<slide kind="cover">` (title and chapter presets)
not_when:
  - Content-slide headlines (use slide-title)
---

# Cover title

Use `<text family="cover-title" context="slide" tone="strong">`. Family and weight come from `components.cover.title`. Size is per preset (`2400` / `3000` / `4000` on titles, `1200` on chapters), not a brand token. The fragment uses `1600` as a Type-page specimen. Do not use `<slide-title>` on covers.

Canonical markup: `design-system/components/typography/cover-title.html`.
