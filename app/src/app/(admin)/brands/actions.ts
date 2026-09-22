"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createBrand,
  deleteBrand,
  getBrand,
  normaliseBrand,
  saveBrand,
  setArchived,
  validateDraft,
  type Brand,
} from "~/lib/brands"

export type ActionResult = { ok: true } | { ok: false; error: string }

function fail(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : String(error) }
}

/**
 * The editor sends the whole `brand-settings.json` back. Colour literals are
 * normalised (oklch becomes rgb/rgba/hex). Palette refs are not rewritten.
 * `validate-brand.js` runs on a temp copy first unless the user overrides.
 */
export async function saveBrandAction(
  slug: string,
  edited: Brand,
  override = false
): Promise<ActionResult> {
  try {
    const current = await getBrand(slug)
    const next = normaliseBrand(edited) as Brand
    const name = next.foundations?.basic?.name?.trim() ?? ""
    if (!name) return { ok: false, error: "Name cannot be empty." }
    next.foundations.basic.name = name

    // Fields the token table does not edit stay with the file if the client
    // dropped them.
    if (next.foundations.basic.archived === undefined && current.foundations.basic.archived) {
      next.foundations.basic.archived = true
    }
    if (!next.foundations.basic.domain && current.foundations.basic.domain) {
      next.foundations.basic.domain = current.foundations.basic.domain
    }
    if (!next.foundations.basic.logoSource && current.foundations.basic.logoSource) {
      next.foundations.basic.logoSource = current.foundations.basic.logoSource
    }

    if (!override) {
      const check = await validateDraft(slug, next)
      if (check.errors.length > 0) {
        return { ok: false, error: check.errors.join("\n") }
      }
    }

    await saveBrand(slug, next)
    revalidatePath("/brands")
    revalidatePath(`/brands/${slug}`)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function setArchivedAction(
  slug: string,
  archived: boolean
): Promise<ActionResult> {
  try {
    await setArchived(slug, archived)
    revalidatePath("/brands")
    revalidatePath(`/brands/${slug}`)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function deleteBrandAction(slug: string): Promise<ActionResult> {
  try {
    await deleteBrand(slug)
  } catch (error) {
    return fail(error)
  }
  revalidatePath("/brands")
  redirect("/brands")
}

export async function createBrandAction(
  slug: string,
  name: string
): Promise<ActionResult> {
  try {
    await createBrand(slug, name)
  } catch (error) {
    return fail(error)
  }
  revalidatePath("/brands")
  redirect(`/brands/${slug}/edit`)
}
