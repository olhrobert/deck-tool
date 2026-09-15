---
id: attribution-box
kind: component
use_when:
  - Title slides, following `components.attributionBox.default`
  - When the user asks to show or hide the Gratia prepared-by mark (`attribution="true|false"`)
not_when:
  - Speaker name/role on a story slide (plain text)
  - The deck/client logo (that is `data-logo`, not this component)
---

# Attribution box

Brand-agnostic Gratia credit. Do not tokenize it in `brand-settings.json`. Leave `<img data-slot="logo">` pointing at `../../assets/logos/gratia-logo.svg`. Only the credit text is editable.

Load `.cursor/skills/attribution-box/SKILL.md` when editing this component.

Canonical markup: `design-system/components/attribution-box/attribution-box.html`.
