/**
 * Colour parsing, conversion and contrast for the brand editor.
 *
 * Two contracts this module exists to keep:
 *
 * 1. **What can be written to `brand.json`.** `parseColor()` in
 *    `scripts/validate-brand.js` accepts `rgb()`, `rgba()` and 6-digit
 *    `#rrggbb` only. oklch is an *editing* space here — you can read and type
 *    it, and `toBrandValue` converts it back before anything reaches disk.
 * 2. **Contrast has to agree with the validator**, or the number in the UI and
 *    the number that fails the save are different numbers. `contrastRatio`
 *    and `compositeOn` mirror `validate-brand.js` exactly, including the fact
 *    that only the text-on-surface check composites first.
 *
 * No imports: pure, and runnable under `node --experimental-strip-types`.
 */

export type Rgba = { r: number; g: number; b: number; a: number }
export type ColorFormat = "hex" | "rgb" | "rgba" | "oklch"

export const COLOR_FORMATS: ColorFormat[] = ["hex", "rgb", "rgba", "oklch"]

/** Formats `brand.json` is allowed to contain. */
export const WRITABLE_FORMATS: ColorFormat[] = ["hex", "rgb", "rgba"]

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const round = (n: number, places = 0) => {
  const f = 10 ** places
  return Math.round(n * f) / f
}

// ── parsing ────────────────────────────────────────────────────────────────

export function parseColor(value: string): Rgba | null {
  const input = value.trim()

  const rgb = input.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  )
  if (rgb) {
    return {
      r: clamp(Number(rgb[1]), 0, 255),
      g: clamp(Number(rgb[2]), 0, 255),
      b: clamp(Number(rgb[3]), 0, 255),
      a: rgb[4] === undefined ? 1 : clamp(Number(rgb[4]), 0, 1),
    }
  }

  const hex6 = input.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i)
  if (hex6) {
    const n = parseInt(hex6[1], 16)
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255,
      a: hex6[2] ? parseInt(hex6[2], 16) / 255 : 1,
    }
  }

  const hex3 = input.match(/^#([0-9a-f]{3})$/i)
  if (hex3) {
    const [r, g, b] = hex3[1].split("")
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
      a: 1,
    }
  }

  const oklch = input.match(
    /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+)%?)?\s*\)$/i
  )
  if (oklch) {
    const lRaw = Number(oklch[1])
    const l = input.includes("%") && lRaw > 1 ? lRaw / 100 : lRaw
    const alphaRaw = oklch[4]
    const a =
      alphaRaw === undefined
        ? 1
        : clamp(Number(alphaRaw) > 1 ? Number(alphaRaw) / 100 : Number(alphaRaw), 0, 1)
    return oklchToRgba(l, Number(oklch[2]), Number(oklch[3]), a)
  }

  return null
}

// ── formatting ─────────────────────────────────────────────────────────────

export function formatColor(c: Rgba, format: ColorFormat): string {
  const r = Math.round(c.r)
  const g = Math.round(c.g)
  const b = Math.round(c.b)

  switch (format) {
    case "hex": {
      const hex = (n: number) => n.toString(16).padStart(2, "0")
      return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase()
    }
    case "rgb":
      return `rgb(${r}, ${g}, ${b})`
    case "rgba":
      return `rgba(${r}, ${g}, ${b}, ${round(c.a, 3)})`
    case "oklch": {
      const [l, chroma, hue] = rgbaToOklch(c)
      const base = `oklch(${round(l, 4)} ${round(chroma, 4)} ${round(hue, 2)}`
      return c.a < 1 ? `${base} / ${round(c.a, 3)})` : `${base})`
    }
  }
}

/**
 * The value to persist. hex loses alpha, so a translucent colour is written as
 * rgba even when the editor is showing hex; oklch is never written at all.
 */
export function toBrandValue(c: Rgba, preferred: ColorFormat): string {
  if (preferred === "oklch") return formatColor(c, c.a < 1 ? "rgba" : "rgb")
  if (preferred === "hex" && c.a < 1) return formatColor(c, "rgba")
  return formatColor(c, preferred)
}

/** True when the string is something `validate-brand.js` can parse. */
export function isWritableValue(value: string): boolean {
  const input = value.trim()
  return (
    /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(input) ||
    /^#[0-9a-f]{6}$/i.test(input)
  )
}

// ── contrast — mirrors scripts/validate-brand.js ───────────────────────────

const linearise = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

export function relativeLuminance(c: Rgba): number {
  return (
    0.2126 * linearise(c.r / 255) +
    0.7152 * linearise(c.g / 255) +
    0.0722 * linearise(c.b / 255)
  )
}

export function compositeOn(fg: Rgba, bg: Rgba): Rgba {
  if (fg.a >= 1) return fg
  const a = fg.a
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  }
}

export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

// ── HSL, for the sliders ───────────────────────────────────────────────────

export type Hsl = { h: number; s: number; l: number }

export function rgbaToHsl(c: Rgba): Hsl {
  const r = c.r / 255
  const g = c.g / 255
  const b = c.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function hslToRgba({ h, s, l }: Hsl, alpha = 1): Rgba {
  const sN = s / 100
  const lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lN - c / 2
  const sector = Math.floor(((h % 360) + 360) % 360 / 60)
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a: alpha,
  }
}

// ── OKLCH ──────────────────────────────────────────────────────────────────

const gamma = (channel: number) =>
  channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055

export function oklchToRgba(l: number, c: number, hDeg: number, a = 1): Rgba {
  const h = (hDeg * Math.PI) / 180
  const aLab = c * Math.cos(h)
  const bLab = c * Math.sin(h)

  const lp = l + 0.3963377774 * aLab + 0.2158037573 * bLab
  const mp = l - 0.1055613458 * aLab - 0.0638541728 * bLab
  const sp = l - 0.0894841775 * aLab - 1.291485548 * bLab

  const lc = lp ** 3
  const mc = mp ** 3
  const sc = sp ** 3

  const r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc
  const g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc
  const b = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc

  return {
    r: clamp(Math.round(gamma(r) * 255), 0, 255),
    g: clamp(Math.round(gamma(g) * 255), 0, 255),
    b: clamp(Math.round(gamma(b) * 255), 0, 255),
    a,
  }
}

export function rgbaToOklch(colour: Rgba): [number, number, number] {
  const lr = linearise(colour.r / 255)
  const lg = linearise(colour.g / 255)
  const lb = linearise(colour.b / 255)

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  const chroma = Math.sqrt(a * a + b * b)
  let hue = (Math.atan2(b, a) * 180) / Math.PI
  if (hue < 0) hue += 360

  return [L, chroma, chroma < 1e-6 ? 0 : hue]
}
