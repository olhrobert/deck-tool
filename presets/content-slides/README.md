# Content slide presets

Layout examples loaded by the showcase. Do not change HTML structure, classes, or asset paths when editing.

Each content preset includes `<slide-footer>` inside `<footer-container>`. Canonical footer markup lives at `design-system/components/slide-footer/slide-footer.html`.

## Presets

| File                         | Sidecar | Layout                                                                            |
| ---------------------------- | ------- | --------------------------------------------------------------------------------- |
| `content-slide-3-cards.html` | `.md`   | Header + content + footer. Three identical cards in a row. Includes `<slide-footer>`. |
| `content-slide-story.html`   | `.md`   | Copy left, photo well right. No header chrome. Includes `<slide-footer>`.         |

## Placeholders

- Slide title pre / main / sub (3-cards) or headline + body + name/role (story)
- Card labels, values, and meta (3-cards) or keep `<media-slot data-slot="image">` until a photo exists (story)
- Footer notes, deck title, chapter, and slide number
