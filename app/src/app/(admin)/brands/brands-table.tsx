"use client"

import * as React from "react"
import Link from "next/link"
import { ArchiveIcon, ArchiveRestoreIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
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
import type { BrandSummary } from "~/lib/brands"

import { setArchivedAction } from "./actions"
import { DeleteBrandDialog } from "./delete-brand-dialog"

function Swatches({ brand }: { brand: BrandSummary }) {
  const swatches = [
    { label: "Primary", value: brand.primary },
    { label: "Tertiary", value: brand.tertiary },
    { label: "Text", value: brand.text },
  ]
  return (
    <div className="flex items-center gap-1">
      {swatches.map((s) => (
        <span
          key={s.label}
          title={`${s.label}: ${s.value}`}
          className="size-5 rounded-sm border"
          style={{ background: s.value }}
        />
      ))}
    </div>
  )
}

export function BrandsTable({ brands }: { brands: BrandSummary[] }) {
  const [pending, startTransition] = React.useTransition()
  const [deleting, setDeleting] = React.useState<BrandSummary | null>(null)

  function toggleArchive(brand: BrandSummary) {
    startTransition(async () => {
      const result = await setArchivedAction(brand.slug, !brand.archived)
      if (result.ok) {
        toast.success(
          brand.archived ? `${brand.name} restored` : `${brand.name} archived`
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  if (brands.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No brands yet. Create one to get started.
      </p>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Colours</TableHead>
              <TableHead>Decks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.slug} data-archived={brand.archived}>
                <TableCell className="font-medium">
                  <Link href={`/brands/${brand.slug}`} className="hover:underline">
                    {brand.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {brand.slug}
                </TableCell>
                <TableCell>
                  <Swatches brand={brand} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {brand.deckCount}
                </TableCell>
                <TableCell>
                  {brand.archived ? (
                    <Badge variant="outline">Archived</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Active</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        aria-label={`Actions for ${brand.name}`}
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/brands/${brand.slug}/edit`}>
                          <PencilIcon />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={pending}
                        onSelect={() => toggleArchive(brand)}
                      >
                        {brand.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                        {brand.archived ? "Restore" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleting(brand)}
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

      <DeleteBrandDialog
        brand={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      />
    </>
  )
}
