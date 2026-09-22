---
name: figma-to-preset
description: >-
  Turn a Figma slide into a DeckTool HTML preset using existing components
  and tokens. Use when the user pastes a figma.com URL, asks to create a
  slide template or preset from Figma, or says Figma → preset.
---

# Figma → preset

Load this skill before writing preset HTML. HTML is the source of truth. Do not invent components or brand tokens.

## 1. Read the Figma node

1. Load `/figma-design-to-code` (or `skill://figma/figma-design-to-code/SKILL.md`).
2. Call `get_design_context` with `fileKey`, `nodeId` (`3638-779` → `3638:779`), `skillNames: "figma-design-to-code"`, `clientLanguages: "html,css,javascript"`.
3. Treat the returned React/Tailwind as **reference**, not paste. Match layout from the screenshot + node structure.

If `get_design_context` errors, stop and read the message. Do not rebuild from the screenshot alone while that tool can still run.

## 2. Reuse DeckTool pieces

Read sibling preset `.md` sidecars (`use_when` / `not_when`) and pick the closest layout. Then read the component `.md` files you will use.

**Figma has no Stack or Text components.** Native auto-layout frames and text objects map to HTML `<stack>` / `<text>` on pull (and the reverse on push). See `docs/scripts.md` → HTML ↔ Figma primitives. Do not create Stack/Text component sets in Figma to “match” the HTML tags.

Existing building blocks: `<slide>`, `<header-container>` / `<content-container>` / `<footer-container>`, `<slide-title-group>` / `<slide-title>`, `<stack>`, `<text>`, `<stamp>` / `<stamp-icon>` / `<stamp-text>`, `<card>`, `<media-card>`, `<callout>`, `<badge>`, `<divider>`, `<media-slot>`, `<analyst>`, `<slide-footer>`.

- **Auto-layout → `<stack>`:** free auto-layout frames become `<stack>` (`gap` / `direction` / `wrap` / `width` / `height`). Auto-layout that is only the interior of a Card / Badge / Callout / Analyst / etc. instance stays that component — do not unwrap it into a naked stack. Map Figma spacing to the nearest `--spacing-*` step (`24px` → `gap="6"`). Fractional columns use `.w-1-3` (and siblings). Fixed column widths may use inline `style="width: …px"` like existing presets (440, 480).
- **3-column card catalogs:** read the leftover row in Figma. Cards that stay one column wide (empty third cell) → one `<stack columns="3">` with cards as direct children (`gratia-services`). Cards that stretch to fill a short last row → nested `<stack direction="row">` rows of `<card width="fill">` (`content-slide-12-cards`). Do not add a `pack` attribute. See `design-system/components/stack/stack.md`.
- **Text objects → `<text>`:** map px to the type scale (`14px` → `size="350"`, `12px` → `size="300"`, `10px` → `size="250"`). Bindings to `text-size-*` / `font-*-family` win over raw px when present. Prefer semantic tags when the role is clear: slide headlines → `<slide-title size="sm|md|lg">`; cover → `<cover-title align="left|center|right">` (omit for left); in-body titles → `<text family="heading" size="…">`; metrics → `<text family="stat" size="…">`; pretitles → `<text family="label" size="…">` or `<slide-pretitle>` / `<card-pretitle>`. Omit `weight` on those roles so the brand style applies. Never map cover-title alignment to `class="text-center"`.
- Canvas copy: `context="slide"`. Inside card/callout/badge: `context="surface"`.
- Hairlines: `<divider>` (horizontal) or `orientation="vertical"` in a row. Do not use `--color-slide-surface-border`.
- Icons: `<stamp-icon icon="{assets/icons filename without .svg}">`. Never commit Figma MCP asset URLs. Never hand-draw SVGs. Figma may show a filled icon *frame* from an old sync — ignore that frame fill; HTML icons have no background.
- Brand-logo `Theme=dark` is the inverted lockup (`{slug}-logo-inverted.svg`). HTML still uses `<img data-logo>` with the default src; the showcase swaps inverted from canvas luminance.
- Photos / screenshots: keep `<media-slot data-slot="…">` until real artwork exists.
- Green circular marks in Gratia comps → `<stamp variant="emphasis">`. Numbered marks → `<stamp-text>`.
- Paint follows `color-theme`. Omit `color-theme` on `<slide>` (light canvas). Do not force `color-theme="light"` on stamps/cards unless the user asks to pin them.

## 3. Write the file

Decide **layout** vs **brand slide** before writing:

| | Layout | Brand slide |
| --- | --- | --- |
| When | Starting point; copy will be replaced | Drop into that brand’s decks as-is |
| Path | `presets/content-slides/content-slide-{slug}.html` (or title/chapter/close) | `presets/brands/{slug}/{name}.html` |
| Asset prefix | `../../design-system/` | `../../../design-system/` |
| Copy | Placeholder (`Slide title`, `Card title`, `Item one`…) | Keep the Figma wording |
| Showcase | Content (or Title / Chapter / Close) group; light + `color-theme="dark"` variants | `BRAND_PRESET_GROUPS`; no theme variants; visible only when that brand is selected |

Copy chrome, stylesheet links, and `<slide-footer>` from an existing content layout (omit the footer on close slides).

**Layout:** match column widths, gaps, alignment (`class="items-center"`), and which blocks are lists vs cards. Do not recreate Figma auto-layout as absolute CSS. A Figma grid of cards is `columns="3"`; a Figma auto-layout column of fill rows is nested `direction="row"` stacks.

**Do not:** new components, new utilities unless a preset already needs that class, new brand tokens, Tailwind, restyle `<content-container>` beyond fill utilities (`flex`, `p-0`, `pr-0`) already used by presets.

Every content layout includes `<slide-footer>` inside `<footer-container>`. Close slides do not.

## 4. Sidecar and registry

**Layout** sidecar: `id`, `kind: content` (or title/chapter/close), `intent: layout`, `use_when`, `not_when` (name the other layouts **and** brand slides), `color_theme: inherit`, `slots`. Document the structure, placeholder table, color-theme rule, and a **Do not** list.

**Brand slide** sidecar: `id` (`{brand}-{name}`), `kind`, `intent: brand`, `brand: {slug}`, `use_when` (drop in as-is), `not_when` (layouts, other brands). Do not rewrite copy.

Then:

1. Add `not_when` pointers on the other layout and brand-slide sidecars.
2. Register in `design-system/showcase/showcase.js`: layouts in `PRESET_GROUPS` (content layouts get light + `color-theme="dark"` variants); brand slides in `BRAND_PRESET_GROUPS` with `brand: "{slug}"` and no variants.
3. List it in the matching README (`presets/content-slides/README.md` or `presets/brands/README.md`), `presets/README.md` if needed, and `docs/overview.md`.

## 5. Stop

Do not start the showcase server unless the user asks. They review in `design-system/showcase/showcase.html`.
