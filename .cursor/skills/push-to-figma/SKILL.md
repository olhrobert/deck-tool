---
name: push-to-figma
description: >-
  Push a compiled DeckTool HTML deck to Figma as editable frames that instance
  the design-system library in the specified brand. Use when the user asks to
  publish, sync, or convert slides/decks to Figma.
---

# Push to Figma

Instance the library. Do not flatten screenshots. Do not recreate Card / Slide Title / etc.

## Steps

1. Read `docs/figma.md`, `docs/html-to-figma.md`, `figma/library.json`, and [reference.md](reference.md). Load Figma skills `figma-use`, `figma-generate-library`, `figma-generate-design`.
2. Compile, then parse:

```bash
node scripts/compile-deck.js decks/{deck-name}
node scripts/html-to-ir.js decks/{deck-name} --out /tmp/{deck-name}-ir.json
```

3. Confirm `ir.brand` has a Primitives mode in the Figma file. If not, run `new-brand` (Figma section) first.
4. `use_figma` (never parallelize; `setCurrentPageAsync` once per script):
   - Find or create page `page/{deck-slug}` named after the deck
   - Set that page's Primitives mode to the brand
   - Place frames at y=40, x = 40 + i * (1280 + 80)
5. Build from IR:
   - `chrome: "cover"` → custom 1280×800 tree (fill `root.fill`). **Do not** instance Slide
   - `chrome: "slide"` → instance `componentset/slide`, FILL Header/Content/Footer slots, clear placeholder slot children, append IR slot trees
6. Attribution: create the instance on the page, mutate slot text before any `await`, then reparent into the footer/cover. Hide the extra separator + number for footer-02.
7. Set variants explicitly (`size`, `padding`, `gap`, `surface`) — Figma defaultVariant ≠ CSS default.
8. Screenshot each slide (`get_screenshot`, 1280). Fix layout (hugging slots, FILL/HUG) before calling it done.
9. Tag the page and frames with `setSharedPluginData("dsb", "key", …)` / `run_id`.

## Helpers

```js
function setProp(inst, name, value) {
  const key = Object.keys(inst.componentProperties).find(
    (k) => k === name || k.startsWith(name + "#"),
  );
  inst.setProperties({ [key]: value });
}
```

Look up components by dsb key, not by stale IDs. Property names and gotchas: [reference.md](reference.md).
