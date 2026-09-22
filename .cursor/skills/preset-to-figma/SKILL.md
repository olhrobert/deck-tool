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

Prefer the scripted pipeline. Assemble by hand (`use_figma`, load `/figma-use` first) only if the script fails — same mapping table.

```bash
node scripts/figma/build-template.js all
node scripts/figma/build-template.js content-slide-3-cards
npm run figma:build-template -- all
```

Then in the DeckTool file: **Plugins → DeckTool Sync → Build all templates**. Do not run **Sync variables and components** to push templates — that command stays variables + Components page only.

See `docs/scripts.md` → Template pages.

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
- **Icons.** Stamp / Badge / Analyst SVG imports are frames around vectors. Never fill the icon frame — only VECTOR / BOOLEAN_OPERATION (and similar glyph nodes) get the foreground paint.
- **Analyst.** Instance `Size=lg` (or `sm`) with slot overrides. Do not recurse photo/badge innards.
- **Dark slides.** `color-theme="dark"` on `<slide>` is a Color collection mode on the template root — not a separate variant.
- Layout presets keep placeholder copy. Brand slides keep HTML copy.

## Tag → Figma

| HTML | Figma |
| --- | --- |
| `<slide>` | Template root component 1280×800, `color-slide-background`, width → `slide-max-width` |
| `<header-container>` / `<content-container>` / `<footer-container>` | Frames with chrome padding bindings (no media-slot sample) |
| `<slide-title-group>` | Instance `Slide-title` matching Size × Align (`size` on `<slide-title>`, `align` on the group, defaults `md` / `left`) |
| Pre slot | Slide-pretitle `Type=badge` \| `Type=label` from brand default |
| `<cover-title>` | Instance `Cover-title` `Size=sm\|md\|lg\|xl` × `Align=left\|center\|right` (omit `align` → left) |
| `<stack>` / layout `<div>` | Auto-layout frame; `gap="2"` → `spacing-2`; `width="fill"` → FILL; `columns="3"` → wrap grid |
| `<card>` | Instance `Card` when slots match the catalog; otherwise a tokenized card frame |
| `<stamp>` / `<badge>` / `<divider>` / `<media-slot>` / `<analyst>` / `<attribution-box>` | Matching Components-page instance |
| `<slide-footer>` | Instance `Slide-footer` (includes Brand-logo) |
| Free `<text>` | Text object with family / size / weight / line-height / tone bindings |

## Stop

Do not start the showcase server. The user reviews the template pages in Figma.
