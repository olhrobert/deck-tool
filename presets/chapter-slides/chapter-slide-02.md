---
id: chapter-slide-02
kind: chapter
use_when:
  - Opening a section with the title top-left and body bottom-left
  - A cover that still needs a content-style slide footer
not_when:
  - Title/cover lockups (use title-slide-01…04)
  - Mid-left stacked chapter (use chapter-slide-01)
  - Content or close slides with cards or a story column
---

# Chapter slide 02

`<slide kind="cover">` with cover title (`size="sm"` `width="fill"`) top-left and body bottom-left in a fill column `<stack>` (`max-w-md` / 600px clamp, `justify-between`), and `<slide-footer>` at the bottom (not inside `<footer-container>`). Canvas follows `foundations.colorTheme.cover`.
