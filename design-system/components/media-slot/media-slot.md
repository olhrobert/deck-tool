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

`<media-slot padding="none|sm|md|lg" size="<spacing-step>" border="true|false" radius="none">`. Default padding is `md` (card padding). `size` is a spacing-scale step and makes a square well. Omit `border` to keep the well stroke; `border="false"` and `radius="none"` for a flush photo. Placeholder copy uses `<text size="200" tone="subtle" context="slide">` so ink follows the canvas content subtle token (light/dark).

On `content-slide-story`, keep `<media-slot data-slot="image" width="fill" class="aspect-square">` until a photo is provided, then replace the element (keep `data-slot="image"`, `width="fill"`, and `class="aspect-square"`). Use `width="fill"` / `height="fill"` so the well shares width and, when needed, stretches to the row height. Nested stacks in a row do not auto-share width.

On `content-slide-split-media`, keep `<media-slot data-slot="image" width="hug" height="fill" style="width: 440px">` until artwork is provided, then replace with `<img data-slot="image" height="fill" style="width: 440px">`.

On `analyst`, keep `<media-slot data-slot="image" width="fill" padding="none" border="false" radius="none" class="aspect-square">` for the photo and `<media-slot data-slot="logo" size="10" padding="none">` for the featured mark until artwork exists (`size="7"` when `analyst` is `size="sm"`). Then replace each well with `<img>` (photo: `width="fill"` + `class="aspect-square"`).

Canonical markup: `design-system/components/media-slot/media-slot.html`.
