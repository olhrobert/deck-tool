import { PageHeader } from "~/components/layout/page-header"
import { listBrands } from "~/lib/brands"
import { listDecks, listPresets } from "~/lib/decks"

import { DecksTable } from "./decks-table"
import { NewDeckDialog } from "./new-deck-dialog"

export const metadata = { title: "Decks" }

export default async function DecksPage() {
  const [decks, brands, presets] = await Promise.all([
    listDecks(),
    listBrands(),
    listPresets(),
  ])

  return (
    <>
      <PageHeader
        title="Decks"
        subtitle="Slide HTML is the source of truth. Compiling writes index.html."
        actions={
          <NewDeckDialog
            brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
            presets={presets.filter((p) => p.kind === "slide")}
          />
        }
      />
      <div className="px-6 pb-6">
        <DecksTable decks={decks} />
      </div>
    </>
  )
}
