"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import type { BrandSummary } from "~/lib/brands"

import { deleteBrandAction, setArchivedAction } from "./actions"

/**
 * Delete is guarded by deck usage: a brand any deck still references cannot be
 * deleted, and archiving is offered in its place. The guard is enforced again
 * server-side in `deleteBrand` — this is the explanation, not the check.
 */
export function DeleteBrandDialog({
  brand,
  onOpenChange,
}: {
  brand: BrandSummary | null
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = React.useTransition()
  const inUse = (brand?.deckCount ?? 0) > 0

  function confirmDelete() {
    if (!brand) return
    startTransition(async () => {
      const result = await deleteBrandAction(brand.slug)
      if (result?.ok === false) toast.error(result.error)
      onOpenChange(false)
    })
  }

  function archiveInstead() {
    if (!brand) return
    startTransition(async () => {
      const result = await setArchivedAction(brand.slug, true)
      if (result.ok) toast.success(`${brand.name} archived`)
      else toast.error(result.error)
      onOpenChange(false)
    })
  }

  return (
    <AlertDialog open={brand !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {inUse ? `${brand?.name} is in use` : `Delete ${brand?.name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {inUse
              ? `${brand?.deckCount} deck${brand?.deckCount === 1 ? " references" : "s reference"} this brand by slug, so deleting it would break ${brand?.deckCount === 1 ? "that deck" : "those decks"}. Archive it instead — it stays on disk and stops appearing as a choice.`
              : "This removes brands/" +
                brand?.slug +
                " and everything in it, including the logo. Git is the only undo."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {inUse ? (
            <AlertDialogAction disabled={pending} onClick={archiveInstead}>
              Archive instead
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
