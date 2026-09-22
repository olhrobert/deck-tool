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

import { createBrandAction } from "./actions"

const SLUG = /^[a-z0-9][a-z0-9-]*$/

export function NewBrandDialog() {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  const slugValue = slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const slugError = slugValue !== "" && !SLUG.test(slugValue)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !slugValue || slugError) return
    startTransition(async () => {
      const result = await createBrandAction(slugValue, name.trim())
      // A successful create redirects, so anything returned here is a failure.
      if (result?.ok === false) toast.error(result.error)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9">
          <PlusIcon />
          New brand
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New brand</DialogTitle>
            <DialogDescription>
              Scaffolds brands/{slugValue || "slug"} from the Riverton tokens
              and a placeholder logo. You edit it next.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Capital"
                autoFocus
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand-slug">Slug</Label>
              <Input
                id="brand-slug"
                value={slugValue}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme"
                className="h-9 font-mono"
                aria-invalid={slugError || undefined}
              />
              <p className="text-xs text-muted-foreground">
                The directory name and the value decks use in slides.json.
                Lowercase letters, numbers and hyphens. It cannot be changed
                later.
              </p>
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
              disabled={pending || !name.trim() || !slugValue || slugError}
            >
              Create brand
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
