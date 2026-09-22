---
id: content-slide-service
kind: content
intent: layout
use_when:
  - A service or offering with a proof case study and a featured person
  - Title and subtitle in the content column, not the header chrome
  - A case study block with partner logo well, three copy columns, and a stats row
not_when:
  - Three equal cards only (use content-slide-3-cards)
  - Twelve-card grid starting point (use content-slide-12-cards)
  - Gratia founder story as-is (use gratia-about)
  - Gratia service catalog as-is (use gratia-services)
  - Copy columns flanking a central image (use content-slide-split-media)
  - Title stack beside a square image (use content-slide-text-and-image)
  - Numbered steps next to a screenshot (use content-slide-steps-media)
  - Gratia fundraising opener as-is (use gratia-fundraising)
  - Gratia contact closer as-is (use gratia-contact)
  - Title or chapter slides
color_theme: inherit
slots: [main, sub, service, pretitle, title, text, partner, column-label, column-item, stat-label, stat-value, sidebar-title, sidebar-text, image, logo]
---

# Content slide — service

`<slide>` is a column: a full-width content row, a horizontal `<divider>`, then `<footer-container>`. The row is main column | vertical `<divider orientation="vertical">` | featured analyst, and `flex-1` so it fills the space above the footer. The vertical rule runs from the top of the slide to the footer hairline. Flush chrome padding with `p-0` on `<content-container>`, then put Figma padding on the two column stacks (bottom 0 so they meet the footer rule):

- Main: `padding: var(--spacing-16) var(--spacing-10) 0 var(--spacing-20)` (64 / 40 / 0 / 80)
- Sidebar: `width: 328px; padding: var(--spacing-16) var(--spacing-10) 0 var(--spacing-10)` (64 / 40 / 0 / 40)

The row uses `gap="0"` so those paddings are the gutters around the rule. No `<header-container>` — the headline lives in the left column. `<slide-footer>` spans the full slide width.

The case study is a `gap="0"` column `<stack>` — not a `<card>`. The outer stack is a border-only frame (no surface fill): 1px stroke via `border-color-divider` (follows `color-theme`), card radius (`--border-radius-med` / 8px), `overflow-hidden` so the hairlines clip to the corners. Nested type uses `context="slide"` so ink follows the canvas. Header, three copy columns, and stats are separate rows. Horizontal `<divider>` sits between those rows as a sibling so the hairline spans the full block. Column copy uses `p-4 px-6` (16px vertical, 24px horizontal). Stats row uses `gap="12"`.

## Placeholders

| Slot | Markup | Replace with |
| --- | --- | --- |
| Title | `<slide-title data-slot="main">` | Offering headline. Keep subtitle on the group. |
| Subtitle | `<slide-subtitle data-slot="sub">` | One supporting sentence. Omit if unused. |
| Service | stamp + `<text data-slot="service">` | Three offering tags. Keep the emphasis check stamp. |
| Case study | `<text family="label" data-slot="pretitle">` / `title` / `text` | Label, title, and short outcome. Canvas ink (`context="slide"`). |
| Partner | `<media-slot data-slot="partner" width="hug" padding="none" style="width: 160px; height: 64px">` | Keep the well until a logo exists. Then replace with `<img data-slot="partner" style="width: 160px; height: 64px">`. |
| Columns | `<text family="heading" data-slot="column-label">` + `<text data-slot="column-item">` | Three equal columns, four points each. Keep the `<divider>` above the row. |
| Stats | `<text family="heading" data-slot="stat-label">` + `<text family="stat" data-slot="stat-value">` | Three equal metrics. Keep the `<divider>` above the row and `gap="12"`. |
| Sidebar | `<text data-slot="sidebar-title">` + `<text data-slot="sidebar-text">` | “Featured analyst” heading and short bio. |
| Analyst | canonical `<analyst color-theme="light">` | Photo, name, role, logo, location, tags. Keep light paint on dark slides. Keep media wells until artwork exists. |

## Color theme

Omit `color-theme` on `<slide>` for the brand light canvas. Set `color-theme="dark"` only when the user asks.

## Do not

- Wrap the case study in `<card>` (padding would inset the dividers)
- Drop the outer frame classes (`border border-color-divider rounded overflow-hidden`)
- Put the title in `<header-container>`
- Drop the three columns, the stats row, or the analyst sidebar
- Drop the vertical column divider, restore chrome padding on the content row, or nest the rule inside a padded stack
- Nest a case-study `<divider>` inside a padded stack
- Replace the partner or analyst wells with authored images
- Change `data-slot` names or footer structure
