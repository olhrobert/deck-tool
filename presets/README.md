# Presets

Ready-made HTML slides for deck generation. **Copy a preset into `decks/{deck-name}/` and replace placeholder text only.** Do not redesign layouts or change CSS/asset paths.

## Preset folders

| Folder             | Use for                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `deck-titles/`     | Opening title slide — see [deck-titles/README.md](deck-titles/README.md)         |
| `content-slides/`  | Content slide chrome — see [content-slides/README.md](content-slides/README.md) |
| `content-footers/` | Content slide footer — see [content-footers/README.md](content-footers/README.md) |
| `cards/`           | Card content patterns — see [cards/README.md](cards/README.md)                   |

## Deck folder convention

```
decks/
  my-deck/
    deck-title.html          ← copied from deck-titles/
    client-logo.svg          ← optional: deck-specific logo sprite
    slide-01.html
    slide-02.html
    slide-03.html
```

Copied files keep `../../design-system/` and `../../assets/` paths — they work from any `decks/{name}/` folder.

## Logos

Presets use a shared placeholder logo at `assets/logos/placeholder-logo.svg`. It inherits color via `currentColor`, so it works on any slide background.

When creating a deck for a specific client or brand:

1. Copy presets into `decks/{deck-name}/` as usual.
2. Add the client's logo SVG to the deck folder (e.g. `decks/{deck-name}/client-logo.svg`).
   - Use a `<symbol>` sprite with `fill="currentColor"` on paths, matching `placeholder-logo.svg` or `decks/riverton-project-charter/riverton-logo.svg`.
3. Update the `<use href="…">` in each slide to point at the deck-local file (e.g. `client-logo.svg#client-logo`).
4. Adjust the wrapping `<svg viewBox="…">` to match the logo's dimensions.

If no deck-specific logo is provided, keep the placeholder reference from the preset:

```html
<use href="../../assets/logos/placeholder-logo.svg#placeholder-logo" />
```

See `decks/riverton-project-charter/` for a working example with a deck-local Riverton logo.

## Example prompt

> Create `decks/client-pitch/` using `deck-title-03` for the opener and `footer-01` on content slides. Add `client-logo.svg` to the deck folder and swap the placeholder logo. Set `slides.json.brand` to the client brand slug.
