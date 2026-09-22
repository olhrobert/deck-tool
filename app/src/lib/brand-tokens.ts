/**
 * Flattens `brand-settings.json` into editor rows and mirrors the WCAG pairs
 * in `scripts/validate-brand.js`.
 *
 * Palette entries are rgb/rgba/#rrggbb. Everything else that is a colour is
 * usually a ref (`brand.3`, `semantic.positive`) or `{ "color", "opacity" }`.
 * Refs stay refs on save — only literals are converted out of oklch.
 *
 * No `server-only`: the editor runs these checks in the browser, and save
 * re-runs `validate-brand.js` on disk.
 */

import {
  compositeOn,
  contrastRatio,
  formatColor,
  parseColor,
  type Rgba,
} from "./color.ts"

export type TokenKind = "color" | "ref" | "paint" | "text" | "number" | "boolean"

export type TokenLeaf = {
  path: string
  group: string
  role: string
  kind: TokenKind
  /** Empty when the JSON path is not a single CSS variable name we should invent. */
  cssVars: string[]
}

export const AA_FLOOR = 4.5

const PALETTE_REF =
  /^(?:brand\.[1-6]|chart\.[1-4]|semantic\.(?:neutral|bright|positive|negative|warning|informative))$/

const SKIP = new Set([
  "foundations.basic.archived",
  "foundations.basic.domain",
  "foundations.basic.logoSource",
])

const CANVAS_PAIRS: [string, string, string][] = [
  [
    "components.slide.canvas.foreground.light",
    "components.slide.canvas.background.light",
    "slide canvas light foreground on light background",
  ],
  [
    "components.slide.canvas.foreground.dark",
    "components.slide.canvas.background.dark",
    "slide canvas dark foreground on dark background",
  ],
  [
    "components.slide.surface.foreground",
    "components.slide.surface.background",
    "slide surface foreground on slide surface background",
  ],
]

const PAINT_COMPONENTS = ["card", "callout", "badge", "stamp"] as const

export function getPath(source: unknown, dotted: string): unknown {
  return dotted.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, source)
}

export function setPath<T>(source: T, dotted: string, value: unknown): T {
  const keys = dotted.split(".")
  const root = structuredClone(source) as Record<string, unknown>
  let cursor = root
  for (const key of keys.slice(0, -1)) {
    const next = cursor[key]
    cursor[key] =
      next && typeof next === "object" ? structuredClone(next) : {}
    cursor = cursor[key] as Record<string, unknown>
  }
  cursor[keys[keys.length - 1]] = value
  return root as T
}

export function displayValue(value: unknown): string {
  if (value && typeof value === "object" && "color" in value) {
    const paint = value as { color?: unknown; opacity?: unknown }
    const color = typeof paint.color === "string" ? paint.color : ""
    return typeof paint.opacity === "number" ? `${color} @ ${paint.opacity}` : color
  }
  if (typeof value === "boolean") return value ? "true" : "false"
  if (value === undefined || value === null) return ""
  return String(value)
}

function isLiteral(value: string) {
  return /^(?:rgb|rgba|#)/i.test(value.trim())
}

function kindOf(value: unknown): TokenKind {
  if (typeof value === "number") return "number"
  if (typeof value === "boolean") return "boolean"
  if (value && typeof value === "object" && "color" in value) return "paint"
  if (typeof value === "string" && isLiteral(value)) return "color"
  if (typeof value === "string" && PALETTE_REF.test(value.trim())) return "ref"
  return "text"
}

function groupFor(path: string): string {
  if (path.startsWith("foundations.basic")) return "Identity"
  if (path.startsWith("foundations.color.brand")) return "Palette"
  if (path.startsWith("foundations.color.semantic")) return "Semantic"
  if (path.startsWith("foundations.color.chart")) return "Chart"
  if (path.startsWith("foundations.colorTheme")) return "Theme"
  if (path.startsWith("foundations.tone")) return "Tone"
  if (path.startsWith("foundations.font")) return "Type"
  if (path.startsWith("foundations.border")) return "Border"
  const component = path.match(/^components\.([^.]+)/)
  if (component) return component[1]
  return "Other"
}

function roleFor(path: string): string {
  if (path === "foundations.basic.name") return "Brand name"
  if (path === "foundations.basic.logo") return "Default logo file"
  if (path.startsWith("foundations.color.brand.")) return "Brand palette swatch"
  if (path.startsWith("foundations.color.semantic.")) return "Semantic hue (literal or brand ref)"
  if (path.startsWith("foundations.color.chart.")) return "Chart swatch"
  if (path === "foundations.colorTheme.cover") return "Default theme for cover slides"
  if (path === "foundations.colorTheme.slide") return "Default theme for content slides"
  if (path.startsWith("foundations.tone.")) return "Ink opacity"
  if (path.startsWith("foundations.font.family.")) return "Named font family"
  if (path.startsWith("foundations.font.weight.")) return "Named font weight"
  if (/^foundations\.font\.(title|heading|stat|text|label)\./.test(path)) {
    return "Style role (family + weight names)"
  }
  if (path.startsWith("foundations.border.radius.")) return "Radius step"
  if (path.startsWith("foundations.border.size.")) return "Stroke step"
  if (path.endsWith("canvas.background.light") || path.endsWith("canvas.background.dark")) {
    return "Slide canvas fill"
  }
  if (path.endsWith("canvas.foreground.light") || path.endsWith("canvas.foreground.dark")) {
    return "Ink on the canvas"
  }
  if (path.endsWith("canvas.maxWidth")) return "Slide width cap"
  if (path.endsWith("surface.background")) return "Card and attribution fill"
  if (path.endsWith("surface.foreground")) return "Ink on those panels"
  if (path.includes(".background.")) return "Paint fill (ref or literal)"
  if (path.includes(".foreground.")) return "Paint ink (ref or literal)"
  return path.split(".").slice(-2).join(" · ")
}

function walk(node: unknown, path: string, out: TokenLeaf[]) {
  if (path && SKIP.has(path)) return
  if (node && typeof node === "object" && !Array.isArray(node)) {
    if ("color" in node && typeof (node as { color: unknown }).color === "string") {
      out.push({ path, group: groupFor(path), role: roleFor(path), kind: "paint", cssVars: [] })
      return
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      walk(value, path ? `${path}.${key}` : key, out)
    }
    return
  }
  if (!path) return
  out.push({
    path,
    group: groupFor(path),
    role: roleFor(path),
    kind: kindOf(node),
    cssVars: [],
  })
}

/** Every editable leaf in document order. */
export function leaves(settings: unknown): TokenLeaf[] {
  const out: TokenLeaf[] = []
  walk(settings, "", out)
  return out
}

export function groupsIn(rows: TokenLeaf[]): string[] {
  return Array.from(new Set(rows.map((row) => row.group)))
}

/** Resolve a literal, a palette ref, or `{ color, opacity }` to a color string. */
export function resolveLiteral(settings: unknown, raw: unknown, depth = 0): string | null {
  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (isLiteral(trimmed)) return trimmed
    if (PALETTE_REF.test(trimmed) && depth < 6) {
      const [group, key] = trimmed.split(".")
      return resolveLiteral(
        settings,
        getPath(settings, `foundations.color.${group}.${key}`),
        depth + 1
      )
    }
    return null
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const paint = raw as { color?: unknown; opacity?: unknown }
    if (typeof paint.color !== "string") return null
    const base = resolveLiteral(settings, paint.color, depth + 1)
    const parsed = base ? parseColor(base) : null
    if (!parsed) return null
    const opacity = typeof paint.opacity === "number" ? paint.opacity : 1
    return formatColor({ ...parsed, a: parsed.a * opacity }, "rgba")
  }
  return null
}

