---
name: attribution-box
description: >-
  DeckTool attribution box is brand-agnostic. Load when editing
  attribution-box components, presets with attribution, brand-settings, or
  deck generation that touches the Gratia credit mark.
---

# Attribution box

`<attribution-box>` is a special component that does not change when branding changes.

## Fixed by design

- **Logo** — always Gratia. Keep `<img data-slot="logo" src="../../assets/logos/gratia-logo.svg" alt="Gratia">` (or the same path relative to the deck). Never swap it for the deck brand logo.
- **Spacing** — gap and padding are hardcoded in `design-system/components/attribution-box/attribution-box.css`, not in `brand-settings.json`.
- **Type sizes** — fixed in `design-system/tokens/typography.css` (`--attribution-box-text-size-title`).
- **Structure** — do not redesign the component, rename slots, or add brand tokens for it.

## Brand settings

Do **not** add an `attributionBox` section to `brands/{slug}/brand-settings.json`. New brands inherit the same attribution box as Riverton and Gratia.

## Deck generation

When copying presets or generating decks:

1. Leave `<img data-slot="logo">` pointing at `gratia-logo.svg`.
2. Only `<img data-logo>` marks (deck/client logo elsewhere on the slide) follow the active brand.

## Files

| Path | Role |
|---|---|
| `design-system/components/attribution-box/attribution-box.css` | Layout and padding |
| `design-system/components/attribution-box/attribution-box.html` | Title variant template |
| `assets/logos/gratia-logo.svg` | Fixed credit mark |
