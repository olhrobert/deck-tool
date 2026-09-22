# Plan: deck management

A deck is `decks/{slug}/` — numbered slide HTML plus `slides.json`. See
`../../../docs/decks.md`. Compile is always `scripts/compile-deck.js`.

## Scope

| Screen | Route | Does |
| --- | --- | --- |
| List | `/decks` | All decks, brand, slide count, compiled/stale, archive, delete, create |
| View | `/decks/[slug]` | Slides as thumbs, compile, open compiled `index.html` |
| Edit | `/decks/[slug]/edit` | Title, brand, reorder (rename), add from preset, remove slide |

## Decisions

**Order is filenames.** Saving a new order renumbers through temporary names.
`compile-deck.js` rewrites `slides.json`'s `slides` array from disk every time.

**Add-from-preset rewrites paths.** Layout presets already use `../../`. Brand
slides under `presets/brands/{slug}/` use `../../../` — those become `../../`
so stylesheets resolve from `decks/{slug}/`.

**Previews use the viewer template.** Bare slide files omit `brand.css` and
viewer CSS. Thumbs and `?as=slide` compose `viewer/deck.html` so the picture
matches compile.

**Presets with no `<slide>` are fragments.** They appear as a note in the add
dialog, not as addable slides.

## Not in scope

- Editing slide HTML in the browser. Edit the files; this UI manages membership
  and order.
- Pushing a compiled deck to Figma. Preset → Figma is the template pipeline;
  a deck is a different artifact.
