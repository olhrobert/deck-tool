---
id: gratia-contact
kind: close
intent: brand
brand: gratia
use_when:
  - Drop the Gratia closer into a Gratia deck as-is
  - “Let’s work together” / get-in-touch with hello@gogratia.com
not_when:
  - A layout starting point (do not clone this copy into a new closer)
  - Three equal cards (use content-slide-3-cards)
  - Twelve-card grid starting point (use content-slide-12-cards)
  - Copy columns flanking a central image (use content-slide-split-media)
  - Gratia founder story as-is (use gratia-about)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Title stack beside a square image (use content-slide-text-and-image)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Title or chapter slides
  - Riverton or other non-Gratia decks
color_theme: dark
slots: [logo, main, sub, label, email]
---

# Gratia — contact

Brand slide. Keep the wording. Dark closer. No `<header-container>` and no `<slide-footer>`. Logo, headline, and supporting line sit in the left column; a `<card padding="xl" width="fill">` holds the contact label and email. The row uses `gap="20"` and `class="items-center"` so both blocks sit mid-height and each column is `width="fill"` (equal halves of the leftover width). Left column `gap="12"`. Logo is `width="hug"` so it left-aligns with the title (a stretched `<img>` in a column would otherwise center the SVG). Headline is `<text family="title" size="2000" lineheight="single">` (80px), not `<slide-title>`. Column copy uses `class="w-full"` so the title and email fill the half-width. Card copy uses `context="surface"`. Ignore Figma box shadows. Do not set `height="hug"` on the card — that pins `align-self: flex-start` and defeats vertical centering.

## Color theme

The slide sets `color-theme="dark"`. Do not add showcase light/dark variants.

## Do not

- Rewrite the headline, supporting line, or email
- Put the title in `<header-container>` or use `<cover-title>`
- Recreate the Figma drop shadows
- Stretch the card vertically (`height="fill"` or `height="hug"`)
- Pin the card to a pixel width
- Add a `<slide-footer>`
- Change `data-slot` names
