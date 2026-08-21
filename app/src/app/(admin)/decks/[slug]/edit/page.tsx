import { notFound } from "next/navigation"

import { listBrands } from "~/lib/brands"
import { getDeck, listPresets } from "~/lib/decks"
import { isValidSlug } from "~/lib/repo"

import { DeckForm } from "./deck-form"

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  return { title: `Edit ${slug}` }
}

export default async function EditDeckPage({ params }: Params) {
  const { slug } = await params
  if (!isValidSlug(slug)) notFound()

  let deck
  try {
    deck = await getDeck(slug)
  } catch {
    notFound()
  }

  const [brands, presets] = await Promise.all([listBrands(), listPresets()])

  return (
    <DeckForm
      // Adding or removing a slide changes the file set under the form, and
      // the slide order is component state. Remount rather than try to
      // reconcile the two.
      key={deck.slides.join()}
      slug={slug}
      deck={deck}
      brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
      presets={presets}
    />
  )
}
