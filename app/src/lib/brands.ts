import "server-only"

import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import { generateBrandCss, validateBrand } from "./brand-scripts"
import { fetchLogo } from "./logo-dev"
import { toSymbolSprite } from "./svg-sprite"
import {
  BRANDS_DIR,
  DECKS_DIR,
  FIGMA_LIBRARY,
  REPO_ROOT,
  SCRIPTS_DIR,
  assertSlug,
  brandDir,
} from "./repo"

const run = promisify(execFile)

export type LogoSource = {
  provider: "logo.dev"
  domain: string
  /** File in the brand directory. Raster, so not the deck sprite. */
  file: string
  fetchedAt: string
}

export type Brand = {
  name: string
  logo: string
  archived?: boolean
  /** Company domain, set when a logo is pulled from logo.dev. */
  domain?: string
  logoSource?: LogoSource
  colors: Record<string, string>
  fonts: Record<string, string>
  borderRadius: Record<string, string>
  borderSize: Record<string, Record<string, string>>
}

export type BrandSummary = {
  slug: string
  name: string
  archived: boolean
  primary: string
  tertiary: string
  text: string
  deckCount: number
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T
}

export async function listBrandSlugs(): Promise<string[]> {
  const entries = await fs.readdir(BRANDS_DIR, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
}

export async function getBrand(slug: string): Promise<Brand> {
  return readJson<Brand>(path.join(brandDir(slug), "brand.json"))
}

/**
 * Which decks reference a brand. `slides.json` holds the slug, so this is the
 * foreign key check that guards delete.
 */
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

export async function listBrands(): Promise<BrandSummary[]> {
  const slugs = await listBrandSlugs()
  return Promise.all(
    slugs.map(async (slug) => {
      const brand = await getBrand(slug)
      const decks = await decksUsingBrand(slug)
      return {
        slug,
        name: brand.name,
        archived: brand.archived === true,
        primary: brand.colors?.primary ?? "transparent",
        tertiary: brand.colors?.tertiary ?? "transparent",
        text: brand.colors?.text ?? "transparent",
        deckCount: decks.length,
      }
    })
  )
}

export async function getLogoSvg(slug: string): Promise<string | null> {
  const brand = await getBrand(slug)
  try {
    return await fs.readFile(path.join(brandDir(slug), brand.logo), "utf8")
  } catch {
    return null
  }
}

/** The Figma Primitives mode for a brand, if the library cache knows one. */
export async function getFigmaMode(
  name: string
): Promise<{ name: string; modeId: string } | null> {
  try {
    const library = await readJson<{
      collections?: {
        primitives?: { modes?: { name: string; modeId: string }[] }
      }
    }>(FIGMA_LIBRARY)
    const modes = library.collections?.primitives?.modes ?? []
    return modes.find((m) => m.name === name) ?? null
  } catch {
    return null
  }
}

export function checkBrand(slug: string) {
  return validateBrand(brandDir(slug))
}

export type { ValidationResult } from "./brand-scripts"

/**
 * Writes `brand.json` and regenerates `brand.css`. The two are not written
 * atomically — see docs/architecture.md; git is the undo button.
 */
export async function saveBrand(slug: string, brand: Brand): Promise<void> {
  const dir = brandDir(slug)
  await fs.writeFile(
    path.join(dir, "brand.json"),
    `${JSON.stringify(brand, null, "\t")}\n`,
    "utf8"
  )
  await generateBrandCss(dir)
}

export async function setArchived(slug: string, archived: boolean) {
  const brand = await getBrand(slug)
  if (archived) brand.archived = true
  else delete brand.archived
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
  /** True when the asset became the deck sprite, false when it is raster. */
  replacedDeckLogo: boolean
  file: string
}

/**
 * Pulls a logo from logo.dev into the brand directory.
 *
 * SVG (Enterprise plans) becomes the deck sprite. Anything raster is saved
 * alongside as `logoSource` and used in this admin only — a PNG cannot be a
 * `<symbol>` and cannot take slide ink, so repointing `brand.logo` at one
 * would break every deck that uses the brand.
 */
export async function pullLogoFromLogoDev(
  slug: string,
  domain: string,
  options: { theme?: "auto" | "light" | "dark"; currentColor?: boolean } = {}
): Promise<PullLogoResult> {
  const dir = brandDir(slug)
  const brand = await getBrand(slug)

  let asset = await fetchLogo(domain, {
    format: "svg",
    theme: options.theme,
  }).catch(() => null)

  if (asset && !asset.isSvg) asset = null

  if (asset) {
    const file = `${slug}-logo.svg`
    const sprite = toSymbolSprite(
      asset.bytes.toString("utf8"),
      `${slug}-logo`,
      options.currentColor ?? true
    )
    await fs.writeFile(path.join(dir, file), sprite, "utf8")
    brand.logo = file
    brand.domain = domain
    delete brand.logoSource
    await saveBrand(slug, brand)
    return { replacedDeckLogo: true, file }
  }

  const raster = await fetchLogo(domain, {
    format: "png",
    size: 512,
    retina: true,
    theme: options.theme,
  })
  const file = `${slug}-logo-source.png`
  await fs.writeFile(path.join(dir, file), raster.bytes)
  brand.domain = domain
  brand.logoSource = {
    provider: "logo.dev",
    domain,
    file,
    fetchedAt: new Date().toISOString(),
  }
  await saveBrand(slug, brand)
  return { replacedDeckLogo: false, file }
}

export async function getLogoSourceDataUrl(
  slug: string
): Promise<string | null> {
  const brand = await getBrand(slug)
  if (!brand.logoSource) return null
  try {
    const bytes = await fs.readFile(
      path.join(brandDir(slug), brand.logoSource.file)
    )
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
