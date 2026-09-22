"use client"

import * as React from "react"

import { cn } from "~/lib/utils"

/**
 * A slide rendered from the file on disk, scaled down.
 *
 * The slide HTML links `../../design-system/...` and `../../brands/...`, so it
 * only renders correctly when served from its real path in the tree — that is
 * what `/repo/[...path]` is for. Scaling with a transform rather than resizing
 * the iframe keeps the slide at its authored width, so type and layout are the
 * ones the deck will compile with.
 */
export function SlideThumb({
  slug,
  file,
  width = 1280,
  height = 800,
  className,
}: {
  slug: string
  file: string
  width?: number
  height?: number
  className?: string
}) {
  const wrapper = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(0.2)

  React.useEffect(() => {
    const element = wrapper.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [width])

  return (
    <div
      ref={wrapper}
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <iframe
        // `as=slide` composes the viewer template around the slide, brand
        // stylesheet included. The bare file links neither the brand nor the
        // viewer CSS, so it renders with default tokens.
        src={`/repo/decks/${slug}/${file}?as=slide`}
        title={file}
        tabIndex={-1}
        scrolling="no"
        className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  )
}
