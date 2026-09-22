import "server-only"

import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import { parseColor, toBrandValue } from "./color"
import { generateBrandCss, validateBrand, type ValidationResult } from "./brand-scripts"
import { fetchLogo } from "./logo-dev"
import { toSymbolSprite } from "./svg-sprite"
import {
  BRANDS_DIR,
  DECKS_DIR,
  REPO_ROOT,
  SCRIPTS_DIR,
  assertSlug,
  brandDir,
} from "./repo"

const run = promisify(execFile)
const BRAND_FILENAME = "brand-settings.json"

export type LogoSource = {
  provider: "logo.dev"
  domain: string
  /** File in the brand directory. Raster, so not a slide logo. */
  file: string
  fetchedAt: string
}

export type Brand = {
  foundations: {
    basic: {
      name: string
      logo?: string
      archived?: boolean
      domain?: string
      logoSource?: LogoSource
    }
    color?: {
      brand?: Record<string, string>
      semantic?: Record<string, string>
      chart?: Record<string, string>
    }
    colorTheme?: { cover?: string; slide?: string }
    tone?: Record<string, number>
    font?: Record<string, unknown>
    border?: Record<string, unknown>
  }
  components?: Record<string, unknown>
}

export type BrandSummary = {
  slug: string
  name: string
  archived: boolean
  swatches: { label: string; value: string }[]
  deckCount: number
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T
}

function serialize(brand: Brand) {
  return `${JSON.stringify(brand, null, "\t")}\n`
}

/**
 * oklch is an editing space. Palette literals are stored as rgb/rgba/#rrggbb.
 * Refs (`brand.3`, `semantic.positive`) are left alone.
 */
export function normaliseBrand(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!/^(?:#|rgb|rgba|oklch)/i.test(trimmed)) return value
    const parsed = parseColor(trimmed)
    if (!parsed) return value
    const preferred = trimmed.startsWith("#")
      ? "hex"
      : trimmed.startsWith("rgba")
        ? "rgba"
        : trimmed.startsWith("oklch")
          ? "oklch"
          : "rgb"
    return toBrandValue(parsed, preferred)
  }
  if (Array.isArray(value)) return value.map(normaliseBrand)
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      out[key] = normaliseBrand(child)
    }
    return out
  }
  return value
}

export async function listBrandSlugs(): Promise<string[]> {
  const entries = await fs.readdir(BRANDS_DIR, { withFileTypes: true })
  const slugs: string[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    try {
      await fs.access(path.join(BRANDS_DIR, entry.name, BRAND_FILENAME))
      slugs.push(entry.name)
    } catch {
      // A directory without brand-settings.json is not a brand.
    }
  }
  return slugs.sort()
}

export async function getBrand(slug: string): Promise<Brand> {
  return readJson<Brand>(path.join(brandDir(slug), BRAND_FILENAME))
}

export async function decksUsingBrand(
  slug: string
): Promise<{ slug: string; title: string }[]> {
  assertSlug(slug)
  let entries
  try {
    entries = await fs.readdir(DECKS_DIR, { withFileTypes: true })
  } catch {
    return []
  }

  const used: { slug: string; title: string }[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    try {
      const deck = await readJson<{ brand?: string; title?: string }>(
        path.join(DECKS_DIR, entry.name, "slides.json")
      )
      if (deck.brand === slug) {
        used.push({ slug: entry.name, title: deck.title ?? entry.name })
      }
    } catch {
      // A deck without a readable slides.json cannot reference anything.
    }
  }
  return used
}

function swatchesOf(brand: Brand): { label: string; value: string }[] {
  const palette = brand.foundations.color?.brand ?? {}
  return ["1", "2", "3"]
    .filter((key) => typeof palette[key] === "string")
    .map((key) => ({ label: `Brand ${key}`, value: palette[key] }))
}

export async function listBrands(): Promise<BrandSummary[]> {
  const slugs = await listBrandSlugs()
  return Promise.all(
    slugs.map(async (slug) => {
      const brand = await getBrand(slug)
      const decks = await decksUsingBrand(slug)
      return {
        slug,
        name: brand.foundations.basic.name,
        archived: brand.foundations.basic.archived === true,
        swatches: swatchesOf(brand),
        deckCount: decks.length,
      }
    })
  )
}

export async function getLogoSvg(slug: string): Promise<string | null> {
  const brand = await getBrand(slug)
  const file = brand.foundations.basic.logo
  if (!file) return null
  try {
    return await fs.readFile(path.join(brandDir(slug), file), "utf8")
  } catch {
    return null
  }
}

