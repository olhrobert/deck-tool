"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createBrand,
  deleteBrand,
  getBrand,
  saveBrand,
  setArchived,
  type Brand,
} from "~/lib/brands"
import { isWritableValue } from "~/lib/color"

export type ActionResult = { ok: true } | { ok: false; error: string }

function fail(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : String(error) }
}

/**
 * The editor sends the whole brand back. Keys the app does not manage
 * (`archived`, `logoSource`, anything added by hand) are preserved from the
 * file rather than round-tripped through the client.
 */
export async function saveBrandAction(
  slug: string,
  edited: Pick<Brand, "name" | "colors" | "fonts" | "borderRadius" | "borderSize">
): Promise<ActionResult> {
  try {
    const current = await getBrand(slug)
    const next: Brand = {
      ...current,
      name: edited.name.trim(),
      colors: edited.colors,
      fonts: edited.fonts,
      borderRadius: edited.borderRadius,
      borderSize: edited.borderSize,
    }

    if (!next.name) return { ok: false, error: "Name cannot be empty." }

    // The client converts before sending, but the file contract is worth
    // enforcing on the side that owns the file: validate-brand.js parses
    // rgb(), rgba() and 6-digit #hex, and nothing else.
    for (const [key, value] of Object.entries(next.colors)) {
      if (!isWritableValue(value)) {
        return {
          ok: false,
          error: `colors.${key} is not rgb(), rgba() or #rrggbb: ${value}`,
        }
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
