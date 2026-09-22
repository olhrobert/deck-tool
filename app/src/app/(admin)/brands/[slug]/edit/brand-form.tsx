"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { EditorToolbar } from "~/components/layout/editor-toolbar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import type { Brand } from "~/lib/brands"
import {
  AA_FLOOR,
  contrastReport,
  displayValue,
  getPath,
  groupsIn,
  leaves,
  parsePaint,
  resolveLiteral,
  setPath,
  type TokenKind,
  type TokenLeaf,
} from "~/lib/brand-tokens"
import {
  parseColor,
  toBrandValue,
  type ColorFormat,
} from "~/lib/color"
import { cn } from "~/lib/utils"

import { saveBrandAction } from "../../actions"
import { TokenInspector, type PairFailure } from "./token-inspector"

type Filter = "all" | "contrast" | "changed"

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "contrast", label: "Contrast" },
  { id: "changed", label: "Changed" },
]

function detectFormat(value: string): ColorFormat {
  if (value.startsWith("#")) return "hex"
  if (value.startsWith("oklch")) return "oklch"
  if (value.startsWith("rgba")) return "rgba"
  return "rgb"
}

function swatchFor(settings: Brand, path: string, kind: TokenKind): string | null {
  if (kind === "color") {
    const value = getPath(settings, path)
    return typeof value === "string" ? value : null
  }
  if (kind === "ref" || kind === "paint") {
    return resolveLiteral(settings, getPath(settings, path))
  }
  return null
}

