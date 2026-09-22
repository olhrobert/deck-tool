---
id: analyst
kind: component
use_when:
  - A person card (photo, name, role, location, skill tags)
  - Talent / team grids on a content slide
  - The featured analyst sidebar on `content-slide-service`
not_when:
  - A labeled fact or metric (use card)
  - A media header with title, description, and footer (use media-card)
  - A note or aside (use callout)
  - Speaker credit on a founder narrative (plain text)
---

# Analyst

`<analyst>` composes existing pieces: square photo `<media-slot data-slot="image" padding="none" border="false" radius="none">`, optional `<badge data-slot="specialization" variant="emphasis">` overlay on the photo (default badge size, label e.g. Specialization), name/role `<text>`, featured `<media-slot data-slot="logo">` (`size="10"` on lg, `size="7"` on sm), location (`earth-fill` + text), and skill `<badge>`s (default size). Paint follows card **neutral** tokens only — no `variant` on `<analyst>`. Optional `color-theme="light|dark"`. `size="sm|lg"`; omit for `lg`.

Keep `data-slot` attributes. Omit unused optional slots (`specialization`, `logo`, location row, `tags`). Replace media wells with `<img>` when artwork exists (`width="fill"` and `class="aspect-square"` on the photo; keep the logo square).

Canonical markup: `design-system/components/analyst/analyst.html` (lg). Small: `size="sm"`.
