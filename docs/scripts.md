# Scripts

Node is required for the compile scripts. No `npm install` — they use only Node built-ins.

## `compile-deck.js`

Compiles one deck folder into a presentable `index.html`.

**What it does**

1. Scans the deck folder for `.html` files containing a `<slide>` element (skips generated `index.html`)
2. Updates `slides.json` — rewrites the `slides` array (sorted by filename), preserves `title`
3. Extracts each `<slide>…</slide>` block and merges them into `viewer/deck.html`
4. Writes `index.html` in the deck folder

**Usage**

```bash
node scripts/compile-deck.js decks/{deck-name}
```

```bash
npm run compile -- decks/{deck-name}
```

**Example**

```bash
node scripts/compile-deck.js decks/riverton-project-charter
# → decks/riverton-project-charter/index.html
```

**Slide order** — controlled by filename sort (`01.html`, `02.html`, …). Rename files to reorder.

**Edit `slides.json` by hand** — only the `title` field; `slides` is regenerated on every compile.

---

## `compile-all-decks.js`

Runs `compile-deck.js` for every subdirectory under `decks/` that contains at least one slide HTML file.

**Usage**

```bash
node scripts/compile-all-decks.js
```

```bash
npm run compile:all
```

Continues on failure and reports how many decks compiled successfully. Exits with code 1 if any deck failed.

---

## `deck-viewer.js`

Browser script in `viewer/` — not run from the terminal. Loaded by compiled `index.html` via `viewer/deck.html`.

**What it does**

- Shows one slide at a time inside `.deck-viewer`
- Prev/next buttons and slide counter (`1 / N`)
- Keyboard: ← ↑ PageUp (prev), → ↓ PageDown Space (next), Home (first), End (last)

**Usage**

Open a compiled deck in the browser:

```bash
open decks/{deck-name}/index.html
```

No build step. Recompile the deck if slide content changes.
