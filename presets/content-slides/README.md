# Content slide presets

Copy one file into `decks/{deck-name}/` and replace placeholder text only. Do not change HTML structure, classes, or asset paths.

Each content preset includes `<slide-footer>` inside `<footer-container>`. Keep the same footer slots across every content slide in a deck. Canonical footer markup lives at `design-system/components/slide-footer/slide-footer.html`.

## Presets

| File                         | Layout                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `content-slide-3-cards.html` | Header + content + footer. Three identical cards in a row. Includes `<slide-footer>`. |

## Placeholders to replace

- Slide title pre / main / sub
- Card labels, values, and meta (all three cards)
- Footer notes, deck title, chapter, and slide number

## Example prompt

> Create `decks/q3-review/`. Copy `presets/content-slides/content-slide-3-cards.html` to `02.html`. Title: "Project overview". Fill the three fact cards.
