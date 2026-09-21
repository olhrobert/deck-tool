---
id: gratia-services
kind: content
intent: brand
brand: gratia
use_when:
  - Drop the Gratia “What we help with” catalog into a Gratia deck as-is
  - Eleven offering cards in a 3-column grid with Gratia service copy
not_when:
  - A 12-card grid starting point (use content-slide-12-cards)
  - Three equal cards only (use content-slide-3-cards)
  - Copy columns flanking a central image (use content-slide-split-media)
  - Gratia founder story as-is (use gratia-about)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Title stack beside a square image (use content-slide-text-and-image)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Project recap with an actions list and result cards (use content-slide-actions-results)
  - Gratia contact closer as-is (use gratia-contact)
  - Title or chapter slides
  - Riverton or other non-Gratia decks
color_theme: inherit
slots: [main, mark, title, item, logo, notes, deck-title, chapter, page]
---

# Gratia — services

Brand slide. Keep the offering copy. Centered header (`<slide-title-group align="center">`, title only) + eleven `<card padding="md" width="fill">` in one `<stack columns="3" gap="2" width="fill">` + `<slide-footer>`. The grid keeps leftover cards at the same width as a full row. Each card is a stamp + title row (`gap="2"` `class="items-center"`) and three body lines (`gap="0"`). Stamps are `variant="emphasis"` `size="7"` with `<stamp-icon>`. Titles are `<text family="heading" size="450" context="surface">`. Body lines are `size="300"` `lineheight="lg"` `context="surface"`.

For a generic 12-card starting point, use `content-slide-12-cards`.

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Do not add showcase light/dark variants.

## Do not

- Rewrite the offering titles or lists
- Collapse the grid to three cards (use content-slide-3-cards)
- Recreate a Figma glow or green border on the AI card
- Stretch the last two cards across the row
- Put the title in the content column
- Change `data-slot` names or footer structure
