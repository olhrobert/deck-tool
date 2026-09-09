# Chapter slide presets

Copy one file into `decks/{deck-name}/` and replace placeholder text only. Do not change HTML structure, classes, or asset paths.

Chapter slides use the cover surface (`bg-cover`) with a cover-context `<slide-footer>` at the bottom (not inside `<footer-container>`).

## Presets

| File                    | Layout                                                      |
| ----------------------- | ----------------------------------------------------------- |
| `chapter-slide-01.html` | Title + body stacked mid-left; cover footer with brand logo |
| `chapter-slide-02.html` | Title top-left, body bottom-left; cover footer with brand logo |

## Placeholders to replace

- `Chapter title`
- Body copy under the title
- Footer notes / deck title / chapter / page

## Example prompt

> Create `decks/q3-review/02.html` from `presets/chapter-slides/chapter-slide-01.html`. Title: "Platform". Body: "Build once, ship everywhere."
