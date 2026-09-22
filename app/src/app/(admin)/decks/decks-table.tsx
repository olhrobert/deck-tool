"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ExternalLinkIcon,
  HammerIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import type { DeckSummary } from "~/lib/decks"

import { compileDeckAction, setDeckArchivedAction } from "./actions"
import { DeleteDeckDialog } from "./delete-deck-dialog"

export function DecksTable({ decks }: { decks: DeckSummary[] }) {
  const [pending, startTransition] = React.useTransition()
  const [deleting, setDeleting] = React.useState<DeckSummary | null>(null)

  function compile(deck: DeckSummary) {
    startTransition(async () => {
      const result = await compileDeckAction(deck.slug)
      if (result.ok) toast.success(result.output)
      else toast.error(result.error)
    })
  }

  function toggleArchive(deck: DeckSummary) {
    startTransition(async () => {
      const result = await setDeckArchivedAction(deck.slug, !deck.archived)
      if (result.ok) {
        toast.success(deck.archived ? `${deck.title} restored` : `${deck.title} archived`)
      } else {
        toast.error(result.error)
      }
    })
  }

  if (decks.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No decks yet. Create one to get started.
      </p>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Slides</TableHead>
              <TableHead>Compiled</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {decks.map((deck) => (
              <TableRow key={deck.slug}>
                <TableCell className="font-medium">
                  <Link href={`/decks/${deck.slug}`} className="hover:underline">
                    {deck.title}
                  </Link>
                  {deck.archived && (
                    <Badge variant="outline" className="ml-2">
                      Archived
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {deck.slug}
                </TableCell>
                <TableCell>
                  {deck.brand ? (
                    <Link
                      href={`/brands/${deck.brand}`}
                      className="text-sm hover:underline"
                    >
                      {deck.brand}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {deck.slideCount}
                </TableCell>
                <TableCell>
                  {!deck.compiled ? (
                    <span className="text-sm text-muted-foreground">Never</span>
                  ) : deck.stale ? (
                    <Badge variant="secondary">Out of date</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Current</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        aria-label={`Actions for ${deck.title}`}
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/decks/${deck.slug}/edit`}>
                          <PencilIcon />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={pending}
                        onSelect={() => compile(deck)}
                      >
                        <HammerIcon />
                        Compile
                      </DropdownMenuItem>
                      {deck.compiled && (
                        <DropdownMenuItem asChild>
                          <a
                            href={`/repo/decks/${deck.slug}/index.html`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLinkIcon />
                            Open compiled deck
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        disabled={pending}
                        onSelect={() => toggleArchive(deck)}
                      >
                        {deck.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                        {deck.archived ? "Restore" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleting(deck)}
                      >
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteDeckDialog
        deck={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      />
    </>
  )
}
