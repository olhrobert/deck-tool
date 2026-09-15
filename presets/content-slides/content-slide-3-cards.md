---
id: content-slide-3-cards
kind: content
use_when:
  - Three parallel facts, metrics, or offerings
  - A simple comparison row that still fits on cards
not_when:
  - Copy columns flanking a central image (use content-slide-split-media)
  - Narrative plus a portrait (use content-slide-story)
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
