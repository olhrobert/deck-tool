"use server"

import { revalidatePath } from "next/cache"

import { pullLogoFromLogoDev, type PullLogoResult } from "~/lib/brands"
import { logoImageUrl, searchBrands, type LogoDevMatch } from "~/lib/logo-dev"

export type LogoCandidate = LogoDevMatch & { previewUrl: string | null }

export type SearchResult =
  | { ok: true; matches: LogoCandidate[] }
  | { ok: false; error: string }

export async function searchLogoDevAction(query: string): Promise<SearchResult> {
  if (!query.trim()) return { ok: true, matches: [] }
  try {
    const matches = await searchBrands(query.trim())
    return {
      ok: true,
      matches: matches.slice(0, 8).map((match) => ({
        ...match,
        // The publishable key is built for <img src>, so the preview URL is
        // safe to send to the browser. The secret key never leaves the server.
        previewUrl: logoImageUrl(match.domain, { size: 128 }),
      })),
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export type PullResult =
  | ({ ok: true } & PullLogoResult)
  | { ok: false; error: string }

export async function pullLogoAction(
  slug: string,
  domain: string,
  options: { theme?: "auto" | "light" | "dark"; currentColor?: boolean }
): Promise<PullResult> {
  try {
    const result = await pullLogoFromLogoDev(slug, domain, options)
    revalidatePath("/brands")
    revalidatePath(`/brands/${slug}`)
    return { ok: true, ...result }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
