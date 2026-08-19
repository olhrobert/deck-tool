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
  CONTRAST_PAIRS,
  TOKENS,
  TOKEN_GROUPS,
  getPath,
  setPath,
  type TokenGroup,
} from "~/lib/brand-tokens"
import {
  compositeOn,
  contrastRatio,
  parseColor,
  toBrandValue,
  type ColorFormat,
} from "~/lib/color"
import { cn } from "~/lib/utils"

import { saveBrandAction } from "../../actions"
import { TokenInspector, type PairFailure } from "./token-inspector"

type Filter = "all" | "aa" | "changed" | "alerts"

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "aa", label: "On the AA path" },
  { id: "changed", label: "Changed" },
  { id: "alerts", label: "Alerts" },
]

function detectFormat(value: string): ColorFormat {
  if (value.startsWith("#")) return "hex"
  if (value.startsWith("oklch")) return "oklch"
  if (value.startsWith("rgba")) return "rgba"
  return "rgb"
}

/**
 * Runs the same three checks as `validate-brand.js`, including the fact that
 * only text-on-surface composites the ink first. A pair fails as a pair, so
 * both members are flagged.
 */
function useContrast(colors: Record<string, string>) {
  return React.useMemo(() => {
    const results = CONTRAST_PAIRS.map((pair) => {
      const ink = parseColor(colors[pair.ink] ?? "")
      const background = parseColor(colors[pair.background] ?? "")
      if (!ink || !background) {
        return { pair, ratio: null, passes: false as const }
      }
      const measured = pair.composite ? compositeOn(ink, background) : ink
      const ratio = contrastRatio(measured, background)
      return { pair, ratio, passes: ratio >= AA_FLOOR }
    })

    const flagged = new Map<string, number>()
    for (const result of results) {
      if (result.passes) continue
      if (result.ratio === null) continue
      for (const key of [result.pair.ink, result.pair.background]) {
        const worst = flagged.get(key)
        if (worst === undefined || result.ratio < worst) {
          flagged.set(key, result.ratio)
        }
      }
    }

    return { results, flagged, failing: results.filter((r) => !r.passes) }
  }, [colors])
}

