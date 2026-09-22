import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLinkIcon, PencilIcon } from "lucide-react"

import { PageHeader } from "~/components/layout/page-header"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { getDeckState } from "~/lib/decks"
import { isValidSlug } from "~/lib/repo"

import { CompileButton } from "../compile-button"
import { SlideThumb } from "../slide-thumb"

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  return { title: slug }
}

export default async function DeckPage({ params }: Params) {
  const { slug } = await params
  if (!isValidSlug(slug)) notFound()

  let state
  try {
    state = await getDeckState(slug)
  } catch {
    notFound()
  }
  const { deck, compiled, stale } = state

  return (
    <>
      <PageHeader
        title={deck.title}
        subtitle={`decks/${slug}`}
        actions={
          <>
            {compiled && (
              <Button asChild variant="outline" className="h-9">
                <a
                  href={`/repo/decks/${slug}/index.html`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLinkIcon />
                  Open deck
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="h-9">
              <Link href={`/decks/${slug}/edit`}>
                <PencilIcon />
                Edit
              </Link>
            </Button>
            <CompileButton slug={slug} />
          </>
        }
      />

      <div className="grid gap-4 px-6 pb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground">
            Brand:{" "}
            {deck.brand ? (
              <Link href={`/brands/${deck.brand}`} className="text-foreground hover:underline">
                {deck.brand}
              </Link>
            ) : (
              "none"
            )}
          </span>
          <span className="text-muted-foreground">
            {deck.slides.length} slide{deck.slides.length === 1 ? "" : "s"}
          </span>
          <span className="text-muted-foreground">
            Compiled:{" "}
            {!compiled ? (
              "never"
            ) : stale ? (
              <Badge variant="secondary">Out of date</Badge>
            ) : (
              "current"
            )}
          </span>
          {deck.archived && <Badge variant="outline">Archived</Badge>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {deck.slides.map((file, index) => (
            <figure key={file} className="overflow-hidden rounded-lg border">
              <SlideThumb slug={slug} file={file} />
              <figcaption className="flex items-center justify-between border-t px-3 py-2">
                <span className="text-sm">Slide {index + 1}</span>
                <a
                  href={`/repo/decks/${slug}/${file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-muted-foreground hover:underline"
                >
                  {file}
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </>
  )
}
