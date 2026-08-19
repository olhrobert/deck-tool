"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ExternalLinkIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { EditorToolbar } from "~/components/layout/editor-toolbar"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import type { Deck, Preset } from "~/lib/decks"

import { addSlideAction, removeSlideAction, saveDeckAction } from "../../actions"
import { SlideThumb } from "../../slide-thumb"

export function DeckForm({
  slug,
  deck,
  brands,
  presets,
}: {
  slug: string
  deck: Deck
  brands: { slug: string; name: string }[]
  presets: Preset[]
}) {
  const router = useRouter()
  const [title, setTitle] = React.useState(deck.title)
  const [brand, setBrand] = React.useState(deck.brand ?? "")
  const [order, setOrder] = React.useState(deck.slides)
  const [addOpen, setAddOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const dirty =
    title !== deck.title ||
    brand !== (deck.brand ?? "") ||
    order.join() !== deck.slides.join()

  function move(index: number, delta: number) {
    const next = [...order]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
  }

  function save() {
    startTransition(async () => {
      const result = await saveDeckAction(slug, {
        title,
        brand: brand || undefined,
        order,
      })
      if (result.ok) {
        toast.success("Deck saved. Compile to update index.html.")
        router.push(`/decks/${slug}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  function addSlide(preset: Preset) {
    startTransition(async () => {
      const result = await addSlideAction(slug, preset.relativePath)
      if (result.ok) {
        setAddOpen(false)
        toast.success(`Added ${preset.file}.`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function removeSlide(file: string) {
    startTransition(async () => {
      const result = await removeSlideAction(slug, file)
      if (result.ok) {
        toast.success(`Removed ${file}.`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const slidePresets = presets.filter((p) => p.kind === "slide")
  const fragments = presets.filter((p) => p.kind === "fragment")
  const groups = Array.from(new Set(slidePresets.map((p) => p.group)))

  return (
    <div data-layout="fixed" className="flex min-h-0 flex-1 flex-col">
      <EditorToolbar
        backHref={`/decks/${slug}`}
        backLabel="Back to deck"
        title={title}
        onTitleCommit={setTitle}
        utilities={
          <div className="flex items-center gap-2">
            <Label htmlFor="deck-brand" className="text-sm text-muted-foreground">
              Brand
            </Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger id="deck-brand" className="h-9 w-40">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.slug} value={b.slug}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        commit={
          <Button
            type="button"
            className="h-9"
            disabled={pending || !dirty}
            onClick={save}
          >
            {pending ? "Saving…" : "Save deck"}
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-sm font-semibold">Slides</h2>
          <p className="text-sm text-muted-foreground">
            Order comes from the filenames. Saving renumbers them.
          </p>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="ml-auto h-9">
                <PlusIcon />
                Add slide
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add a slide</DialogTitle>
                <DialogDescription>
                  Copies a preset into decks/{slug} as the next slide. Edit the
                  copy, not the preset.
                </DialogDescription>
              </DialogHeader>
              <div className="grid max-h-[60vh] gap-5 overflow-y-auto">
                {groups.map((group) => (
                  <div key={group} className="grid gap-2">
                    <h3 className="text-[11px] tracking-wide text-muted-foreground uppercase">
                      {group.replace(/-/g, " ")}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {slidePresets
                        .filter((p) => p.group === group)
                        .map((preset) => (
                          <button
                            key={preset.relativePath}
                            type="button"
                            disabled={pending}
                            onClick={() => addSlide(preset)}
                            className="rounded-md border p-3 text-left text-sm hover:bg-accent disabled:opacity-50"
                          >
                            {preset.file.replace(".html", "")}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {fragments.length > 0 && (
                  <p className="border-t pt-4 text-sm text-muted-foreground">
                    {fragments.length} more presets ({
                      Array.from(new Set(fragments.map((f) => f.group))).join(", ")
                    }) are fragments, not slides. Paste those into a slide&apos;s
                    HTML — they carry no &lt;slide&gt; for the compiler to find.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {order.map((file, index) => (
            <figure key={file} className="overflow-hidden rounded-lg border">
              <SlideThumb slug={slug} file={file} />
              <figcaption className="flex items-center gap-1 border-t px-2 py-2">
                <span className="px-1 text-sm">Slide {index + 1}</span>
                <a
                  href={`/repo/decks/${slug}/${file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-muted-foreground hover:underline"
                  title="Open the file"
                >
                  <ExternalLinkIcon className="size-3.5" />
                </a>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Move slide ${index + 1} earlier`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Move slide ${index + 1} later`}
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-destructive"
                    aria-label={`Remove slide ${index + 1}`}
                    disabled={pending || order.length === 1}
                    onClick={() => removeSlide(file)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Slide content is edited in the files themselves — this screen manages
          which slides a deck has and what order they run in.
        </p>
      </div>
    </div>
  )
}
