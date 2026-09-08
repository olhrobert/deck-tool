# Content footer presets

Copy one file into each content slide in `decks/{deck-name}/` and replace placeholder text only. Do not change HTML structure, classes, or asset paths.

Use the same footer preset across every content slide in a deck.

## Presets

| File           | Layout                                      |
| -------------- | ------------------------------------------- |
| `footer-01.html` | `<slide-footer>` inside `<footer-container>`: logo left, optional notes center, deck title \| chapter \| page right |

## Placeholders to replace

- Notes (`Add notes or sources here.`) — omit the `<slide-footer-notes>` slot if unused
- Deck title, chapter — omit those slots if unused
- Page (`01`) — set per slide (`02`, `03`, …)
- Logo `<img data-slot="logo" data-logo>` — point at a deck-local logo; leave `data-logo` valueless so it follows `context="slide"` (see [presets/README.md](../README.md#logos))

On title/cover slides, copy the inner `<slide-footer context="cover">` (not `<footer-container>`) to the bottom of the cover layout.

## Example prompt

> Create `decks/q3-review/` with content slides using `footer-01`. Set slide numbers per file.
