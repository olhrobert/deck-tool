---
id: content-slide-split-media
kind: content
intent: layout
use_when:
  - Two copy columns flanking a central image, screenshot, or diagram
  - A product or proof visual with matching labeled points on each side
not_when:
  - Three equal cards (use content-slide-3-cards)
  - Twelve-card grid starting point (use content-slide-12-cards)
  - Gratia founder story as-is (use gratia-about)
  - Gratia service catalog as-is (use gratia-services)
  - Title stack beside a square image (use content-slide-text-and-image)
  - Service offering with a case study and featured analyst (use content-slide-service)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Gratia contact closer as-is (use gratia-contact)
  - Title or chapter slides
color_theme: inherit
slots: [pre, main, label, item-title, item-text, image]
---

# Content slide — split media

Centered header, three columns (copy | media | copy), default `<slide-footer>`. The row uses `gap="10"`. Side columns fill leftover width; the center `<media-slot>` is 440px wide and `height="fill"`. Keep the flanking stacks, the center well, and the header / content / footer chrome.

## Placeholders

| Slot | Markup | Replace with |
| --- | --- | --- |
| Pre | `<slide-pretitle data-slot="pre">` (or badge, per brand default) | Short label. Omit if unused. |
| Title | `<slide-title data-slot="main" align inherited from group>` | Headline. Keep `align="center"` on the group. |
| Section label | `<badge variant="emphasis">` | Column heading. Keep emphasis. |
| Item title / text | `<text family="heading">` + `<text>` | Three labeled points per column. Keep the `<divider>` between them. |
| Image | `<media-slot data-slot="image" width="hug" height="fill" style="width: 440px">` | Keep the well until artwork exists. Then replace with `<img data-slot="image" height="fill" style="width: 440px">`. |

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Set `color-theme="dark"` only when the user asks.

## Do not

- Rebuild the center media as cards, badges, or product UI
- Drop the flanking columns or the center well
- Stretch the list items to the media height (`height="fill"` on the item or column stacks)
- Change `data-slot` names or footer structure
- Left- or right-align the header on this preset
