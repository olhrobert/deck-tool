---
id: content-slide-text-and-image
kind: content
intent: layout
use_when:
  - Title stack beside a square image as a starting point
  - Pre-title, headline, and short description next to a photo well
not_when:
  - Copy columns flanking a central image (use content-slide-split-media)
  - Twelve-card grid starting point (use content-slide-12-cards)
  - Gratia founder story as-is (use gratia-about)
  - Gratia service catalog as-is (use gratia-services)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Project recap with an actions list and result cards (use content-slide-actions-results)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Gratia contact closer as-is (use gratia-contact)
  - Metrics, comparisons, or more than one visual
  - Multiple people, cards, or callouts
  - Chapter openers or title slides
color_theme: inherit
slots: [pre, main, sub, image, logo, notes, deck-title, chapter, page]
---

# Content slide — text and image

Two columns: title stack on the left, square image on the right. Pre-title, title, and description are one hug group, vertically centered with the photo. No `<header-container>` — the headline lives in the left column. Keep `<slide-footer>` inside `<footer-container>`.

## Placeholders

| Slot | Markup | Replace with |
| --- | --- | --- |
| Pre | `<slide-pretitle data-slot="pre">` (or badge, per brand default) | Short label. Omit if unused. |
| Title | `<slide-title data-slot="main">` | Headline. |
| Description | `<slide-subtitle data-slot="sub">` | One supporting sentence. Omit if unused. |
| Image | `<media-slot data-slot="image">` | Keep the well until a photo exists. Then replace `<media-slot>` with `<img data-slot="image" width="fill" class="aspect-square">` (object-fit cover, square column). |

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Set `color-theme="dark"` only when the user asks for a dark content slide.

## Do not

- Invent a different split, put the title in the header, or add cards/callouts
- Add body copy or name/role under the title stack (use `gratia-about` for a founder narrative)
- Swap in `<attribution-box>` (that is the Gratia prepared-by mark, not speaker credit)
- Change stylesheet links or footer slot structure
