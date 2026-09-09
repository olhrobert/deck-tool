# Title slide presets

Copy one file into `decks/{deck-name}/` and replace placeholder text only. Do not change HTML structure, classes, or asset paths.

Each layout has two files: without attribution (`title-slide-0N.html`) and with the Gratia attribution box (`title-slide-0N-with-attribution.html`).

## Presets

| File                                    | Layout                                                           |
| --------------------------------------- | ---------------------------------------------------------------- |
| `title-slide-01.html`                   | Title and subtitle left; optional metadata below; logo top-right |
| `title-slide-01-with-attribution.html`  | Same, plus attribution bottom-right                              |
| `title-slide-02.html`                   | Oversized title at bottom; logo top-left                         |
| `title-slide-02-with-attribution.html`  | Same, plus attribution top-right                                 |
| `title-slide-03.html`                   | Split column; title left, subtitle in the right column           |
| `title-slide-03-with-attribution.html`  | Same, plus attribution top-right                                 |
| `title-slide-04.html`                   | Centered title; logo top-center                                  |
| `title-slide-04-with-attribution.html`  | Same, plus attribution bottom-center                             |
| `title-slide-05.html`                   | Centered stack: logo, title, and subtitle                        |
| `title-slide-05-with-attribution.html`  | Same, plus attribution bottom-center                             |

## Placeholders to replace

- Title text inside `<text>` elements (or split across two `<text>` nodes in `title-slide-03`)
- `Optional subtitle. Can be one or two sentences long.`
- `Optional metadata. Can be several sentences long.` (`title-slide-01` only)
- Attribution credit text on `*-with-attribution` presets (leave the Gratia logo alone)

## Example prompt

> Create `decks/q3-review/`. Copy `presets/title-slides/title-slide-02-with-attribution.html` to `decks/q3-review/01.html`. Title: "Q3 Product Review". Subtitle: "Acme Corp · October 2025".
