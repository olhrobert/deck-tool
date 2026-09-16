---
id: content-slide-steps-media
kind: content
intent: layout
use_when:
  - A numbered sequence of steps next to a screenshot, product UI, or browser
  - A process or how-it-works beat with one proof visual
not_when:
  - Three equal cards (use content-slide-3-cards)
  - Twelve-card grid starting point (use content-slide-12-cards)
  - Gratia founder story as-is (use gratia-about)
  - Gratia service catalog as-is (use gratia-services)
  - Copy columns flanking a central image (use content-slide-split-media)
  - Title stack beside a square image (use content-slide-text-and-image)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Project recap with an actions list and result cards (use content-slide-actions-results)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Gratia contact closer as-is (use gratia-contact)
  - Title or chapter slides
color_theme: inherit
slots: [main, step-title, step-text, image]
---

# Content slide — steps + media

Title and four numbered steps on the left (copy column 480px), tall browser `<media-slot>` on the right. No `<header-container>` — the headline lives in the left column. Keep `<slide-footer>` inside `<footer-container>`. The row uses `gap="20"` and `class="items-center"` so the copy hugs and sits mid-height while the well is `width="fill"` `height="fill"` and meets the slide’s right edge (`pr-0` on `<content-container>`). Keep four stamp + title/text rows with a `<divider>` above, between, and below them. Stamps inherit the slide `color-theme`. Step rows use `class="items-center"` so each stamp sits in the middle of its title + description.

## Placeholders

| Slot | Markup | Replace with |
| --- | --- | --- |
| Title | `<slide-title data-slot="main" size="lg">` | Headline. Omit pretitle and subtitle unless the user asks. |
| Step title / text | `<text family="heading" data-slot="step-title">` + `<text data-slot="step-text">` | Four steps. Keep the numbered `<stamp>` and the `<divider>`s. |
| Image | `<media-slot data-slot="image" width="fill" height="fill">` | Keep the well until a screenshot exists. Then replace with `<img data-slot="image" width="fill" height="fill">`. |

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Set `color-theme="dark"` only when the user asks. Stamps inherit the slide theme.

## Do not

- Put the title in `<header-container>`
- Drop, add, or reorder the four steps
- Rebuild the right column as a card, browser chrome, or product UI
- Change `data-slot` names or footer structure
