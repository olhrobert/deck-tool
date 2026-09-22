---
name: figma-pull
description: >-
  Pull explicit Figma template tweaks back into the DeckTool preset HTML and
  the template mapper, then regenerate IR. Use when the user asks to pull
  Figma changes, sync a template back, or update the mapper from a Figma
  edit. Never run unless they ask.
---

# Figma pull

Explicit only. Do not pull on **Build all templates**, brand edits, or a general sync. HTML stays the source of truth. Do not hand-edit `scripts/figma/templates/<id>.json`.

Components-page mains (`Card`, `Badge`, …) are out of scope. If the node is on the **Components** page, stop and say so.

This is not [figma-to-preset](../figma-to-preset/SKILL.md). That skill creates a new preset from a design. This one updates an existing template after someone tweaked the generated component.

## 1. Snapshot

Load `/figma-use` before `use_figma`. File key is `scripts/figma/.figma-file.json` (`fileKey`). The node must be the template `COMPONENT` (the page root, e.g. `chapter-slide-02`).

```js
const { codeFor } = require("./scripts/figma/pull/snapshot-walk.js");
// use_figma code: codeFor("57:258")
```

Write the returned JSON to `scripts/figma/pull/out/<id>.snapshot.json` (gitignored). Do not commit it.

## 2. Diff

```bash
node scripts/figma/diff-template.js <id> scripts/figma/pull/out/<id>.snapshot.json
```

Add `--copy` only when the user asked to pull wording. Exit code 1 means there are rows. Exit code 2 is a bad id or path.

## 3. Apply

For each **property** row, edit the preset HTML and, when the suggestion says so, [scripts/figma/build-template.js](../../../scripts/figma/build-template.js).

- `<stack>` / `<text>` / instance tags: `width` and `height` are `fill` or `hug`. `gap` is a spacing step. `max-w-md` is max width 600. `justify-between`, `justify-center`, `items-center` are the alignment classes the mapper already reads.
- If the suggestion names a mapper that hardcodes sizing (`mapAttributionBox`, `mapBadge`, `mapBrandLogo`, `mapStamp`), change that function to `horizontalSize(node.attrs.width, "<default>")` / `verticalSize(node.attrs.height, "<default>")` in the same pull. `mapCoverTitle` already honors `width` and `height` (omit to hug).
- **structural** rows: report them. Do not add, delete, or reorder layers.
- **copy** rows: apply only with `--copy` and an explicit ask. Layout presets keep placeholder copy. Brand slides keep HTML copy unless the user wants the Figma wording.

Then:

```bash
node scripts/figma/build-template.js <id>
```

That regenerates the IR and the plugin bundle. Do not tell the user the Figma file already matches until they run **Build all templates** themselves.

## Stop

Do not start the showcase. Do not run a pull the user did not ask for.
