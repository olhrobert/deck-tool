---
name: create-deck
description: >-
  Create a DeckTool deck under decks/{slug}/ from existing presets and
  components. Use when the user asks for a new deck, talk, presentation,
  or filled-in slides for a brand.
---

# Create deck

A deck is a real talk: filled-in slides for one brand. Presets stay the library; decks are the assembled artifact. Read `docs/decks.md` for the on-disk contract.

## 1. Ask before building

**Stop and ask** if any of these are missing. Do not invent a slug, brand, or slide plan.

| Required | Notes |
| --- | --- |
| **Deck title** | Display name (e.g. `Gratia Surge Team`) |
| **Brand** | Must match a directory under `brands/` with `brand-settings.json` |
| **Slides** | Count + intent per slide (cover, chapter, content, close), or a wireframe / outline with copy |

Also ask when useful (do not block if the user already answered via brief/wireframe):

| Optional | Default if omitted |
| --- | --- |
| **Slug** | Derive from title: lowercase, hyphens (`gratia-surge-team`) |
| **Starting presets** | Pick from sidecar `use_when` / `not_when` |
| **Include brand slides** | Drop-in from `presets/brands/{slug}/` as-is — do not rewrite their copy |

Confirm the slug does not already exist under `decks/`.

## 2. Pick presets

1. Read preset `.md` sidecars next to the HTML (`use_when` / `not_when`).
2. Prefer the closest layout preset over inventing structure.
3. Brand slides (`presets/brands/{slug}/`, `intent: brand`) — copy as-is; rewrite `../../../` asset paths to `../../` when they land in the deck.
4. Layout presets (`intent: layout`) — copy structure, replace placeholder copy with the talk.

If no preset matches a slide, **compose from existing components** (`card`, `callout`, `stack`, `divider`, `slide-title-*`, etc.). Do not add new components, tokens, or utilities for a one-off deck. If the layout should become reusable, say so and offer a new preset instead of burying it only in the deck.

## 3. Write files

```
decks/{slug}/
  slides.json
  01.html
  02.html
  …
```

`slides.json`:

```json
{
  "title": "Deck title",
  "brand": "gratia",
  "slides": ["01.html", "02.html"]
}
```

Each `{nn}.html`:

- One `<slide>…</slide>` (use `kind="cover"` on title/chapter covers).
- Stylesheet links at `../../design-system/` and `../../assets/` (same depth as `presets/{kind}/`).
- Keep `<img data-logo>` on placeholder logos; leave attribution `<img data-slot="logo">` as Gratia.
- Content slides: keep `<slide-footer>` inside `<footer-container>`; set deck title, chapter, and page number.
- Title covers: omit `attribution` unless overriding `components.attributionBox.default`.

Slide **order is the filenames** (`01.html`, `02.html`, …). Reordering means renumbering.

## 4. Compile

```bash
npm run compile-deck -- decks/{slug}
```

Do not hand-edit `index.html`. Do not start the showcase server or open the browser for QA — tell the user the path and stop.

## 5. Do not

- Build without required title, brand, and slide plan
- Invent components or brand tokens for a deck
- Rewrite brand-slide copy
- Put decks under `presets/`
- Skip compile after writing slides
- Visually QA in the browser (user does that)

## Related

- Contract and admin: `docs/decks.md`
- Preset catalog: `presets/README.md` and folder READMEs
- Component axes: `docs/components.md`
- Attribution box: `.cursor/skills/attribution-box/SKILL.md`
- New brand first: `.cursor/skills/new-brand/SKILL.md`
