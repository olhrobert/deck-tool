---
id: slide-footer
kind: component
use_when:
  - Every content slide, inside `<footer-container>`
  - Title/chapter covers at the bottom of the cover layout (not in footer-container)
not_when:
  - Replacing the Gratia prepared-by mark (that is attribution-box)
---

# Slide footer

Nested type omits `context`; ink follows the slide canvas. Replace notes / deck-title / chapter / page copy; omit unused optional slots (notes, deck-title, chapter, logo). Keep `data-slot` and boolean `data-logo` on the footer logo.

On title/cover/chapter slides, omit the logo slot if the cover already has a lockup. Keep the same footer slots across every content slide in a deck.

Canonical markup: `design-system/components/slide-footer/slide-footer.html`.
