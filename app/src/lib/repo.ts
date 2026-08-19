import "server-only"

import path from "node:path"

/**
 * The app is a front end for the repository working tree, so every path is
 * built from the repo root. `process.cwd()` is the `app/` directory under both
 * `next dev` and `next start`. Nothing outside this module should compute `..`.
 */
export const REPO_ROOT = path.resolve(process.cwd(), "..")

export const BRANDS_DIR = path.join(REPO_ROOT, "brands")
export const DECKS_DIR = path.join(REPO_ROOT, "decks")
export const PRESETS_DIR = path.join(REPO_ROOT, "presets")
export const SCRIPTS_DIR = path.join(REPO_ROOT, "scripts")
export const FIGMA_LIBRARY = path.join(REPO_ROOT, "figma", "library.json")

const SLUG = /^[a-z0-9][a-z0-9-]*$/

export function isValidSlug(slug: string) {
  return SLUG.test(slug)
}

/**
 * Slugs arrive from route params and form input and are used as directory
 * names. Anything that is not a plain slug is rejected rather than sanitised —
 * there is no correct interpretation of `../../etc`.
 */
export function assertSlug(slug: string): string {
  if (!isValidSlug(slug)) {
    throw new Error(
      `Invalid slug "${slug}". Use lowercase letters, numbers and hyphens.`
    )
  }
  return slug
}

export function brandDir(slug: string) {
  return path.join(BRANDS_DIR, assertSlug(slug))
}

export function deckDir(slug: string) {
  return path.join(DECKS_DIR, assertSlug(slug))
}
