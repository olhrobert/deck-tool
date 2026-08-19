"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import type { Preset } from "~/lib/decks"

import { createDeckAction } from "./actions"

const SLUG = /^[a-z0-9][a-z0-9-]*$/

export function NewDeckDialog({
  brands,
  presets,
}: {
  brands: { slug: string; name: string }[]
  presets: Preset[]
}) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [brand, setBrand] = React.useState(brands[0]?.slug ?? "")
  const [preset, setPreset] = React.useState(presets[0]?.relativePath ?? "")
  const [pending, startTransition] = React.useTransition()

  const slugValue =
    slug ||
    title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const slugError = slugValue !== "" && !SLUG.test(slugValue)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() || !slugValue || slugError || !preset) return
    startTransition(async () => {
      const result = await createDeckAction(
        slugValue,
        title.trim(),
        brand || undefined,
        preset
      )
      if (result?.ok === false) toast.error(result.error)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9">
          <PlusIcon />
          New deck
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New deck</DialogTitle>
            <DialogDescription>
              Creates decks/{slugValue || "slug"} with one title slide copied
              from a preset. Add the rest from the deck screen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deck-title">Title</Label>
              <Input
                id="deck-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Acme Q3 review"
                autoFocus
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deck-slug">Slug</Label>
              <Input
                id="deck-slug"
                value={slugValue}
                onChange={(e) => setSlug(e.target.value)}
                className="h-9 font-mono"
                aria-invalid={slugError || undefined}
              />
              <p className="text-xs text-muted-foreground">
                The directory name under decks/. It cannot be changed later.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deck-brand">Brand</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger id="deck-brand" className="h-9">
                  <SelectValue placeholder="No brand" />
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
            <div className="grid gap-2">
              <Label htmlFor="deck-preset">Title slide</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger id="deck-preset" className="h-9">
                  <SelectValue placeholder="Pick a preset" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.relativePath} value={p.relativePath}>
                      {p.file.replace(".html", "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9"
              disabled={pending || !title.trim() || !slugValue || slugError || !preset}
            >
              Create deck
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
