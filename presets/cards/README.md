# Card presets

Reusable card content patterns built on `<card>`. The canonical fragment lives with the component:

`design-system/components/card/card.html`

Copy that file into a slide and replace placeholder text only. Do not change element structure or classes.

Styles live in `design-system/components/card/presets/`.

## Structure

```
pretitle
title
text (optional)
meta (optional)
```

## Placeholders to replace

- `Label` — pre-title label (e.g. Sponsor, Budget); use `<card-pretitle color="subtle" context="surface">`
- `Value` — main headline (`<card-title>`)
- `Optional body text` — omit `<body-copy data-slot="text">` if not needed
- `Optional supporting detail` — omit `<card-meta>` if not needed

## Example prompt

> On slide 02, add a row of four cards for Sponsor, Program lead, Budget, and Timeline using `design-system/components/card/card.html`.
