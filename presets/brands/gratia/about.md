---
id: gratia-about
kind: content
intent: brand
brand: gratia
use_when:
  - Drop the Gratia founder story into a Gratia deck as-is
  - “The story of Gratia” with Jackie’s portrait and signature
not_when:
  - A text-and-image layout starting point (use content-slide-text-and-image)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Gratia service catalog as-is (use gratia-services)
  - Gratia contact closer as-is (use gratia-contact)
  - Three equal cards (use content-slide-3-cards)
  - Twelve-card grid starting point (use content-slide-12-cards)
  - Copy columns flanking a central image (use content-slide-split-media)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Title or chapter slides
  - Riverton or other non-Gratia decks
color_theme: inherit
slots: [main, text, signature, name, role, image]
---

# Gratia — about

Brand slide. Keep the wording, photo, and signature. Same split as `content-slide-text-and-image`: copy left, square portrait right, no `<header-container>`, no `<slide-footer>`. The row uses `gap="20"` and `class="items-center"`. Left column is title + two body paragraphs (`gap="2"`) then signature + name/role (`gap="6"` between those groups). Body and attribution use `lineheight="lg"`. Portrait is `<img data-slot="image" width="fill" class="aspect-square rounded overflow-hidden">` (`assets/images/jackie.jpg`). Signature is `assets/images/jackie-signature.png` at 21px tall with `width="hug"` so it keeps its ratio.

For a generic text-and-image starting point, use `content-slide-text-and-image`.

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Do not add showcase light/dark variants.

## Do not

- Rewrite the headline, body, name, or role
- Drop the signature or swap the portrait
- Put the title in `<header-container>`
- Add a `<slide-footer>`
- Add cards or callouts
- Change `data-slot` names
