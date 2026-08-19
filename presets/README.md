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
    client-logo.svg
    client-logo-inverted.svg
    slide-01.html
    slide-02.html
    slide-03.html
```

Copied files keep `../../design-system/` and `../../assets/` paths — they work from any `decks/{name}/` folder.

## Logos

Presets use a shared placeholder at `assets/logos/placeholder-logo.svg` (light backgrounds) and `placeholder-logo-inverted.svg` (dark backgrounds). Artwork is used as-is via `<img>`; fills are not overwritten.

```html
<img
	src="../../assets/logos/placeholder-logo.svg"
	alt="Logo"
	data-logo="cover"
	class="shrink-0 block"
	style="height: 24px; width: auto"
/>
```

`data-logo` names the surface whose background decides default vs inverted: `cover`, `slide`, or `slide-surface`.

When creating a deck for a specific brand:

1. Copy presets into `decks/{deck-name}/` as usual.
2. Copy `brands/{slug}/{slug}-logo.svg` and `{slug}-logo-inverted.svg` into the deck folder.
3. Point each `<img data-logo>` at the matching deck-local file (inverted on dark surfaces). Leave `<img data-slot="logo">` in the attribution box unchanged.

See [docs/brands.md](../docs/brands.md#logos).

## Example prompt

> Create `decks/client-pitch/` using `deck-title-03` for the opener and `footer-01` on content slides. Add `client-logo.svg` to the deck folder and swap the placeholder logo. Set `slides.json.brand` to the client brand slug.
