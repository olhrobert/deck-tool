---
id: chapter-slide-02
kind: chapter
use_when:
  - Opening a section with the title top-left and body bottom-left
  - A cover that still needs a content-style slide footer
not_when:
  - Title/cover lockups (use title-slide-01…04)
  - Mid-left stacked chapter (use chapter-slide-01)
  - Content slides with cards or a story column
---

# Chapter slide 02

`<slide kind="cover">` with cover title (`size="sm"`) at the top-left, body at the bottom-left, and `<slide-footer>` at the bottom (not inside `<footer-container>`). Canvas follows `foundations.colorTheme.cover`.
