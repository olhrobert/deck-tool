# HTML → Figma

Parse a deck, then instance the library. Do not rebuild components.

```bash
node scripts/html-to-ir.js decks/{deck-name} --out /tmp/{deck}-ir.json
```

IR is JSON: `{ title, brand, slides[] }`. Each slide is either:

- `chrome: "cover"` — anonymous 1280×800 tree (`root`). Fill `color/cover-background` or `color/slide-background`
- `chrome: "slide"` — instance `componentset/slide` with `slots.header|content|footer`

Node types: `frame`, `instance`, `text`, `slot`.

## Tag map

| HTML | IR |
|---|---|
| `<slide>` without header/content/footer containers | cover frame |
| `<slide>` with chrome (`<header-container>` / `<content-container>` / `<footer-container>`) | Slide instance, `surface` from `.bg-cover` (Figma variant is still `surface=primary`) |
| `<slide-title>` | Slide Title instance (headline); always set `size` (`md` if omitted) |
| `<slide-title-group>` | Slide Title instance with pretitle + title + subtitle slots |
| `<paragraph-title>` | Paragraph Title instance |
| `<card>` | Card instance (pretitle, title, optional text, meta) |
| `<card>` otherwise | Card instance; set `padding`/`gap` (`md`/`md` if omitted) |
| `<callout>` | vertical frame (no library component yet); title + description as text |
| `<badge>` | hug frame (no library component yet); label as text |
| `<slide-footer>` | horizontal frame (no library component yet); logo + optional notes + meta |
| `<attribution-box>` | Attribution Box; `slot` is filled separately |
| `<attribution-box-separator>` | separator instance |
| `img[gratia-logo.svg]` | `__Logo/Gratia` |
| brand / placeholder `<svg><use>` | `__Logo/{Brand}` |
| flex row + check/close path + text | List Item `kind=in-scope\|out-of-scope` |
| `div.flex` | auto-layout frame (gap/padding/justify/align/fill from utilities) |
| `<body-copy>` | text + `typography` variables (`family/body`, `weight`, `size` from `sm|md|lg`, …) + color variable |
| `<callout-title>` | text (`family/paragraph-title`, size `400` unless overridden) |
| `<callout-description>` | text (`family/body`, size `350` unless overridden) |
| `<badge-text>` | text (`family/body`, size `300` unless overridden) |
| `<slide-footer-notes>` / `<slide-footer-title>` / `<slide-footer-chapter>` / `<slide-footer-page>` | text (`family/body`, size `300`); color from footer `context` |
| `<text>` | primitive — raw `size` step, `family`, etc. |

Utility class → token examples: `gap-10` → `spacing/10`, `p-20` + `pb-4` → padding 20 then bottom 4, `flex-1` / `grow` / `w-full` → FILL, `border-t` → top stroke `color/slide-surface-border`.

`<body-copy size="sm|md|lg">` maps to `--body-size-sm|md|lg` (brand type-scale steps; default `md` = `--text-size-400`). Primitive `<text size="350">` still resolves to `--text-size-*`. `text[tone="strong|subtle|base"]` plus `context="slide|surface|cover"` maps to `color/slide-foreground-*`, `color/slide-surface-foreground-*`, or `color/cover-foreground-*`. Attribution slot text is forced to `size/300` to match CSS, even if the markup omits `size`. Bind IR `typography.family/weight/size`. Apply `lineHeight` and `letterSpacing` as `{ unit: "PERCENT", value }` (CSS × 100). Do not apply text styles.

## Push sequence

1. Compile the deck, then parse IR
2. Look up components in `figma/library.json` by dsb key (re-resolve IDs in Figma if stale)
3. Create or reuse a page `page/{deck-slug}`
4. Set the page's Primitives mode to the deck brand
5. Place 1280×800 frames 80px apart
6. Cover: build the `root` tree with tokens; instance logos and attribution
7. Chrome slides: instance Slide, `FILL` the three slots, put instances into slots
8. Attribution (cover/title slides): create instance on the page, mutate slot text **before** any `await`, then reparent into the cover
9. Screenshot each slide; compare to `index.html` in the browser

Instance helper:

```js
function setProp(inst, name, value) {
  const key = Object.keys(inst.componentProperties).find(
    (k) => k === name || k.startsWith(name + "#"),
  );
  inst.setProperties({ [key]: value });
}
```
