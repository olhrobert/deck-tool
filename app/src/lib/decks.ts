import "server-only"

import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import { DECKS_DIR, PRESETS_DIR, REPO_ROOT, SCRIPTS_DIR, assertSlug, deckDir } from "./repo"

const exec = promisify(execFile)

/**
 * A deck is a directory of standalone slide HTML files plus `slides.json`.
 *
 * The slide *order lives in the filenames*, not in the manifest:
 * `syncManifest()` in `scripts/compile-deck.js` rewrites `slides.json`'s
 * `slides` array from a numeric-aware sort of the directory on every compile.
 * So reordering means renaming, and this module renumbers rather than trying
 * to persist an order the compiler would throw away.
 */
export type Deck = {
  title: string
  brand?: string
  slides: string[]
  archived?: boolean
}

export type DeckSummary = {
  slug: string
  title: string
  brand?: string
  slideCount: number
  archived: boolean
  compiled: boolean
  /** Compiled output is older than a slide, the manifest or the brand. */
  stale: boolean
}

const SLIDE_MARKER = /<slide[\s>]/i
const EXCLUDED = new Set(["index.html"])

async function readManifest(slug: string): Promise<Deck> {
  const raw = await fs.readFile(path.join(deckDir(slug), "slides.json"), "utf8")
  const manifest = JSON.parse(raw) as Deck
  return { ...manifest, slides: manifest.slides ?? [] }
}

async function writeManifest(slug: string, deck: Deck): Promise<void> {
  await fs.writeFile(
    path.join(deckDir(slug), "slides.json"),
    `${JSON.stringify(deck, null, "\t")}\n`,
    "utf8"
  )
}

