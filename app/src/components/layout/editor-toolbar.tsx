"use client"

import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { EditableTitle } from "./editable-title"

/**
 * Editor surfaces use this instead of a page header: back link, separator and
 * inline title on the left; icon-only utilities and the single commit action
 * on the right. Every control is h-9.
 */
export function EditorToolbar({
  backHref,
  backLabel = "Back",
  title,
  onTitleCommit,
  utilities,
  commit,
}: {
  backHref: string
  backLabel?: string
  title: string
  onTitleCommit: (next: string) => void
  utilities?: React.ReactNode
  commit?: React.ReactNode
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <Button asChild variant="ghost" size="icon" className="size-9">
        <Link href={backHref} aria-label={backLabel}>
          <ArrowLeftIcon />
        </Link>
      </Button>
      {/* The vertical separator has no height of its own — it relies on
          `data-vertical:self-stretch`. Setting a height without overriding
          self-stretch leaves a 16px stub hanging from the top of the bar. */}
      <Separator orientation="vertical" className="!h-4 !self-center" />
      <EditableTitle
        value={title}
        onCommit={onTitleCommit}
        className="max-w-xs flex-1"
      />
      <div className="ml-auto flex items-center gap-2">
        {utilities}
        {commit}
      </div>
    </div>
  )
}