function parseResolved(settings: unknown, dotted: string): Rgba | null {
  const lit = resolveLiteral(settings, getPath(settings, dotted))
  return lit ? parseColor(lit) : null
}

export type ContrastHit = {
  label: string
  inkPath: string
  backgroundPath: string
  ratio: number | null
  passes: boolean
}

function hit(
  label: string,
  inkPath: string,
  backgroundPath: string,
  ratio: number | null
): ContrastHit {
  return {
    label,
    inkPath,
    backgroundPath,
    ratio,
    passes: ratio !== null && ratio >= AA_FLOOR,
  }
}

function paintFamilies(settings: unknown, component: string): string[] {
  const foreground = getPath(settings, `components.${component}.foreground`)
  if (!foreground || typeof foreground !== "object" || Array.isArray(foreground)) return []
  const families: string[] = []
  for (const [variant, themes] of Object.entries(foreground as Record<string, unknown>)) {
    if (!themes || typeof themes !== "object" || Array.isArray(themes)) continue
    if ("color" in themes) continue
    for (const theme of Object.keys(themes)) families.push(`${variant}.${theme}`)
  }
  return families
}

/**
 * Same pairs as `validate-brand.js`: both canvas themes, slide surface, then
 * card / callout / badge / stamp foreground on background. Component ink is
 * multiplied by `foundations.tone.strong`. Translucent fills composite onto
 * the matching canvas first.
 */
export function contrastReport(settings: unknown): ContrastHit[] {
  const report: ContrastHit[] = []

  for (const [inkPath, backgroundPath, label] of CANVAS_PAIRS) {
    const ink = parseResolved(settings, inkPath)
    const background = parseResolved(settings, backgroundPath)
    if (!ink || !background) {
      report.push(hit(label, inkPath, backgroundPath, null))
      continue
    }
    const measured = compositeOn(ink, background)
    report.push(hit(label, inkPath, backgroundPath, contrastRatio(measured, background)))
  }

  const tone = getPath(settings, "foundations.tone.strong")
  const toneStrong = typeof tone === "number" ? tone : 1

  for (const component of PAINT_COMPONENTS) {
    for (const family of paintFamilies(settings, component)) {
      const inkPath = `components.${component}.foreground.${family}`
      const backgroundPath = `components.${component}.background.${family}`
      const label = `${inkPath} on background`
      let ink = parseResolved(settings, inkPath)
      const background = parseResolved(settings, backgroundPath)
      if (!ink || !background) {
        report.push(hit(label, inkPath, backgroundPath, null))
        continue
      }
      if (toneStrong < 1) ink = { ...ink, a: ink.a * toneStrong }
      const canvasPath = family.endsWith(".dark")
        ? "components.slide.canvas.background.dark"
        : "components.slide.canvas.background.light"
      const canvas = parseResolved(settings, canvasPath)
      const under =
        background.a < 1 && canvas
          ? canvas
          : background.a < 1
            ? { r: 255, g: 255, b: 255, a: 1 }
            : background
      const fill = compositeOn(background, under)
      const measured = compositeOn(ink, fill)
      report.push(hit(label, inkPath, backgroundPath, contrastRatio(measured, fill)))
    }
  }

  return report
}

/** Parse the paint text field (`brand.2` or `brand.2 @ 0.1`) back into JSON. */
export function parsePaint(raw: string): { color: string; opacity?: number } {
  const match = raw.match(/^(.*?)\s*@\s*([\d.]+)\s*$/)
  if (!match) return { color: raw.trim() }
  return { color: match[1].trim(), opacity: Number(match[2]) }
}
