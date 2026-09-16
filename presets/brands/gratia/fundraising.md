---
id: gratia-fundraising
kind: title
intent: brand
brand: gratia
use_when:
  - Drop the Gratia fundraising opener into a Gratia deck as-is
  - “The platform that creates its own supply” with four stats and a product screenshot
not_when:
  - A title layout starting point (use title-slide-01…04)
  - Gratia founder story as-is (use gratia-about)
  - Gratia service catalog as-is (use gratia-services)
  - Gratia contact closer as-is (use gratia-contact)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Title stack beside a square image (use content-slide-text-and-image)
  - Three equal cards (use content-slide-3-cards)
  - Twelve-card grid starting point (use content-slide-12-cards)
  - Copy columns flanking a central image (use content-slide-split-media)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Project recap with an actions list and result cards (use content-slide-actions-results)
  - Riverton or other non-Gratia decks
color_theme: dark
slots: [logo, main, sub, stat-value, stat-label, image]
---

# Gratia — fundraising

Brand slide. Keep the wording. Dark opener. No `<header-container>` and no `<slide-footer>`. Do not recreate the Figma “Grace lines” decoration. Logo at the top of the left column, headline + supporting line vertically centered, four stats at the bottom. Product well on the right (`<media-slot>`). The row uses `gap="13"` and `class="items-center"`. Both columns are `width="fill"` so they shrink with the slide; the well keeps the Figma 704×567 ratio via `aspect-ratio`. Chrome is `<content-container class="flex p-20 pr-0">` so the well can meet the right edge.

Headline is `<slide-title size="lg" lineheight="sm">`. Supporting line is `size="350"` `lineheight="lg"`. Stats sit in a 72px row: vertical `<divider>` plus a `height="fill"` `class="justify-center"` stack so value and label sit mid-rule. Value is `family="stat"` `size="500"`, `color: var(--color-palette-brand-3)`; label is `size="250"` `lineheight="single"` `tone="subtle"`. Logo is 24px tall with `width="hug"`. The screenshot well is `padding="none"` `border="false"` with the Figma drop shadows as `filter: drop-shadow(0px 24px 32px rgba(0, 0, 0, 0.2)) drop-shadow(0px 20px 16px rgba(0, 0, 0, 0.5))`. Keep `<media-slot data-slot="image">` until artwork exists.

## Color theme

The slide sets `color-theme="dark"`. Do not add showcase light/dark variants.

## Do not

- Rewrite the headline, supporting line, or stats
- Invent a Grace-lines background
- Drop the screenshot drop shadows
- Put the title in `<header-container>` or use `<cover-title>`
- Add a `<slide-footer>`
- Change `data-slot` names
