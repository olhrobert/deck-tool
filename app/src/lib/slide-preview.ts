import "server-only"

import fs from "node:fs/promises"
import path from "node:path"

import { REPO_ROOT, deckDir } from "./repo"

/**
 * Renders one slide the way the compiled deck renders it.
 *
 * A standalone slide file links tokens, components and utilities — but *not*
 * the brand stylesheet or the viewer CSS. `compile-deck.js` adds both when it
 * builds `index.html`, so opening `01.html` directly shows default tokens and
 * unframed slides: the same markup, a different picture. Previews compose the
 * real `viewer/deck.html` template around a single slide so what you see is
 * what compiles.
 *
 * Kept in step with `scripts/compile-deck.js` by using its template and its
 * slide pattern; if that script changes how it assembles a deck, this changes
 * with it.
 */
const SLIDE_PATTERN = /<slide(?:\s[^>]*)?>[\s\S]*?<\/slide>/i

/**
 * Chrome the deck needs and a thumbnail does not, plus the visibility the
 * viewer's JS would otherwise apply by adding `.is-active`.
 *
 * Shown with a rule rather than by injecting `class="is-active"` into the tag:
 * slides carry their own classes (`bg-primary` on a cover), a second `class`
 * attribute is ignored by the parser, and the slide silently loses its fill.
 */
const PREVIEW_STYLE = `
    <style>
      .deck-nav { display: none !important; }
      .deck-viewer > slide { display: flex !important; }
      html, body { overflow: hidden; }
    </style>`

export async function renderSlidePreview(
  slug: string,
  file: string
): Promise<string | null> {
  if (!file.endsWith(".html") || file.includes("/") || file.includes("..")) {
    return null
  }

  const dir = deckDir(slug)

  let html: string
  try {
    html = await fs.readFile(path.join(dir, file), "utf8")
  } catch {
    return null
  }

  const slide = html.match(SLIDE_PATTERN)?.[0]
  if (!slide) return null

  let brand: string | undefined
  try {
    const manifest = JSON.parse(
      await fs.readFile(path.join(dir, "slides.json"), "utf8")
    ) as { brand?: string }
    brand = manifest.brand
  } catch {
    brand = undefined
  }

  const brandStylesheet = brand
    ? `<link\n\t\t\trel="stylesheet"\n\t\t\thref="../../brands/${brand}/brand.css"\n\t\t/>`
    : ""

  const template = await fs.readFile(
    path.join(REPO_ROOT, "viewer", "deck.html"),
    "utf8"
  )

  return template
    .replace("{{deckTitle}}", `${file} preview`)
    .replace("{{brandStylesheet}}", brandStylesheet)
    .replace("{{slides}}", slide)
    .replace("</head>", `${PREVIEW_STYLE}\n\t</head>`)
}