export function BrandForm({ slug, brand }: { slug: string; brand: Brand }) {
  const router = useRouter()
  const [draft, setDraft] = React.useState(brand)
  const rows = React.useMemo(() => leaves(draft), [draft])
  const [selected, setSelected] = React.useState(rows[0]?.path ?? "")
  const [formats, setFormats] = React.useState<Record<string, ColorFormat>>({})
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")
  const [override, setOverride] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const report = React.useMemo(() => contrastReport(draft), [draft])
  const failing = report.filter((row) => !row.passes)
  const contrastPaths = React.useMemo(
    () => new Set(report.flatMap((row) => [row.inkPath, row.backgroundPath])),
    [report]
  )
  const flagged = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const row of failing) {
      if (row.ratio === null) continue
      for (const path of [row.inkPath, row.backgroundPath]) {
        const worst = map.get(path)
        if (worst === undefined || row.ratio < worst) map.set(path, row.ratio)
      }
    }
    return map
  }, [failing])

  const changed = rows.filter(
    (row) => displayValue(getPath(draft, row.path)) !== displayValue(getPath(brand, row.path))
  )
  const name = String(getPath(draft, "foundations.basic.name") ?? "")
  const savedName = String(getPath(brand, "foundations.basic.name") ?? "")
  const dirty = changed.length > 0 || name !== savedName
  const blocked = failing.length > 0 && !override

  const visible = rows.filter((token) => {
    const value = displayValue(getPath(draft, token.path))
    if (
      query &&
      !`${token.path} ${token.role} ${value}`.toLowerCase().includes(query.toLowerCase())
    ) {
      return false
    }
    if (filter === "contrast") return contrastPaths.has(token.path)
    if (filter === "changed") return changed.some((row) => row.path === token.path)
    return true
  })

  const selectedToken: TokenLeaf =
    rows.find((row) => row.path === selected) ??
    rows[0] ?? {
      path: "foundations.basic.name",
      group: "Identity",
      role: "Brand name",
      kind: "text",
      cssVars: [],
    }
  const selectedRaw = getPath(draft, selectedToken.path)
  const selectedValue = displayValue(selectedRaw)
  const selectedFormat =
    formats[selectedToken.path] ??
    (selectedToken.kind === "color" ? detectFormat(selectedValue) : "rgb")

  const failure: PairFailure | undefined = React.useMemo(() => {
    const hit = report.find(
      (row) =>
        !row.passes &&
        row.ratio !== null &&
        (row.inkPath === selectedToken.path || row.backgroundPath === selectedToken.path)
    )
    if (!hit || hit.ratio === null) return undefined
    const inkValue = resolveLiteral(draft, getPath(draft, hit.inkPath)) ?? ""
    const backgroundValue = resolveLiteral(draft, getPath(draft, hit.backgroundPath)) ?? ""
    return {
      label: hit.label,
      ratio: hit.ratio,
      floor: AA_FLOOR,
      inkValue,
      backgroundValue,
    }
  }, [report, selectedToken.path, draft])

  function commit(path: string, raw: string) {
    const token = rows.find((row) => row.path === path)
    setDraft((current) => {
      if (!token || token.kind === "text" || token.kind === "ref" || token.kind === "color") {
        return setPath(current, path, raw)
      }
      if (token.kind === "number") {
        const next = Number(raw)
        return setPath(current, path, Number.isNaN(next) ? raw : next)
      }
      if (token.kind === "boolean") {
        return setPath(current, path, raw === "true")
      }
      return setPath(current, path, parsePaint(raw))
    })
  }

  function serialise(): Brand {
    let next = structuredClone(draft)
    for (const token of leaves(next)) {
      if (token.kind !== "color") continue
      const value = getPath(next, token.path)
      if (typeof value !== "string") continue
      const parsed = parseColor(value)
      if (!parsed) continue
      const format = formats[token.path] ?? detectFormat(value)
      next = setPath(next, token.path, toBrandValue(parsed, format))
    }
    return next
  }

  function save() {
    startTransition(async () => {
      const result = await saveBrandAction(slug, serialise(), override)
      if (result.ok) {
        toast.success("Brand saved. brand.css regenerated.")
        router.push(`/brands/${slug}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const groups = groupsIn(visible)

  return (
    <div data-layout="fixed" className="flex min-h-0 flex-1 flex-col">
      <EditorToolbar
        backHref={`/brands/${slug}`}
        backLabel="Back to brand"
        title={name}
        onTitleCommit={(next) => commit("foundations.basic.name", next)}
        utilities={
          <span className="text-sm text-muted-foreground">
            {rows.length} tokens
            {changed.length > 0 && `, ${changed.length} changed`}
          </span>
        }
        commit={
          <Button
            type="button"
            className="h-9"
            disabled={pending || !dirty || blocked}
            onClick={save}
          >
            {pending ? "Saving…" : "Save brand"}
          </Button>
        }
      />

      {failing.length > 0 && (
        <div className="flex items-center gap-3 border-b border-destructive/40 bg-destructive/5 px-4 py-2">
          <span className="text-sm">
            {failing.length} contrast check{failing.length === 1 ? "" : "s"} fail
            {failing.length === 1 ? "s" : ""}, so validate-brand.js will reject
            this brand.
          </span>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
              className="size-4"
            />
            Save anyway
          </label>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_340px]">
        <div className="min-w-0 overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter tokens…"
              aria-label="Filter tokens"
              className="h-9 max-w-64"
            />
            {FILTERS.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={filter === item.id ? "secondary" : "ghost"}
                className="h-9 rounded-full"
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-11" />
                <TableHead>Token</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Where it lands</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => {
                const groupRows = visible.filter((token) => token.group === group)
                return (
                  <React.Fragment key={group}>
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="h-8 bg-muted text-[11px] tracking-wide text-muted-foreground uppercase"
                      >
                        {group}
                      </TableCell>
                    </TableRow>
                    {groupRows.map((token) => {
                      const value = displayValue(getPath(draft, token.path))
                      const saved = displayValue(getPath(brand, token.path))
                      const ratio = flagged.get(token.path)
                      const swatch = swatchFor(draft, token.path, token.kind)
                      return (
                        <TableRow
                          key={token.path}
                          onClick={() => setSelected(token.path)}
                          data-active={token.path === selected || undefined}
                          className="cursor-pointer data-active:bg-accent"
                        >
                          <TableCell>
                            {swatch && (
                              <span
                                className="block size-5 rounded-sm border"
                                style={{ background: swatch }}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {token.path.replace(/^foundations\.|^components\./, "")}
                            {value !== saved && (
                              <span className="ml-2 inline-block size-1.5 rounded-full bg-foreground align-middle" />
                            )}
                          </TableCell>
                          <TableCell className="max-w-64 truncate font-mono text-xs text-muted-foreground">
                            {value}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {token.role}
                          </TableCell>
                          <TableCell>
                            {ratio !== undefined && (
                              <Badge variant="destructive">{ratio.toFixed(2)}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>

          {visible.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              No token matches that filter.
            </p>
          )}
        </div>

        <div className={cn("min-h-0 overflow-y-auto border-l bg-muted/40")}>
          <TokenInspector
            brandName={name}
            token={selectedToken}
            value={selectedValue}
            savedValue={displayValue(getPath(brand, selectedToken.path))}
            format={selectedFormat}
            failure={failure}
            onFormat={(next) =>
              setFormats((current) => ({ ...current, [selectedToken.path]: next }))
            }
            onChange={(next) => commit(selectedToken.path, next)}
            onRevert={() => {
              const saved = getPath(brand, selectedToken.path)
              setDraft((current) => setPath(current, selectedToken.path, saved))
              if (typeof saved === "string") {
                setFormats((current) => ({
                  ...current,
                  [selectedToken.path]: detectFormat(saved),
                }))
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
