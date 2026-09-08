---
name: generate-deck
description: >-
  Generate or edit DeckTool HTML decks from presets in a specified brand.
  Copies presets, replaces copy only, sets slides.json.brand, compiles
  index.html. Use when creating slides, decks, pitch decks, or title slides
  in riverton, gratia, or another brand.
---

# Generate deck

Source of truth is HTML in `decks/{deck-name}/`. Do not design layouts from scratch.

## Steps

1. Confirm the brand exists (`brands/{slug}/brand-settings.json`). If not, run the `new-brand` skill first.
2. List real presets — only these files exist:

| Kind | Path |
|---|---|
| Title | `presets/deck-titles/deck-title-01.html` … `deck-title-05.html` |
| Content | `presets/content-slides/content-slide-3-cards.html` |
| Footer | `presets/content-footers/footer-01.html` |
| Card fragment | `design-system/components/card/card.html` |
| Callout fragment | `design-system/components/callout/callout.html` |
| Badge fragment | `design-system/components/badge/badge.html` |
| Slide footer fragment | `design-system/components/slide-footer/slide-footer.html` |

There is no `chapter-titles/` folder.

3. Create `decks/{deck-name}/` with `01.html`, `02.html`, … Copy a title preset into `01.html`. Copy `presets/content-slides/content-slide-3-cards.html` for content slides (or copy chrome + the same footer preset onto every content slide).
4. Replace placeholder copy only. Keep `../../design-system/` and `../../assets/` paths.
5. Copy `brands/{slug}/{slug}-logo.svg` and `{slug}-logo-inverted.svg` into the deck folder. On each `<img data-logo>`, set `src` to the deck-local file that matches the surface:
   - `cover` → inverted if `cover.canvas.background` is dark, else default
   - `slide` → same for `slide.canvas.background`
   - `slide-surface` → same for `slide.surface.background`
   - empty / boolean `data-logo` inside `<slide-footer>` → use the footer’s `context` (`slide` or `cover`) the same way

   Dark means relative luminance below 0.45. Do not change `<img data-slot="logo">` on **attribution-box** (always the Gratia mark). See `attribution-box` skill.
6. Write `slides.json`:

```json
{
  "title": "Deck title",
  "brand": "{slug}",
  "slides": ["01.html", "02.html"]
}
```

7. Compile and spot-check:

```bash
node scripts/compile-deck.js decks/{deck-name}
```

If composite component HTML changed (Slide Title, Card, Callout, Badge, Slide Footer, Attribution), refresh instances first:

```bash
node scripts/refresh-components.js decks/{deck-name}
node scripts/compile-deck.js decks/{deck-name}
```

Open `decks/{deck-name}/index.html`.

8. If the user also wants Figma, continue with `push-to-figma`.

## Constraints

- Do not change component structure, classes, or stylesheet links
- Keep `data-slot` attributes on composite components
- Use `<card padding="md" gap="sm">` with `<card-pretitle>` (`color="subtle" context="surface"`), card-title, optional `<body-copy>`, and optional card-meta. Omit `layout` so the brand `components.card.layout` default applies.
- Use `<callout variant="default" padding="md" gap="sm">` with `<callout-title>` (`color="strong" context="surface"`) and `<callout-description>` (`color="base" context="surface"`). Variants are `default|positive|warning|negative|informative` only — no emphasis.
- Use `<badge variant="default" emphasis="false">` with `<badge-text>` (`color="strong" context="surface"`). Variants match card, including `emphasis="true|false"`.
- On `<slide class="bg-cover">`, set type `context="cover"` (and `color="strong|base|subtle"`). Do not use `.color-cover-foreground-*` on type. Leave attribution slot text as `context="surface"`.
- Use `<slide-footer context="slide">` inside `<footer-container>` on every content slide (same slots across the deck). Nested type omits `context`; ink follows the footer. Replace notes / deck-title / chapter / page copy; omit unused optional slots (notes, deck-title, chapter, logo). Keep `data-slot` and boolean `data-logo` on the footer logo.
- On title/cover slides, you may place `<slide-footer context="cover">` at the bottom of the cover layout (not inside `<footer-container>`). Omit the logo slot if the cover already has a lockup.
- Slide order is filename sort (`01.html` before `02.html`)
