# Deck title presets

Copy one file into `decks/{deck-name}/` and replace placeholder text only. Do not change HTML structure, classes, or asset paths.

## Presets

| File                 | Layout                                                           |
| -------------------- | ---------------------------------------------------------------- |
| `deck-title-01.html` | Title and subtitle left; optional metadata below; logo top-right |
| `deck-title-02.html` | Oversized title at bottom; logos in top corners                  |
| `deck-title-03.html` | Split column; two-tone title; subtitle in right column           |
| `deck-title-04.html` | Centered title; logo top-center; badge bottom-center             |

## Placeholders to replace

- Title text inside `<text>` elements (or split across two `<text>` nodes in `deck-title-03`)
- `Optional subtitle. Can be one or two sentences long.`
- `Optional metadata. Can be several sentences long.` (`deck-title-01` only)

## Example prompt

> Create `decks/q3-review/`. Copy `presets/deck-titles/deck-title-02.html` to `decks/q3-review/deck-title.html`. Title: "Q3 Product Review". Subtitle: "Acme Corp · October 2025".
