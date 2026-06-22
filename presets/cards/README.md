# Card presets

Reusable card content patterns built on `<card>`. Copy a fragment into a slide and replace placeholder text only. Do not change element structure or classes.

Styles live in `design-system/components/card/presets/`.

## Presets

| File                   | Use for                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `quick-fact-card.html` | Label + headline + optional meta (e.g. sponsor, budget, timeline facts) |

## Placeholders to replace

- `Label` — uppercase pre-title (e.g. Sponsor, Budget)
- `Value` — main headline
- `Optional supporting detail` — omit `<quick-fact-card-meta>` if not needed

## Example prompt

> On slide 02, add a row of four quick-fact cards for Sponsor, Program lead, Budget, and Timeline using `presets/cards/quick-fact-card.html`.
