---
id: footer-container
kind: component
use_when:
  - Wrapping `<slide-footer>` on every content slide
not_when:
  - Cover/title/chapter footers (place `<slide-footer>` on the cover, not in this wrapper)
---

# Footer container

Padding comes from `components.footerContainer`. Always wrap content-slide footers with this. Clips overflow. Do not restyle the container.

Canonical markup: `design-system/components/footer-container/footer-container.html`.
