# Presets

Ready-made HTML slide layouts for the showcase. Do not redesign layouts or change CSS/asset paths when editing them. Each preset has a sibling `.md` sidecar (`use_when` / `not_when`). Component usage notes live next to fragments in `design-system/components/**/*.md`. See also [docs/components.md](../docs/components.md) for size / gap / padding / variant.

## Preset folders

| Folder            | Use for                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| `title-slides/`   | Opening title slide — see [title-slides/README.md](title-slides/README.md)         |
| `chapter-slides/` | Chapter opener on cover — see [chapter-slides/README.md](chapter-slides/README.md) |
| `content-slides/` | Content slide chrome — see [content-slides/README.md](content-slides/README.md)    |

Files keep `../../design-system/` and `../../assets/` paths so they resolve from `presets/{kind}/`.

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

The showcase swaps placeholder vs brand artwork from the active brand. Leave `<img data-slot="logo">` in the attribution box unchanged (always the Gratia mark).

See [docs/brands.md](../docs/brands.md#logos).
