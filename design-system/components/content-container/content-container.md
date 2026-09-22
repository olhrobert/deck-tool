---
id: content-container
kind: component
use_when:
  - The main body of every content slide
not_when:
  - Cover/title/chapter slides that lay out directly on `<slide kind="cover">`
---

# Content container

Padding comes from `components.contentContainer`. `paddingTop` is 0 — the title-to-body gap lives on `headerContainer.paddingBottom`, so headerless slides (about, contact, text-and-image) can vertically center without a top offset. Holds cards, stacks, callouts, a card grid (3-cards, services), or a split (text-and-image, service, steps-media). Do not restyle the container beyond fill utilities the preset already uses. `content-slide-service` sets `p-0` so the vertical column rule can run the full slide height; Figma padding lives on the main and sidebar stacks instead. `content-slide-steps-media` sets `pt-20 pb-20` so the fill well keeps spacing-20 above and below. Clips overflow so fixed-size media and shadows cannot paint past the container. Canonical sample uses a fill `<media-slot>` as the placeholder child.

Canonical markup: `design-system/components/content-container/content-container.html`.
