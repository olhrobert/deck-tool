# Content footer presets

Copy one file into each content slide in `decks/{deck-name}/` and replace placeholder text only. Do not change HTML structure, classes, or asset paths.

Use the same footer preset across every content slide in a deck.

## Presets

| File           | Layout                                      |
| -------------- | ------------------------------------------- |
| `footer-01.html` | Logo left; slide number right               |

## Placeholders to replace

- Slide number (`01`) — set per slide (`02`, `03`, …)
- Logo `<img data-logo>` — point at a deck-local logo when provided (see [presets/README.md](../README.md#logos))

## Example prompt

> Create `decks/q3-review/` with content slides using `footer-01`. Set slide numbers per file.
