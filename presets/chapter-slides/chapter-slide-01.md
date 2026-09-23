---
id: chapter-slide-01
kind: chapter
use_when:
  - Opening a section with title and body stacked mid-left
  - A cover that still needs a content-style slide footer
not_when:
  - Title/cover lockups (use title-slide-01…04)
  - Title top / body bottom split (use chapter-slide-02)
  - Content or close slides with cards or a story column
---

# Chapter slide 01

`<slide kind="cover">` with title + body mid-left in a fill column `<stack>` (`max-w-md` / 600px clamp, `<cover-title size="sm" width="fill">`) and `<slide-footer>` at the bottom (not inside `<footer-container>`). Canvas follows `foundations.colorTheme.cover`. The title fills the clamped column so it wraps with the body.
