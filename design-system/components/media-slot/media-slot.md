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

`<media-slot padding="none|sm|md|lg" size="<spacing-step>" border="true|false" radius="none">`. Default padding is `md` (card padding). Stroke uses `--card-neutral-border-subtle` (flips with `color-theme`). `size` is a spacing-scale step and makes a square well. Omit `border` to keep the well stroke; `border="false"` and `radius="none"` for a flush photo. Placeholder copy uses `<text size="200" tone="subtle" context="slide">` so ink follows the canvas content subtle token (light/dark).

On `content-slide-text-and-image`, keep `<media-slot data-slot="image" width="fill" class="aspect-square">` until a photo is provided, then replace the element (keep `data-slot="image"`, `width="fill"`, and `class="aspect-square"`). Use `width="fill"` / `height="fill"` so the well shares width and, when needed, stretches to the row height. Nested stacks in a row do not auto-share width.

On `content-slide-split-media`, keep `<media-slot data-slot="image" width="hug" height="fill" style="width: 440px">` until artwork is provided, then replace with `<img data-slot="image" height="fill" style="width: 440px">`.

On `content-slide-service`, keep `<media-slot data-slot="partner" width="hug" padding="none" style="width: 160px; height: 64px">` for the case study logo until artwork is provided, then replace with `<img data-slot="partner" style="width: 160px; height: 64px">`. Analyst photo and logo wells follow the `analyst` rules.

On `content-slide-steps-media`, keep `<media-slot data-slot="image" width="fill" height="fill">` until a screenshot is provided, then replace with `<img data-slot="image" width="fill" height="fill">`. The well and the step column both use `width="fill"` so they share the row evenly.

On `gratia-fundraising`, keep `<media-slot data-slot="image" width="fill" height="fill" padding="none" border="false" style="filter: drop-shadow(0px 24px 32px rgba(0, 0, 0, 0.2)) drop-shadow(0px 20px 16px rgba(0, 0, 0, 0.5))">` until a screenshot is provided, then replace with `<img data-slot="image" width="fill" height="fill">` and keep the drop-shadow filter. `filter` is used so overflow clipping on the well does not cut the shadows. Both columns use `width="fill"`; the well stretches with `height="fill"`.

On `analyst`, keep `<media-slot data-slot="image" width="fill" padding="none" border="false" radius="none" class="aspect-square">` for the photo and `<media-slot data-slot="logo" size="10" padding="none">` for the featured mark until artwork exists (`size="7"` when `analyst` is `size="sm"`). Then replace each well with `<img>` (photo: `width="fill"` + `class="aspect-square"`).

On `media-card`, keep `<media-slot data-slot="image" width="fill" padding="none" border="false" radius="none">` until artwork exists, then replace with `<img data-slot="image" width="fill">`. The well is 240px tall.

Canonical markup: `design-system/components/media-slot/media-slot.html`.
