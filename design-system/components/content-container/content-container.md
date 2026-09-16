---
id: content-container
kind: component
use_when:
  - The main body of every content slide
not_when:
  - Cover/title/chapter slides that lay out directly on `<slide kind="cover">`
---

# Content container

Padding comes from `components.contentContainer`. Holds cards, stacks, callouts, a card grid (3-cards, services), or a split (text-and-image, service, steps-media, actions-results). Do not restyle the container beyond fill utilities the preset already uses. `content-slide-service` sets `p-0` so the vertical column rule can run the full slide height; Figma padding lives on the main and sidebar stacks instead. `content-slide-steps-media` sets `pr-0` so the browser well meets the slide’s right edge. Clips overflow so fixed-size media and shadows cannot paint past the container.

Canonical markup: `design-system/components/content-container/content-container.html`.
