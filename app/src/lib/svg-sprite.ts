/**
 * Rewrites a standalone SVG into the sprite shape the decks expect:
 * `<svg><symbol id="{slug}-logo" viewBox="…">…</symbol></svg>`, which is what
 * `<use href="#{slug}-logo">` in a slide resolves against.
 *
 * No imports on purpose — it is pure string work and can be run directly with
 * `node --experimental-strip-types`.
 */
export function toSymbolSprite(
  svg: string,
  symbolId: string,
  currentColor: boolean
): string {
  const cleaned = svg
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim()

  const open = cleaned.match(/<svg\b([^>]*)>/i)
  if (!open || open.index === undefined) {
    throw new Error("The downloaded file is not an SVG.")
  }

  const attrs = open[1]
  const viewBox =
    attrs.match(/viewBox="([^"]+)"/i)?.[1] ??
    (() => {
      const w = attrs.match(/\bwidth="([\d.]+)/i)?.[1]
      const h = attrs.match(/\bheight="([\d.]+)/i)?.[1]
      return w && h ? `0 0 ${w} ${h}` : null
    })()
  if (!viewBox) throw new Error("The SVG has no viewBox to carry into a symbol.")

  const close = cleaned.lastIndexOf("</svg>")
  if (close === -1) throw new Error("The SVG has no closing tag.")

  let inner = cleaned.slice(open.index + open[0].length, close).trim()

  // Decks render logos in slide ink, so brand colours in the mark are replaced
  // unless the caller asks to keep them. `fill="none"` is structural and stays.
  if (currentColor) {
    inner = inner
      .replace(/fill="(?!none")[^"]*"/gi, 'fill="currentColor"')
      .replace(/stroke="(?!none")[^"]*"/gi, 'stroke="currentColor"')
  }

  return `<svg xmlns="http://www.w3.org/2000/svg">\n\t<symbol id="${symbolId}" viewBox="${viewBox}">\n\t\t${inner}\n\t</symbol>\n</svg>\n`
}