/** The slide files on disk, in the order the compiler will read them. */
export async function slideFiles(slug: string): Promise<string[]> {
  const dir = deckDir(slug)
  const entries = await fs.readdir(dir)
  const slides: string[] = []
  for (const name of entries) {
    if (!name.endsWith(".html") || EXCLUDED.has(name)) continue
    const html = await fs.readFile(path.join(dir, name), "utf8")
    if (SLIDE_MARKER.test(html)) slides.push(name)
  }
  return slides.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

export async function listDeckSlugs(): Promise<string[]> {
  const entries = await fs.readdir(DECKS_DIR, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
}

export async function getDeck(slug: string): Promise<Deck> {
  const manifest = await readManifest(slug)
  return { ...manifest, slides: await slideFiles(slug) }
}

async function mtime(file: string): Promise<number | null> {
  try {
    return (await fs.stat(file)).mtimeMs
  } catch {
    return null
  }
}

async function compileState(slug: string, deck: Deck) {
  const dir = deckDir(slug)
  const compiledAt = await mtime(path.join(dir, "index.html"))
  if (compiledAt === null) return { compiled: false, stale: false }

  const sources = [
    path.join(dir, "slides.json"),
    ...deck.slides.map((file) => path.join(dir, file)),
  ]
  if (deck.brand) {
    sources.push(path.join(REPO_ROOT, "brands", deck.brand, "brand.json"))
  }

  const times = await Promise.all(sources.map(mtime))
  const newest = Math.max(...times.filter((t): t is number => t !== null))
  return { compiled: true, stale: newest > compiledAt }
}

export async function listDecks(): Promise<DeckSummary[]> {
  const slugs = await listDeckSlugs()
  return Promise.all(
    slugs.map(async (slug) => {
      const deck = await getDeck(slug)
      const { compiled, stale } = await compileState(slug, deck)
      return {
        slug,
        title: deck.title,
        brand: deck.brand,
        slideCount: deck.slides.length,
        archived: deck.archived === true,
        compiled,
        stale,
      }
    })
  )
}

export async function getDeckState(slug: string) {
  const deck = await getDeck(slug)
  return { deck, ...(await compileState(slug, deck)) }
}

// ── presets ────────────────────────────────────────────────────────────────

export type Preset = {
  group: string
  file: string
  relativePath: string
  /**
   * Only `deck-titles/*` are whole slides. The card and footer presets are
   * fragments meant to be pasted inside a slide, so they cannot be added as
   * one — `compile-deck.js` would find no `<slide>` in them.
   */
  kind: "slide" | "fragment"
}

export async function listPresets(): Promise<Preset[]> {
  const groups = await fs.readdir(PRESETS_DIR, { withFileTypes: true })
  const presets: Preset[] = []
  for (const group of groups) {
    if (!group.isDirectory()) continue
    const files = await fs.readdir(path.join(PRESETS_DIR, group.name))
    for (const file of files.filter((f) => f.endsWith(".html")).sort()) {
      const relativePath = path.join(group.name, file)
      const html = await fs.readFile(path.join(PRESETS_DIR, relativePath), "utf8")
      presets.push({
        group: group.name,
        file,
        relativePath,
        kind: SLIDE_MARKER.test(html) ? "slide" : "fragment",
      })
    }
  }
  return presets
}

// ── mutation ───────────────────────────────────────────────────────────────

const slideName = (index: number) => `${String(index + 1).padStart(2, "0")}.html`

/**
 * Renames every slide to its position. Two passes through temporary names,
 * because renaming into a sequence that still exists collides.
 */
async function renumber(slug: string, ordered: string[]): Promise<void> {
  const dir = deckDir(slug)
  const staged = ordered.map((file, index) => ({
    from: file,
    temp: `.reorder-${index}.html`,
    to: slideName(index),
  }))

  for (const { from, temp } of staged) {
    await fs.rename(path.join(dir, from), path.join(dir, temp))
  }
  for (const { temp, to } of staged) {
    await fs.rename(path.join(dir, temp), path.join(dir, to))
  }
}

export async function saveDeck(
  slug: string,
  edits: { title: string; brand?: string; order?: string[] }
): Promise<void> {
  const deck = await getDeck(slug)

  if (edits.order && edits.order.join() !== deck.slides.join()) {
    const known = new Set(deck.slides)
    if (edits.order.length !== deck.slides.length || edits.order.some((f) => !known.has(f))) {
      throw new Error("The slide order does not match the files on disk.")
    }
    await renumber(slug, edits.order)
  }

  const next: Deck = {
    ...deck,
    title: edits.title.trim(),
    slides: await slideFiles(slug),
  }
  if (edits.brand) next.brand = edits.brand
  else delete next.brand

  await writeManifest(slug, next)
}

export async function addSlideFromPreset(
  slug: string,
  presetRelativePath: string
): Promise<string> {
  if (presetRelativePath.includes("..") || path.isAbsolute(presetRelativePath)) {
    throw new Error(`Invalid preset: ${presetRelativePath}`)
  }
  const source = path.join(PRESETS_DIR, presetRelativePath)
  const html = await fs.readFile(source, "utf8")
  if (!SLIDE_MARKER.test(html)) {
    throw new Error(`${presetRelativePath} contains no <slide> to add.`)
  }

  const existing = await slideFiles(slug)
  const file = slideName(existing.length)
  await fs.writeFile(path.join(deckDir(slug), file), html, "utf8")
  return file
}

export async function removeSlide(slug: string, file: string): Promise<void> {
  const existing = await slideFiles(slug)
  if (!existing.includes(file)) throw new Error(`${file} is not a slide in this deck.`)
  if (existing.length === 1) {
    throw new Error("A deck needs at least one slide. Delete the deck instead.")
  }
  await fs.rm(path.join(deckDir(slug), file))
  await renumber(slug, existing.filter((f) => f !== file))
  await writeManifest(slug, { ...(await getDeck(slug)) })
}

export async function setDeckArchived(slug: string, archived: boolean) {
  const deck = await getDeck(slug)
  if (archived) deck.archived = true
  else delete deck.archived
  await writeManifest(slug, deck)
}

export async function deleteDeck(slug: string): Promise<void> {
  await fs.rm(deckDir(slug), { recursive: true, force: true })
}

export async function createDeck(
  slug: string,
  title: string,
  brand: string | undefined,
  presetRelativePath: string
): Promise<void> {
  assertSlug(slug)
  const slugs = await listDeckSlugs()
  if (slugs.includes(slug)) throw new Error(`A deck called "${slug}" already exists.`)

  const dir = deckDir(slug)
  await fs.mkdir(dir, { recursive: true })
  await writeManifest(slug, { title: title.trim(), ...(brand ? { brand } : {}), slides: [] })
  await addSlideFromPreset(slug, presetRelativePath)
  await writeManifest(slug, {
    title: title.trim(),
    ...(brand ? { brand } : {}),
    slides: await slideFiles(slug),
  })
}

/**
 * Runs `scripts/compile-deck.js`, which also regenerates the brand CSS and
 * rewrites `slides.json` from the directory. Same reasoning as the brand
 * scripts: the file on disk stays authoritative, so it runs as a child process
 * rather than an import.
 */
export async function compileDeck(slug: string): Promise<string> {
  assertSlug(slug)
  try {
    const { stdout } = await exec(
      process.execPath,
      [path.join(SCRIPTS_DIR, "compile-deck.js"), path.join("decks", slug)],
      { cwd: REPO_ROOT }
    )
    return stdout.trim()
  } catch (error) {
    const e = error as { stderr?: string; message?: string }
    throw new Error(e.stderr?.trim() || e.message || "compile-deck.js failed.")
  }
}
