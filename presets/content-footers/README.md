# Content footer presets

Copy one file into each content slide in `decks/{deck-name}/` and replace placeholder text only. Do not change HTML structure, classes, or asset paths.

Use the same footer preset across every content slide in a deck.

## Presets

| File           | Layout                                                                                  |
| -------------- | --------------------------------------------------------------------------------------- |
| `footer-01.html` | Logo left; attribution box right (disclaimer, prepared-by, slide number in one group) |
| `footer-02.html` | Logo left; attribution box centered; slide number right                                 |

## Placeholders to replace

- `Optional disclaimer. Can be one or two sentences long.` — omit the disclaimer `<text>` and its trailing separator if not needed
- Slide number (`01`) — set per slide (`02`, `03`, …)
- Logo `<img data-logo>` — point at a deck-local logo when provided (see [presets/README.md](../README.md#logos))

## Example prompt

> Create `decks/q3-review/` with content slides using `footer-02`. Disclaimer: "Figures are illustrative." Set slide numbers per file.
