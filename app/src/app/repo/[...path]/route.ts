import fs from "node:fs/promises"
import path from "node:path"

import { REPO_ROOT } from "~/lib/repo"
import { renderSlidePreview } from "~/lib/slide-preview"

/**
 * Read-only static serving of the repo working tree, so slide previews can use
 * the real files. A compiled deck links `../../design-system/tokens/index.css`
 * and `../../brands/<slug>/brand.css`; serving the tree verbatim means the
 * preview is the artifact rather than a reconstruction of it.
 *
 * GET only, and only from directories a deck can legitimately reference —
 * `app/`, `.git/`, `node_modules/` and anything else stay unreachable.
 */
const SERVABLE = new Set([
  "decks",
  "brands",
  "design-system",
  "presets",
  "assets",
  "viewer",
])

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params

  if (segments.length === 0 || !SERVABLE.has(segments[0])) {
    return new Response("Not found", { status: 404 })
  }

  // `?as=slide` composes the slide into the viewer template instead of serving
  // the bare file, so a preview matches the compiled deck. The URL keeps its
  // depth, which is what makes the template's `../../` links resolve.
  if (
    new URL(request.url).searchParams.get("as") === "slide" &&
    segments[0] === "decks" &&
    segments.length === 3
  ) {
    const preview = await renderSlidePreview(segments[1], segments[2])
    if (!preview) return new Response("Not found", { status: 404 })
    return new Response(preview, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  }

  const target = path.resolve(REPO_ROOT, ...segments)
  // resolve() has already collapsed any `..`; this is the check that it did
  // not climb out of the tree.
  if (!target.startsWith(REPO_ROOT + path.sep)) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const file = await fs.readFile(target)
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type":
          CONTENT_TYPES[path.extname(target).toLowerCase()] ??
          "application/octet-stream",
        // The tree changes under the app; a cached preview is a wrong preview.
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
