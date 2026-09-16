# Brand slides

Finished slides for one brand. Drop them into that brand’s decks as-is. Do not rewrite the copy.

Layout starting points live in `presets/title-slides/`, `chapter-slides/`, and `content-slides/`. Token overrides stay in `brands/{slug}/` — this folder is content, not a design-system fork.

| Folder     | Brand  | Slides                                      |
| ---------- | ------ | ------------------------------------------- |
| `gratia/`  | Gratia | `fundraising.html`, `about.html`, `services.html`, `contact.html` |

Each slide has a sibling `.md` with `intent: brand` and `brand: {slug}`. The showcase shows the group only when that brand is selected.

Files keep `../../../design-system/` and `../../../assets/` paths so they resolve from `presets/brands/{slug}/`.
