---
id: content-slide-12-cards
kind: content
intent: layout
use_when:
  - Twelve equal cards in a 3×4 grid as a starting point
  - Centered header, stamp + title + three-line list on each card
not_when:
  - Three equal cards only (use content-slide-3-cards)
  - Gratia founder story as-is (use gratia-about)
  - Gratia service catalog as-is (use gratia-services)
  - Copy columns flanking a central image (use content-slide-split-media)
  - Title stack beside a square image (use content-slide-text-and-image)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Gratia contact closer as-is (use gratia-contact)
  - Title or chapter slides
color_theme: inherit
slots: [main, mark, title, item, logo, notes, deck-title, chapter, page]
---

# Content slide — 12 cards

Layout preset (placeholder copy). Centered header (`<slide-title-group align="center">`, title only) + four rows of three `<card padding="md" width="fill">` + `<slide-footer>`. Outer column and each row are `<stack direction="row|col" gap="2" width="fill">` (fill-the-row pattern in `stack.md`). A row with fewer than three fill cards stretches them. For leftover cards that must stay one column wide, use `<stack columns="3">` instead (`gratia-services`). Each card is a stamp + title row (`gap="2"` `class="items-center"`) and three body lines (`gap="0"`). Stamps are `variant="emphasis"` `size="7"` with `<stamp-icon>`. Titles are `<text family="heading" size="450" context="surface">`. Body lines are `size="300"` `lineheight="lg"` `context="surface"`.

For the Gratia offerings catalog, use `gratia-services` instead of rewriting this copy.

## Placeholders

| Slot | Markup | Replace with |
| --- | --- | --- |
| Title | `<slide-title data-slot="main" size="md">` | Headline. Omit pretitle and subtitle unless the user asks. |
| Mark | `<stamp-icon data-slot="mark">` | Remix icon name already in `assets/icons/`. |
| Card title | `<text data-slot="title">` | Card heading. |
| Item | `<text data-slot="item">` | Three supporting lines per card. Keep three lines. |

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Set `color-theme="dark"` only when the user asks. Stamps and cards inherit the slide theme.

## Do not

- Collapse the grid to three cards (use content-slide-3-cards)
- Drop or add cards without choosing leftover-row behavior (twelve fill-rows stretch a short row; `columns="3"` holds column width)
- Put the title in the content column
- Change `data-slot` names or footer structure
