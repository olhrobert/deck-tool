---
id: media-slot
kind: component
use_when:
  - A reserved media region (photo, chart, diagram) before real artwork exists
  - Equal-width placeholders inside a stack
not_when:
  - Finished images (replace the well with `<img>` or a chart)
  - Text content that should not look like a placeholder well
  - Slide chrome labels (header / content / footer containers)
---

# Media slot

`<media-slot>` is a reserved media well: muted fill, surface border, card radius. Use `width="fill"` / `height="fill"` in a row stack so it shares the column with copy. Keep `data-slot` on the well (and on the `<img>` that replaces it) for composite child roles.

On `content-slide-story`, keep `<media-slot data-slot="image" width="fill" class="aspect-square">` until a photo is provided, then replace the element (keep `data-slot="image"`, `width="fill"`, and `class="aspect-square"`).

Canonical markup: `design-system/components/layout/media-slot.html`.
