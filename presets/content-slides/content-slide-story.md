---
id: content-slide-story
kind: content
use_when:
  - Founder, customer, or team narrative next to a portrait
  - One speaker with a name and role under short story copy
  - A photo-led “who we are / why this exists” beat
not_when:
  - Copy columns flanking a central image (use content-slide-split-media)
  - Metrics, comparisons, or more than one visual
  - Multiple people, cards, or callouts
  - Chapter openers or title slides
color_theme: inherit
slots: [main, image]
---

# Content slide — story

Two columns: story copy on the left, square image on the right. Title, paragraph, and name/role are one hug group, vertically centered with the photo. No `<header-container>` — the headline lives in the left column. Keep `<slide-footer>` inside `<footer-container>`. Do not add a signature or handwritten mark.

## Placeholders

| Slot | Markup | Replace with |
| --- | --- | --- |
| Title | `<slide-title data-slot="main">` | Headline only. Omit pretitle and subtitle unless the user asks. |
| Body | `<text>` | One short paragraph. Not bullets or stats. |
| Name | first attribution `<text tone="strong">` | Person’s name. No signature graphic. |
| Role | second attribution `<text tone="subtle">` | Title or affiliation. |
| Image | `<media-slot data-slot="image">` | Keep the well until a photo exists. Then replace `<media-slot>` with `<img data-slot="image" width="fill" class="aspect-square">` (object-fit cover, square column). |

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Set `color-theme="dark"` only when the user asks for a dark content slide.

## Do not

- Invent a different split, put the title in the header, or add cards/callouts
- Swap in `<attribution-box>` (that is the Gratia prepared-by mark, not speaker credit)
- Change stylesheet links or footer slot structure
