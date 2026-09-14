---
id: stamp
kind: component
use_when:
  - A square step number, ranking, or icon mark
  - Pairing a mark with a card or short list item
not_when:
  - A text label (use badge)
  - A full content block (use card)
---

# Stamp

Use `<stamp variant="neutral">` with either `<stamp-text data-slot="mark">1</stamp-text>` or `<stamp-icon data-slot="mark" icon="{name}" aria-hidden="true"></stamp-icon>` — not both. Variants match card. Optional `color-theme`.

Omit `size` for `components.stamp.defaultSize`, or set `size` to a spacing-scale step (`"6"`, `"12"`, …). Do not set icon size, type size, or padding.

Canonical markup: `design-system/components/stamp/stamp.html`.
