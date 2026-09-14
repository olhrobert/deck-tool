# DeckTool

HTML/CSS design system for presentation slides, with brand token overrides and a browser showcase.

HTML is the source of truth. Brands only override tokens.

## Pieces

| Block | Role |
| --- | --- |
| Brand tokens | `brands/{slug}/brand-settings.json` overrides color, type, semantic spacing, radius, and stroke. `brand.css` is generated. |
| Component set | Custom HTML elements in `design-system/components/` (Slide, Card, Slide Title, …). |
| Slide presets | Layout examples in `presets/` (title, chapter, content). Loaded live by the showcase. |
| Showcase | [`design-system/showcase/showcase.html`](design-system/showcase/showcase.html) — work on components and slide layouts in the browser, with a brand switcher. |
| Agent skills | `.cursor/skills/` — `new-brand`, `attribution-box`. |

## Project structure

```
assets/           fonts, icons, logos
brands/           brand-settings.json + generated brand.css + {slug}-logo.svg + {slug}-logo-inverted.svg
design-system/    tokens, components, utilities, showcase/
presets/          slide layout examples (title, chapter, content)
scripts/          brand CSS generation, validation, icon CSS (Node)
docs/             design-system documentation
.cursor/skills/   agent skills: new-brand, attribution-box
```

## Quick start

Serve the repo and open the showcase:

```bash
npm run showcase
```

Then open [http://localhost:8080/design-system/showcase/showcase.html](http://localhost:8080/design-system/showcase/showcase.html).

New brand: `npm run new-brand -- acme --name "Acme Capital"` then [docs/brands.md](docs/brands.md).

See [docs/overview.md](docs/overview.md), [docs/brands.md](docs/brands.md), [docs/scripts.md](docs/scripts.md), and [AGENTS.md](AGENTS.md).
