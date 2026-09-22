"use client"

import * as React from "react"
import Image from "next/image"
import { DownloadIcon, SearchIcon } from "lucide-react"
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
import { Switch } from "~/components/ui/switch"
import { cn } from "~/lib/utils"

import {
  pullLogoAction,
  searchLogoDevAction,
  type LogoCandidate,
} from "./logo-actions"

export function LogoPicker({
  slug,
  brandName,
  domain,
  configured,
}: {
  slug: string
  brandName: string
  domain?: string
  configured: { search: boolean; images: boolean }
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState(domain ?? brandName)
  const [matches, setMatches] = React.useState<LogoCandidate[]>([])
  const [selected, setSelected] = React.useState<string | null>(domain ?? null)
  const [currentColor, setCurrentColor] = React.useState(true)
  const [searching, startSearch] = React.useTransition()
  const [pulling, startPull] = React.useTransition()

  if (!configured.images) {
    return (
      <p className="text-xs text-muted-foreground">
        Set LOGO_DEV_PUBLISHABLE_KEY in .env.local to pull logos from logo.dev.
      </p>
    )
  }

  function search() {
    startSearch(async () => {
      const result = await searchLogoDevAction(query)
      if (result.ok) {
        setMatches(result.matches)
        if (result.matches.length === 0) toast.info("No matches.")
      } else {
        toast.error(result.error)
      }
    })
  }

  function pull() {
    if (!selected) return
    startPull(async () => {
      const result = await pullLogoAction(slug, selected, { currentColor })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setOpen(false)
      toast.success(
        result.replacedDeckLogo
          ? `Saved ${result.file} as the deck sprite.`
          : `Saved ${result.file}. It is raster, so the deck sprite is unchanged.`
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <DownloadIcon />
          Pull from logo.dev
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pull a logo</DialogTitle>
          <DialogDescription>
            Search by company name, or type a domain directly. logo.dev serves
            SVG on Enterprise plans only — anything raster is saved beside the
            brand and used in this admin, not in decks.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex items-end gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="logo-query">Company or domain</Label>
              <Input
                id="logo-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    if (configured.search) search()
                    else setSelected(query.trim())
                  }
                }}
                placeholder="acme.com"
                className="h-9"
              />
            </div>
            {configured.search ? (
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={search}
                disabled={searching}
              >
                <SearchIcon />
                {searching ? "Searching…" : "Search"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => setSelected(query.trim())}
              >
                Use domain
              </Button>
            )}
          </div>

          {!configured.search && (
            <p className="text-xs text-muted-foreground">
              Name search needs LOGO_DEV_SECRET_KEY. Without it, enter the
              domain yourself.
            </p>
          )}

          {matches.length > 0 && (
            <ul className="grid max-h-64 gap-1 overflow-y-auto">
              {matches.map((match) => (
                <li key={match.domain}>
                  <button
                    type="button"
                    onClick={() => setSelected(match.domain)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border p-2 text-left hover:bg-accent",
                      selected === match.domain && "border-foreground"
                    )}
                  >
                    {match.previewUrl && (
                      <Image
                        src={match.previewUrl}
                        alt=""
                        width={32}
                        height={32}
                        unoptimized
                        className="size-8 rounded-sm object-contain"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {match.name}
                      </span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">
                        {match.domain}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div className="grid gap-1">
              <Label htmlFor="current-color">Recolour to slide ink</Label>
              <p className="text-xs text-muted-foreground">
                Rewrites fills to currentColor so the mark takes the slide&apos;s
                text colour. Only applies to SVG.
              </p>
            </div>
            <Switch
              id="current-color"
              checked={currentColor}
              onCheckedChange={setCurrentColor}
            />
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
            type="button"
            className="h-9"
            onClick={pull}
            disabled={pulling || !selected}
          >
            {pulling ? "Pulling…" : selected ? `Pull ${selected}` : "Pull logo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
