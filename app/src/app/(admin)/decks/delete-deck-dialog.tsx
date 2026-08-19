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
import type { DeckSummary } from "~/lib/decks"

import { deleteDeckAction } from "./actions"

/**
 * No usage guard here, unlike brands: nothing references a deck by slug, so a
 * deck has no dependents to break. Archive is still the softer option and is
 * offered in the row menu.
 */
export function DeleteDeckDialog({
  deck,
  onOpenChange,
}: {
  deck: DeckSummary | null
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = React.useTransition()

  function confirmDelete() {
    if (!deck) return
    startTransition(async () => {
      const result = await deleteDeckAction(deck.slug)
      if (result?.ok === false) toast.error(result.error)
      onOpenChange(false)
    })
  }

  return (
    <AlertDialog open={deck !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {deck?.title}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes decks/{deck?.slug} and everything in it, including{" "}
            {deck?.slideCount} slide{deck?.slideCount === 1 ? "" : "s"} and the
            compiled output. Git is the only undo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={confirmDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
