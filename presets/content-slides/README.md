# Content slide presets

Copy one file into `decks/{deck-name}/` and replace placeholder text only. Do not change HTML structure, classes, or asset paths.

Use the same footer preset across every content slide in a deck.

## Presets

| File                    | Layout                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| `content-slide-3-cards.html` | Header + content + footer. Three identical cards in a row. Uses `<slide-footer>` via `footer-01`. |

## Placeholders to replace

- Slide title pre / main / sub
- Card labels, values, and meta (all three cards)
- Footer notes, deck title, chapter, and slide number

## Example prompt

> Create `decks/q3-review/`. Copy `presets/content-slides/content-slide-3-cards.html` to `02.html`. Title: "Project overview". Fill the three fact cards.
