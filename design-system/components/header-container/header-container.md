---
id: header-container
kind: component
use_when:
  - Content slides whose headline sits in the top chrome (3-cards, split-media, services, and similar)
not_when:
  - Text-and-image, service, and steps-media slides that put the title in the content column
  - Cover/title/chapter presets that use a custom cover layout
---

# Header container

Padding comes from `components.headerContainer`. `paddingBottom` is the gap before `<content-container>`. Put `<slide-title-group>` here on chrome layouts (3-cards, split-media, services). Text-and-image, service, and steps-media put the title in the content column instead. Clips overflow. Do not restyle the container. Canonical sample uses a fill `<media-slot>` as the placeholder child.

Canonical markup: `design-system/components/header-container/header-container.html`.
