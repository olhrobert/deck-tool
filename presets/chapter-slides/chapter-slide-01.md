---
id: chapter-slide-01
kind: chapter
use_when:
  - Opening a section with title and body stacked mid-left
  - A cover that still needs a content-style slide footer
not_when:
  - Title/cover lockups (use title-slide-01…04)
  - Title top / body bottom split (use chapter-slide-02)
  - Content slides with cards or a story column
---

# Chapter slide 01

`<slide kind="cover">` with title + body mid-left (`size="1200"`) and `<slide-footer>` at the bottom (not inside `<footer-container>`). Canvas follows `foundations.colorTheme.cover`.
