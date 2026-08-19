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
| Title | `presets/deck-titles/deck-title-01.html` … `deck-title-04.html` |
| Content | `presets/content-slides/content-slide-01.html` |
| Footer | `presets/content-footers/footer-01.html`, `footer-02.html` |
| Card fragment | `design-system/components/card/quick-fact-card.html` |

There is no `chapter-titles/` folder.

3. Create `decks/{deck-name}/` with `01.html`, `02.html`, … Copy a title preset into `01.html`. Copy `presets/content-slides/content-slide-01.html` for content slides (or copy chrome + the same footer preset onto every content slide).
4. Replace placeholder copy only. Keep `../../design-system/` and `../../assets/` paths.
5. Copy `brands/{slug}/{slug}-logo.svg` and `{slug}-logo-inverted.svg` into the deck folder. On each `<img data-logo>`, set `src` to the deck-local file that matches the surface:
   - `cover` → inverted if `colors.cover.background` is dark, else default
   - `slide` → same for `colors.slide.background`
   - `slide-surface` → same for `colors.slide.surfaceBackground`

   Dark means relative luminance below 0.45. Do not change `<img data-slot="logo">` (attribution Gratia mark).
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

If composite component HTML changed (Alert, Slide Title, Quick Fact Card, Attribution), refresh instances first:

```bash
node scripts/refresh-components.js decks/{deck-name}
node scripts/compile-deck.js decks/{deck-name}
```

Open `decks/{deck-name}/index.html`.

8. If the user also wants Figma, continue with `push-to-figma`.

## Constraints

- Do not change component structure, classes, or stylesheet links
- Keep `data-slot` attributes on composite components
- Use `<card padding="md" gap="sm">` + QFC children for fact rows
- Use the same footer preset on every content slide
- Slide order is filename sort (`01.html` before `02.html`)
