---
name: attribution-box
description: >-
  DeckTool attribution box is brand-agnostic. Load when editing
  attribution-box components, presets with attribution, or brand-settings
  that touch the Gratia credit mark.
---

# Attribution box

`<attribution-box>` is a special component that does not change when branding changes.

## Fixed by design

- **Logo** — always Gratia. Keep `<img data-slot="logo" src="../../assets/logos/gratia-logo.svg" alt="Gratia">`. Never swap it for the active brand logo.
- **Spacing** — gap and padding are hardcoded in `design-system/components/attribution-box/attribution-box.css`, not in `brand-settings.json`.
- **Type sizes** — fixed in `design-system/tokens/typography.css` (`--attribution-box-text-size-title`).
- **Structure** — do not redesign the component, rename slots, or add brand tokens for it.

## Brand settings

Do **not** add paint, spacing, or type keys for the box. Appearance stays hardcoded.

`components.cover.attributionBox.default` is the only allowed setting: a boolean for whether title-slide presets show the box when `attribution` is omitted on `<slide kind="cover">`. Gratia is `false`; Riverton is `true`. Override per slide with `attribution="true|false"`.

## Title presets

Title-slide presets include the box in markup. Omit `attribution` unless overriding the brand default. Leave `<img data-slot="logo">` pointing at `gratia-logo.svg`. Only `<img data-logo>` marks (brand logo elsewhere on the slide) follow the active brand.

## Files

| Path | Role |
|---|---|
| `design-system/components/attribution-box/attribution-box.css` | Layout and padding |
| `design-system/components/attribution-box/attribution-box.html` | Title variant template |
| `assets/logos/gratia-logo.svg` | Fixed credit mark |
