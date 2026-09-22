# Content slide presets

Layout examples with placeholder copy. Do not change HTML structure, classes, or asset paths when editing.

Each content preset includes `<slide-footer>` inside `<footer-container>`. Canonical footer markup lives at `design-system/components/slide-footer/slide-footer.html`.

Brand-locked content (Gratia services catalog, and similar) lives under [brands/](../brands/README.md).

## Presets

| File                         | Sidecar | Layout                                                                            |
| ---------------------------- | ------- | --------------------------------------------------------------------------------- |
| `content-slide-3-cards.html` | `.md`   | Header + content + footer. Three identical cards in a row. Includes `<slide-footer>`. |
| `content-slide-12-cards.html` | `.md` | Centered header, twelve cards in four rows of three (stamp + title + three lines). Includes `<slide-footer>`. |
| `content-slide-split-media.html` | `.md` | Centered header, copy \| media \| copy, default `<slide-footer>`. |
| `content-slide-text-and-image.html` | `.md` | Pre-title + title + description left, photo well right. No header chrome. Includes `<slide-footer>`. |
| `content-slide-service.html` | `.md` | Title in the content column, case study stack (copy + stats), featured analyst sidebar. Includes `<slide-footer>`. |
| `content-slide-steps-media.html` | `.md` | Title + four numbered steps left, tall browser media well right. Includes `<slide-footer>`. |

## Placeholders

- Slide title pre / main / sub (3-cards), centered title (12-cards / split-media), pre + title + description beside image (text-and-image), title + subtitle in the content column (service), or title + numbered steps (steps-media)
- Card labels, values, and meta (3-cards); stamp + title + three-line list (12-cards); section labels + item title/text (split-media); case study copy + partner well + stats + analyst (service); step title/text + browser well (steps-media); or keep `<media-slot data-slot="image">` until a photo exists (text-and-image / split-media / service / steps-media)
- Footer notes, deck title, chapter, and slide number
