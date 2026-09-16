---
id: content-slide-actions-results
kind: content
intent: layout
use_when:
  - A project recap with an actions list and result cards
  - Title beside two intro columns, then a divided list next to stacked cards
not_when:
  - Three equal cards (use content-slide-3-cards)
  - Twelve-card grid starting point (use content-slide-12-cards)
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
slots: [main, intro-title, intro-text, section-label, action-title, action-text, result-title, result-text]
---

# Content slide — actions + results

No `<header-container>` — the headline sits in the top row next to two intro columns. Keep `<slide-footer>` inside `<footer-container>`. Outer column uses `gap="10"`. Top row uses `gap="6"` and `class="items-center"` so the title (`w-1-3`) sits mid-height beside the intros. Intro columns share leftover width with `gap="4"` and a vertical `<divider>`. Bottom row uses `gap="6"`: a one-third actions list (`w-1-3`; five stamp + title/text rows with `p-4` and a `<divider>` above, between, and below) and a fill-width results column of four `<card padding="md">` rows (`gap="2"`). Stamps are `variant="emphasis"` `size="8"` with `<stamp-icon>`. Action/result rows use `class="items-center"`. Result copy uses `context="surface"`.

## Placeholders

| Slot | Markup | Replace with |
| --- | --- | --- |
| Title | `<slide-title data-slot="main" size="md">` | Headline. Omit pretitle and subtitle unless the user asks. |
| Intro | `<text family="heading" data-slot="intro-title">` + `<text data-slot="intro-text">` | Two short columns. Keep the vertical `<divider>`. |
| Section label | `<text family="heading" data-slot="section-label">` | Actions / Results headings. |
| Action title / text | `<text family="heading" data-slot="action-title">` + `<text data-slot="action-text">` | Five list rows. Keep the emphasis stamps, icons, and `<divider>`s. |
| Result title / text | `<text family="heading" data-slot="result-title">` + `<text data-slot="result-text">` | Four cards. Keep the stamp + title/text row inside each card. |

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Set `color-theme="dark"` only when the user asks. Stamps and cards inherit the slide theme.

## Do not

- Put the title in `<header-container>`
- Drop, add, or swap the five action rows or four result cards
- Rebuild the actions list as cards, or the results as a divider list
- Change `data-slot` names or footer structure
