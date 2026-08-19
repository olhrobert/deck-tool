"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HammerIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"

import { compileDeckAction } from "./actions"

export function CompileButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function compile() {
    startTransition(async () => {
      const result = await compileDeckAction(slug)
      if (result.ok) {
        // The script's own line, so the UI reports what the build reported.
        toast.success(result.output)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button type="button" className="h-9" disabled={pending} onClick={compile}>
      <HammerIcon />
      {pending ? "Compiling…" : "Compile"}
    </Button>
  )
}