export function checkBrand(slug: string) {
  return validateBrand(brandDir(slug))
}

export type { ValidationResult }

/**
 * Runs the real validator against a copy of the brand directory so a failing
 * draft is not written first. The temp directory's basename is not the slug;
 * logo checks use `foundations.basic.logo`, which the copy still contains.
 */
export async function validateDraft(slug: string, brand: Brand): Promise<ValidationResult> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "decktool-brand-"))
  try {
    await fs.cp(brandDir(slug), dir, { recursive: true })
    await fs.writeFile(path.join(dir, BRAND_FILENAME), serialize(brand), "utf8")
    return validateBrand(dir)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
}

/**
 * Writes `brand-settings.json` and regenerates `brand.css`. The two are not
 * written atomically — git is the undo button.
 */
export async function saveBrand(slug: string, brand: Brand): Promise<void> {
  const dir = brandDir(slug)
  await fs.writeFile(path.join(dir, BRAND_FILENAME), serialize(brand), "utf8")
  await generateBrandCss(dir)
}

export async function setArchived(slug: string, archived: boolean) {
  const brand = await getBrand(slug)
  if (archived) brand.foundations.basic.archived = true
  else delete brand.foundations.basic.archived
  await saveBrand(slug, brand)
}

export async function deleteBrand(slug: string): Promise<void> {
  const decks = await decksUsingBrand(slug)
  if (decks.length > 0) {
    throw new Error(
      `${decks.length} deck${decks.length === 1 ? " still uses" : "s still use"} this brand: ${decks
        .map((d) => d.title)
        .join(", ")}. Archive it instead.`
    )
  }
  await fs.rm(brandDir(slug), { recursive: true, force: true })
}

export type PullLogoResult = {
  /** True when the SVG replaced the default logo file. */
  replacedDeckLogo: boolean
  file: string
}

/**
 * Pulls a logo from logo.dev into the brand directory.
 *
 * SVG is written as the default logo file (`foundations.basic.logo`). Raster
 * is stored alongside as `logoSource` — a PNG is not a slide lockup. The
 * inverted file is left as-is; replace that by hand.
 */
export async function pullLogoFromLogoDev(
  slug: string,
  domain: string,
  options: { theme?: "auto" | "light" | "dark"; currentColor?: boolean } = {}
): Promise<PullLogoResult> {
  const dir = brandDir(slug)
  const brand = await getBrand(slug)
  const logoFile = brand.foundations.basic.logo || `${slug}-logo.svg`

  let asset = await fetchLogo(domain, {
    format: "svg",
    theme: options.theme,
  }).catch(() => null)

  if (asset && !asset.isSvg) asset = null

  if (asset) {
    const svg = options.currentColor
      ? toSymbolSprite(asset.bytes.toString("utf8"), `${slug}-logo`, true)
      : asset.bytes
    await fs.writeFile(path.join(dir, logoFile), svg)
    brand.foundations.basic.logo = logoFile
    brand.foundations.basic.domain = domain
    delete brand.foundations.basic.logoSource
    await saveBrand(slug, brand)
    return { replacedDeckLogo: true, file: logoFile }
  }

  const raster = await fetchLogo(domain, {
    format: "png",
    size: 512,
    retina: true,
    theme: options.theme,
  })
  const file = `${slug}-logo-source.png`
  await fs.writeFile(path.join(dir, file), raster.bytes)
  brand.foundations.basic.domain = domain
  brand.foundations.basic.logoSource = {
    provider: "logo.dev",
    domain,
    file,
    fetchedAt: new Date().toISOString(),
  }
  await saveBrand(slug, brand)
  return { replacedDeckLogo: false, file }
}

export async function getLogoSourceDataUrl(slug: string): Promise<string | null> {
  const brand = await getBrand(slug)
  const source = brand.foundations.basic.logoSource
  if (!source) return null
  try {
    const bytes = await fs.readFile(path.join(brandDir(slug), source.file))
    return `data:image/png;base64,${bytes.toString("base64")}`
  } catch {
    return null
  }
}

export async function createBrand(slug: string, name: string): Promise<void> {
  assertSlug(slug)
  const slugs = await listBrandSlugs()
  if (slugs.includes(slug)) {
    throw new Error(`A brand called "${slug}" already exists.`)
  }
  await run(
    process.execPath,
    [path.join(SCRIPTS_DIR, "new-brand.js"), slug, "--name", name],
    { cwd: REPO_ROOT }
  )
}
