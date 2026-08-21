"use client"

import * as React from "react"

import { cn } from "~/lib/utils"
import { Input } from "~/components/ui/input"

/**
 * Rename in place. Renders as plain text until clicked, commits on blur or
 * Enter, reverts on Escape. `onCommit` only fires when the value changed.
 */
export function EditableTitle({
  value,
  onCommit,
  className,
  placeholder = "Untitled",
}: {
  value: string
  onCommit: (next: string) => void
  className?: string
  placeholder?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)

  function start() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== value) onCommit(next)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        className={cn(
          "h-9 min-w-0 rounded-md px-2 text-left text-sm font-medium hover:bg-accent",
          className
        )}
      >
        <span className="block truncate">{value || placeholder}</span>
      </button>
    )
  }

  return (
    <Input
      autoFocus
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
        if (e.key === "Escape") setEditing(false)
      }}
      className={cn("h-9 text-sm font-medium", className)}
    />
  )
}
