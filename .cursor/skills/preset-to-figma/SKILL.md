---
name: preset-to-figma
description: >-
  Push a DeckTool HTML preset onto Figma template pages using existing
  Components-page mains. Use when the user asks to sync a template, push a
  preset to Figma, HTML → Figma, or build slides under TITLE / CHAPTER /
  CONTENT / GRATIA SLIDES sections.
---

# Preset → Figma

Load this skill before writing a slide onto a **template page**. HTML is the source of truth. Do not invent Figma components or brand tokens.

## Cost guardrail (read first)

**Do not rebuild templates via `use_figma`.** Shipping the builder + IR through the agent burns a large amount of tokens.

Default path:

1. Fix HTML / mapper as needed.
2. `node scripts/figma/build-template.js <id>` (or `all`) — regenerates IR and the plugin.
3. Tell the user to run **Plugins → Development → DeckTool Sync → Build template →** section → `<id>` (or **Build all templates**). Stop there.

If they asked you to “build it in Figma” / “push to Figma” from the agent, **warn first** that `use_figma` is expensive and the plugin is the cheap path. Only proceed with `use_figma` to assemble a template if they explicitly override after the warning.

`use_figma` without that warning is OK for **small** work: inspect a node, tweak one property, pull snapshots (see figma-pull). Not for full template rebuilds.

Import the plugin once: **Plugins → Development → Import plugin from manifest…** → `scripts/figma/plugin/manifest.json`.

```bash
node scripts/figma/build-template.js all
node scripts/figma/build-template.js content-slide-3-cards
npm run figma:build-template -- all
```

Do not run **Sync variables and components** to push templates — that command stays variables + Components page only.

See `docs/scripts.md` → Template pages. Project rule: `.cursor/rules/figma-build-via-plugin.mdc`.

## Pages

Each preset is a **single component** on a **page named after its `id`**. Groups are separated by a page divider (`---`) and an empty section header page:

| Section header (empty) | Slide pages |
| --- | --- |
| **TITLE SLIDES** | `title-slide-01` … `title-slide-04` |
| **CHAPTER SLIDES** | `chapter-slide-01`, `chapter-slide-02` |
| **CONTENT SLIDES** | `content-slide-*` |
| **GRATIA SLIDES** | `gratia-about`, `gratia-contact`, `gratia-fundraising`, `gratia-services` |

Page order: **Components** → divider → section header → that section’s slide pages → … Do not put templates on Components. Remove leftover empty group pages (`Title slides`, `Templates`, …) if they remain. One template per page at **x=0**, **y=0**.

## Rules

- **Name** = preset `id` from the `.md` sidecar. Publish as a **single component** (a set only if a real axis exists).
- **Building blocks only.** Nest Components-page mains (`Card`, `Slide-title`, `Slide-footer`, `Brand-logo`, `Slide-pretitle`, `Cover-title`, `Stamp`, `Badge`, `Divider`, `Media-slot`, `Analyst`, `Attribution-box`, …). Free `<stack>` / `<text>` / `<div>` → auto-layout frames / text objects. Never create Stack or Text component sets.
- **Cards with custom interiors** (stamp + stacks, catalog copy) cannot nest into a Card instance. Rebuild as a frame with card fill / stroke / radius / padding tokens (`cardFrame`). Catalog cards that only use card-pretitle / title / text / meta stay `Card` instances.
- **Chrome.** Rebuild `<header-container>` / `<content-container>` / `<footer-container>` as frames with chrome padding variables. Header `paddingBottom` is the gap before content; content `paddingTop` is 0. Do not leave the Components-page media-slot samples inside. Class padding (`p-0`, `pr-0`, `p-20`) overrides those tokens.
- **Pretitle.** Read `components.slideTitle.pretitle.default` on the **build brand** (default Gratia). `badge` → Slide-pretitle `Type=badge`; `text` → `Type=label`. Gratia = badge; Riverton = label. HTML may still use `<slide-pretitle>`; Figma resolves via that default unless the preset explicitly uses `<badge data-slot="pre">`. Hide pret/sub layers when the HTML omits them.
- **Footer logo.** `Slide-footer` already nests Brand-logo. Default `Brand=Gratia, Theme=light` for Gratia builds. Cover `<img data-logo>` → Brand-logo (`Brand=Riverton` only when the src path says so). `Theme=dark` when the slide is `color-theme="dark"` or the src is `*-logo-inverted.svg`. Color collection Dark does not swap baked logo fills.
- **Icons.** Stamp / Badge / Analyst nest Icon-library instances (`star-fill`, `checkbox-circle-fill`, `earth-fill`, …) with INSTANCE_SWAP. Do not detach. Template `icon="…"` / `leading` / `trailing` map to names in `scripts/figma/icon-keys.json`; apply uses `importComponentByKeyAsync`, swaps, then recolors VECTOR / BOOLEAN_OPERATION fills to the stamp or badge foreground token (`#000` in the library is only the default). New glyph names need a key entry and a plugin regen. Stamp is `Variant={paint}, Type=mark|icon`. HTML never uses mark and icon together.
- **Analyst.** Instance `Size=lg` (or `sm`) with slot overrides. Do not recurse photo/badge innards.
- **Dark slides.** `color-theme="dark"` on `<slide>` is a Color collection mode on the template root — not a separate variant.
- Layout presets keep placeholder copy. Brand slides keep HTML copy.

## Tag → Figma

| HTML | Figma |
| --- | --- |
| `<slide>` | Template root component 1280×800, `color-slide-background`, width → `slide-max-width`. `kind="cover"` with no `color-theme` uses `foundations.colorTheme.cover` as the Color mode |
| `<header-container>` / `<content-container>` / `<footer-container>` | Frames with chrome padding bindings (no media-slot sample) |
| `<slide-title-group>` | Instance `Slide-title` matching Size × Align (`size` on `<slide-title>`, `align` on the group, defaults `md` / `left`) |
| Pre slot | Slide-pretitle `Type=badge` \| `Type=label` from brand default |
| `<cover-title>` | Instance `Cover-title` `Size=sm\|md\|lg\|xl` × `Align=left\|center\|right` (omit `align` → left) |
| `<stack>` / layout `<div>` | Auto-layout frame; `gap="2"` → `spacing-2`; `justify-between` / `mt-auto` → `SPACE_BETWEEN` with Gap **Auto** (no `itemSpacing`); `width="fill"` → FILL; `columns="3"` → wrap grid |
| `<card>` | Instance `Card` when slots match the catalog; otherwise a tokenized card frame |
| `<stamp>` / `<badge>` / `<divider>` / `<media-slot>` / `<analyst>` / `<attribution-box>` | Matching Components-page instance. Stamp is `Variant={paint}, Type=mark\|icon`. Badge leading/trailing are INSTANCE_SWAP. On a dark canvas, attribution-box is pinned to Color mode light |
| `<slide-footer>` | Instance `Slide-footer` (includes Brand-logo) |
| Free `<text>` | Text object with family / size / weight / line-height / tone bindings |

## Stop

Do not start the showcase server. The user reviews the template pages in Figma.
