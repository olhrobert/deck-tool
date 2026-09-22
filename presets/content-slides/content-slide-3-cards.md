---
id: content-slide-3-cards
kind: content
intent: layout
use_when:
  - Three parallel facts, metrics, or offerings
  - A simple comparison row that still fits on cards
not_when:
  - Twelve-card grid starting point (use content-slide-12-cards)
  - Gratia founder story as-is (use gratia-about)
  - Gratia service catalog as-is (use gratia-services)
  - Copy columns flanking a central image (use content-slide-split-media)
  - Title stack beside a square image (use content-slide-text-and-image)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Gratia contact closer as-is (use gratia-contact)
  - One callout or a long body of copy
  - Title or chapter slides
color_theme: inherit
slots: [pretitle, title, subtitle, card-pretitle, card-title, card-meta]
---

# Content slide — 3 cards

Header + three-card row + `<slide-footer>`. Keep the three-card row and the header / content / footer chrome.

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Set `color-theme="dark"` only when the user asks. Nested `color-theme="light"` on a card restores light paint on a dark slide.

## Do not

- Add or remove cards, or replace cards with callouts
- Change `data-slot` names or footer structure
