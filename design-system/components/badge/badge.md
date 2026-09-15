---
id: badge
kind: component
use_when:
  - A hugging label (status, category, pretitles on slides)
  - A short word or phrase, optionally with a leading/trailing icon
not_when:
  - A block of content (use card or callout)
  - A square number/icon mark (use stamp)
---

# Badge

Use `<badge variant="neutral">` with `<badge-text>` (`tone="strong" context="surface"`). Variants match card. Optional `color-theme="light|dark"`. Omit `border` so `components.badge.border.hasBorderByDefault` applies, or set `border="true|false"`.

Optional `<badge-icon data-slot="leading" icon="{name}">` and/or `<badge-icon data-slot="trailing" icon="{name}">`. `{name}` is a file in `assets/icons/` without `.svg`. Omit unused icon slots.

On `<slide-title-group>`, the brand `components.slideTitle.pretitle.default` of `badge` uses this as `data-slot="pre"`.

Canonical markup: `design-system/components/badge/badge.html`.
