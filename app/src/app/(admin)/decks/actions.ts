"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  addSlideFromPreset,
  compileDeck,
  createDeck,
  deleteDeck,
  removeSlide,
  saveDeck,
  setDeckArchived,
} from "~/lib/decks"

export type ActionResult = { ok: true } | { ok: false; error: string }
export type CompileResult = { ok: true; output: string } | { ok: false; error: string }

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : String(error) }
}

function refresh(slug: string) {
  revalidatePath("/decks")
  revalidatePath(`/decks/${slug}`)
  revalidatePath(`/decks/${slug}/edit`)
}

export async function saveDeckAction(
  slug: string,
  edits: { title: string; brand?: string; order?: string[] }
): Promise<ActionResult> {
  try {
    await saveDeck(slug, edits)
    refresh(slug)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function addSlideAction(
  slug: string,
  presetRelativePath: string
): Promise<ActionResult> {
  try {
    await addSlideFromPreset(slug, presetRelativePath)
    refresh(slug)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function removeSlideAction(
  slug: string,
  file: string
): Promise<ActionResult> {
  try {
    await removeSlide(slug, file)
    refresh(slug)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

/** Compilation is the deck's build step, so its output is surfaced verbatim. */
export async function compileDeckAction(slug: string): Promise<CompileResult> {
  try {
    const output = await compileDeck(slug)
    refresh(slug)
    return { ok: true, output }
  } catch (error) {
    return fail(error)
  }
}

export async function setDeckArchivedAction(
  slug: string,
  archived: boolean
): Promise<ActionResult> {
  try {
    await setDeckArchived(slug, archived)
    refresh(slug)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function deleteDeckAction(slug: string): Promise<ActionResult> {
  try {
    await deleteDeck(slug)
  } catch (error) {
    return fail(error)
  }
  revalidatePath("/decks")
  redirect("/decks")
}

export async function createDeckAction(
  slug: string,
  title: string,
  brand: string | undefined,
  presetRelativePath: string
): Promise<ActionResult> {
  try {
    await createDeck(slug, title, brand, presetRelativePath)
  } catch (error) {
    return fail(error)
  }
  revalidatePath("/decks")
  redirect(`/decks/${slug}`)
}
