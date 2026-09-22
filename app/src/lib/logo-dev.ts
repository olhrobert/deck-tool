import "server-only"

/**
 * logo.dev — company logos by domain, plus a name-to-domain search.
 *
 * Two keys, two jobs:
 *   LOGO_DEV_PUBLISHABLE_KEY (pk_…)  image URLs; designed to be public
 *   LOGO_DEV_SECRET_KEY      (sk_…)  the search API; server only, never sent
 *                                    to the client
 *
 * Both live in .env.local — see .env.example. Neither is required for the rest
 * of the app to work; every entry point here degrades to "not configured".
 */

const SEARCH_ENDPOINT = "https://api.logo.dev/search"
const IMAGE_ENDPOINT = "https://img.logo.dev"

export type LogoDevMatch = {
  name: string
  domain: string
}

export type LogoDevConfig = {
  search: boolean
  images: boolean
}

export function logoDevConfig(): LogoDevConfig {
  return {
    search: Boolean(process.env.LOGO_DEV_SECRET_KEY),
    images: Boolean(process.env.LOGO_DEV_PUBLISHABLE_KEY),
  }
}

export type LogoImageOptions = {
  size?: number
  /** `auto` keeps the logo's own colours; light/dark adapt a transparent mark. */
  theme?: "auto" | "light" | "dark"
  format?: "png" | "jpg" | "webp" | "svg"
  greyscale?: boolean
  retina?: boolean
  /** `404` fails loudly instead of returning a monogram of the first letter. */
  fallback?: "monogram" | "404"
}

/**
 * The publishable key is meant to sit in an <img src>, so this URL is safe to
 * hand to the browser. Returns null when the key is missing rather than
 * building a URL that would 401.
 */
export function logoImageUrl(
  domain: string,
  options: LogoImageOptions = {}
): string | null {
  const token = process.env.LOGO_DEV_PUBLISHABLE_KEY
  if (!token) return null

  const url = new URL(`${IMAGE_ENDPOINT}/${encodeURIComponent(domain)}`)
  url.searchParams.set("token", token)
  if (options.size) url.searchParams.set("size", String(options.size))
  if (options.theme) url.searchParams.set("theme", options.theme)
  if (options.format) url.searchParams.set("format", options.format)
  if (options.greyscale) url.searchParams.set("greyscale", "true")
  if (options.retina) url.searchParams.set("retina", "true")
  if (options.fallback) url.searchParams.set("fallback", options.fallback)
  return url.toString()
}

/** Name → domain. Needs the secret key; works on every plan including free. */
export async function searchBrands(query: string): Promise<LogoDevMatch[]> {
  const key = process.env.LOGO_DEV_SECRET_KEY
  if (!key) throw new Error("LOGO_DEV_SECRET_KEY is not set. See .env.example.")

  const url = new URL(SEARCH_ENDPOINT)
  url.searchParams.set("q", query)
  url.searchParams.set("strategy", "match")

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(
      `logo.dev search failed: ${response.status} ${response.statusText}`
    )
  }

  const results = (await response.json()) as LogoDevMatch[]
  return results.map(({ name, domain }) => ({ name, domain }))
}

export type FetchedLogo = {
  bytes: Buffer
  contentType: string
  isSvg: boolean
}

/**
 * Downloads the logo server-side so it lands in the repo rather than staying a
 * hotlink. `fallback: "404"` by default — a monogram of the first letter is
 * not a brand logo and should not be written to disk silently.
 */
export async function fetchLogo(
  domain: string,
  options: LogoImageOptions = {}
): Promise<FetchedLogo> {
  const url = logoImageUrl(domain, { fallback: "404", ...options })
  if (!url) {
    throw new Error("LOGO_DEV_PUBLISHABLE_KEY is not set. See .env.example.")
  }

  const response = await fetch(url, { cache: "no-store" })
  if (response.status === 404) {
    throw new Error(`logo.dev has no logo for ${domain}.`)
  }
  if (!response.ok) {
    throw new Error(
      `logo.dev returned ${response.status} ${response.statusText} for ${domain}.`
    )
  }

  const contentType = response.headers.get("content-type") ?? ""
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType,
    isSvg: contentType.includes("svg"),
  }
}
