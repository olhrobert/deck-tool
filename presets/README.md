# Presets

Ready-made HTML slide layouts for the showcase. Layouts (`intent: layout`) use placeholder copy. Brand slides (`presets/brands/{slug}/`, `intent: brand`) keep their copy. Do not redesign layouts or change CSS/asset paths when editing them. Each file has a sibling `.md` sidecar (`use_when` / `not_when`). Component usage notes live next to canonical HTML in `design-system/components/**/*.md`. See also [docs/components.md](../docs/components.md) for size / gap / padding / variant.

Decks copy these files into `decks/{slug}/` (see [docs/decks.md](../docs/decks.md)). The admin add-slide dialog lists every preset HTML that contains a `<slide>`.

## Preset folders

| Folder            | Use for                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| `title-slides/`   | Opening title layout — see [title-slides/README.md](title-slides/README.md)        |
| `chapter-slides/` | Chapter opener layout — see [chapter-slides/README.md](chapter-slides/README.md)   |
| `content-slides/` | Content layout (placeholder copy) — see [content-slides/README.md](content-slides/README.md) |
| `close-slides/`   | Close layouts when they exist — see [close-slides/README.md](close-slides/README.md) |
| `brands/{slug}/`  | Brand-locked slides, drop in as-is — see [brands/README.md](brands/README.md)      |

Layout files keep `../../design-system/` and `../../assets/` paths (`presets/{kind}/`). Brand slides keep `../../../design-system/` and `../../../assets/` (`presets/brands/{slug}/`). When copying a brand slide into a deck, rewrite those to `../../` (the admin does this automatically).

## Logos

Presets use a shared placeholder at `assets/logos/placeholder-logo.svg` (light backgrounds) and `placeholder-logo-inverted.svg` (dark backgrounds). Artwork is used as-is via `<img>`; fills are not overwritten.

```html
<img
	src="../../assets/logos/placeholder-logo.svg"
	alt="Logo"
	data-logo
	class="shrink-0 block"
	style="height: 24px; width: auto"
/>
```

`data-logo` (no value), `data-logo="slide"`, and `data-logo="cover"` (alias) all use `--color-slide-background` on the nearest slide. `data-logo="slide-surface"` uses `--color-slide-surface-background`. Inside `<slide-footer>`, keep `data-logo` with no value so the logo follows the slide canvas.

The showcase and compiled decks swap placeholder vs brand artwork from the active brand. Leave `<img data-slot="logo">` in the attribution box unchanged (always the Gratia mark).

Partner / analyst / grid marks come from `assets/logos/pool/` (not `data-logo`). Use `object-fit: contain` so the mark is not cropped:

```html
<img
	data-slot="partner"
	src="../../assets/logos/pool/goldmansachs.svg"
	alt="Goldman Sachs"
	style="width: 160px; height: 64px; object-fit: contain"
/>
```

On a dark canvas, use `{slug}-inverted.svg`. Add a lockup with `node scripts/add-pool-logo.js --file path/to/logo.svg slug`.

See [docs/brands.md](../docs/brands.md#logos).
