---
id: callout
kind: component
use_when:
  - A note, caveat, quote-like aside, or status message
  - One highlighted thought with a left stripe, not a grid of facts
not_when:
  - Parallel metrics or offerings (use card)
  - A compact label (use badge)
---

# Callout

Use `<callout variant="neutral" padding="md">` with `<callout-title>` (`tone="strong" context="surface"`) and `<callout-description>` (`tone="base" context="surface"`). Variants: `neutral|positive|warning|negative|informative` only (no emphasis).

Background, foreground, and stripe follow inherited `color-theme`. Omit `gap` so `components.callout.gap.sm` applies, or set `gap="none|sm|md|lg"`. Padding is `components.callout.padding` (`sm|md|lg`, default `md`). Nested `context="surface"` ink follows the callout variant (strong / base / subtle).

Canonical markup: `design-system/components/callout/callout.html`.