export function BrandForm({ slug, brand }: { slug: string; brand: Brand }) {
  const router = useRouter()
  const [draft, setDraft] = React.useState(brand)
  const [selected, setSelected] = React.useState(TOKENS[0].path)
  const [formats, setFormats] = React.useState<Record<string, ColorFormat>>({})
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")
  const [override, setOverride] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const { results, flagged, failing } = useContrast(draft.colors)
  const changed = TOKENS.filter(
    (t) => getPath(draft, t.path) !== getPath(brand, t.path)
  )
  const dirty = changed.length > 0 || draft.name !== brand.name
  const blocked = failing.length > 0 && !override

  const visible = TOKENS.filter((token) => {
    const value = getPath(draft, token.path) ?? ""
    if (query && !`${token.path} ${token.role} ${value}`.toLowerCase().includes(query.toLowerCase())) {
      return false
    }
    if (filter === "aa") return flagged.has(token.path.replace("colors.", "")) || CONTRAST_PAIRS.some((p) => `colors.${p.ink}` === token.path || `colors.${p.background}` === token.path)
    if (filter === "changed") return changed.includes(token)
    if (filter === "alerts") return token.group === "Alerts"
    return true
  })

  const selectedToken = TOKENS.find((t) => t.path === selected) ?? TOKENS[0]
  const selectedValue = getPath(draft, selectedToken.path) ?? ""
  const selectedFormat = formats[selectedToken.path] ?? detectFormat(selectedValue)

  const failure: PairFailure | undefined = React.useMemo(() => {
    const key = selectedToken.path.replace("colors.", "")
    const hit = results.find(
      (r) => !r.passes && r.ratio !== null && (r.pair.ink === key || r.pair.background === key)
    )
    if (!hit || hit.ratio === null) return undefined

    const inkValue = draft.colors[hit.pair.ink]
    const backgroundValue = draft.colors[hit.pair.background]

    // Offer a colour the brand already uses that would clear the floor.
    let remedy: PairFailure["remedy"]
    if (hit.pair.ink === key) {
      const background = parseColor(backgroundValue)
      const candidates = Object.entries(draft.colors)
        .filter(([candidateKey]) => candidateKey !== key)
        .map(([candidateKey, value]) => {
          const parsed = parseColor(value)
          if (!parsed || !background) return null
          return {
            label: candidateKey,
            value,
            ratio: contrastRatio(parsed, background),
          }
        })
        .filter((c): c is NonNullable<typeof c> => c !== null && c.ratio >= AA_FLOOR)
        .sort((a, b) => b.ratio - a.ratio)
      remedy = candidates[0]
    }

    return {
      label: hit.pair.label,
      ratio: hit.ratio,
      floor: AA_FLOOR,
      inkValue,
      backgroundValue,
      remedy,
    }
  }, [results, selectedToken.path, draft.colors])

  function updateToken(path: string, next: string) {
    setDraft((current) => setPath(current, path, next))
  }

  /** Colours are normalised on the way out; oklch never reaches the file. */
  function serialise(): Pick<Brand, "name" | "colors" | "fonts" | "borderRadius" | "borderSize"> {
    const colors: Record<string, string> = {}
    for (const [key, value] of Object.entries(draft.colors)) {
      const parsed = parseColor(value)
      const format = formats[`colors.${key}`] ?? detectFormat(value)
      colors[key] = parsed ? toBrandValue(parsed, format) : value
    }
    return {
      name: draft.name,
      colors,
      fonts: draft.fonts,
      borderRadius: draft.borderRadius,
      borderSize: draft.borderSize,
    }
  }

  function save() {
    startTransition(async () => {
      const result = await saveBrandAction(slug, serialise())
      if (result.ok) {
        toast.success("Brand saved. brand.css regenerated.")
        router.push(`/brands/${slug}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div data-layout="fixed" className="flex min-h-0 flex-1 flex-col">
      <EditorToolbar
        backHref={`/brands/${slug}`}
        backLabel="Back to brand"
        title={draft.name}
        onTitleCommit={(name) => setDraft((c) => ({ ...c, name }))}
        utilities={
          <span className="text-sm text-muted-foreground">
            {TOKENS.length} tokens
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
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                // Not `default` — the filled button on this screen is Save.
                variant={filter === f.id ? "secondary" : "ghost"}
                className="h-9 rounded-full"
                onClick={() => setFilter(f.id)}
              >
                {f.label}
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
              {TOKEN_GROUPS.map((group: TokenGroup) => {
                const rows = visible.filter((t) => t.group === group)
                if (rows.length === 0) return null
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
                    {rows.map((token) => {
                      const value = getPath(draft, token.path) ?? ""
                      const key = token.path.replace("colors.", "")
                      const ratio = flagged.get(key)
                      const isChanged = value !== getPath(brand, token.path)
                      return (
                        <TableRow
                          key={token.path}
                          onClick={() => setSelected(token.path)}
                          data-active={token.path === selected || undefined}
                          className="cursor-pointer data-active:bg-accent"
                        >
                          <TableCell>
                            {token.kind === "color" && (
                              <span
                                className="block size-5 rounded-sm border"
                                style={{ background: value }}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {token.path.split(".").slice(1).join(".")}
                            {isChanged && (
                              <span className="ml-2 inline-block size-1.5 rounded-full bg-foreground align-middle" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
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
            brandName={draft.name}
            token={selectedToken}
            value={selectedValue}
            savedValue={getPath(brand, selectedToken.path) ?? ""}
            format={selectedFormat}
            failure={failure}
            onFormat={(next) =>
              setFormats((current) => ({ ...current, [selectedToken.path]: next }))
            }
            onChange={(next) => updateToken(selectedToken.path, next)}
            onRevert={() => {
              const saved = getPath(brand, selectedToken.path) ?? ""
              updateToken(selectedToken.path, saved)
              setFormats((current) => ({
                ...current,
                [selectedToken.path]: detectFormat(saved),
              }))
            }}
          />
        </div>
      </div>
    </div>
  )
}
