"use client"

import * as React from "react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  COLOR_FORMATS,
  formatColor,
  hslToRgba,
  parseColor,
  rgbaToHsl,
  toBrandValue,
  type ColorFormat,
} from "~/lib/color"
import type { TokenMeta } from "~/lib/brand-tokens"
import { cn } from "~/lib/utils"

export type PairFailure = {
  label: string
  ratio: number
  floor: number
  inkValue: string
  backgroundValue: string
  /** The other half of the pair, so the remedy can name it. */
  remedy?: { value: string; ratio: number; label: string }
}

function Slider({
  label,
  value,
  max,
  suffix,
  track,
  onChange,
}: {
  label: string
  value: number
  max: number
  suffix: string
  track: string
  onChange: (next: number) => void
}) {
  return (
    <div className="grid grid-cols-[14px_1fr_46px] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        step={max <= 1 ? 0.01 : 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{ background: track }}
      />
      <span className="text-right font-mono text-xs text-muted-foreground">
        {max <= 1 ? Math.round(value * 100) : Math.round(value)}
        {suffix}
      </span>
    </div>
  )
}

export function TokenInspector({
  brandName,
  token,
  value,
  savedValue,
  format,
  failure,
  onFormat,
  onChange,
  onRevert,
}: {
  brandName: string
  token: TokenMeta
  value: string
  savedValue: string
  format: ColorFormat
  failure?: PairFailure
  onFormat: (next: ColorFormat) => void
  onChange: (next: string) => void
  onRevert: () => void
}) {
  const parsed = token.kind === "color" ? parseColor(value) : null
  const hsl = parsed ? rgbaToHsl(parsed) : null
  const dirty = value !== savedValue

  function setColour(next: ReturnType<typeof parseColor>) {
    if (!next) return
    onChange(formatColor(next, format))
  }

  return (
    <div className="grid gap-4 p-4">
      <div>
        <h2 className="font-mono text-sm font-medium">{token.path}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{token.role}</p>
      </div>

      {token.kind === "color" && parsed ? (
        <>
          {/* Colour over a checkerboard so alpha is visible. A bare
              `background` shorthand would drop the whole declaration: a colour
              cannot be the first layer of a comma-separated list. */}
          <div
            className="h-20 rounded-lg border"
            style={{
              backgroundImage: `linear-gradient(${value}, ${value}), repeating-conic-gradient(oklch(0.9 0 0) 0 25%, #fff 0 50%)`,
              backgroundSize: "auto, 12px 12px",
            }}
          />

          <div className="flex gap-1">
            {COLOR_FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  onFormat(f)
                  onChange(formatColor(parsed, f))
                }}
                className={cn(
                  "h-8 flex-1 rounded-md border font-mono text-xs",
                  f === format
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="color"
              aria-label={`${token.path} colour picker`}
              value={formatColor(parsed, "hex").toLowerCase()}
              onChange={(e) => {
                const picked = parseColor(e.target.value)
                if (picked) setColour({ ...picked, a: parsed.a })
              }}
              className="size-9 shrink-0 cursor-pointer rounded-md border bg-background p-1"
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`${token.path} value`}
              aria-invalid={parseColor(value) === null || undefined}
              className="h-9 font-mono text-xs"
            />
          </div>

          {format === "oklch" && (
            <p className="text-xs text-muted-foreground">
              Saved as {toBrandValue(parsed, "oklch")}. brand.json only holds
              rgb, rgba and 6-digit hex.
            </p>
          )}

          {hsl && (
            <div className="grid gap-2">
              <Slider
                label="H"
                value={hsl.h}
                max={360}
                suffix="°"
                track="linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)"
                onChange={(h) => setColour(hslToRgba({ ...hsl, h }, parsed.a))}
              />
              <Slider
                label="S"
                value={hsl.s}
                max={100}
                suffix="%"
                track={`linear-gradient(90deg, ${formatColor(hslToRgba({ ...hsl, s: 0 }), "hex")}, ${formatColor(hslToRgba({ ...hsl, s: 100 }), "hex")})`}
                onChange={(s) => setColour(hslToRgba({ ...hsl, s }, parsed.a))}
              />
              <Slider
                label="L"
                value={hsl.l}
                max={100}
                suffix="%"
                track={`linear-gradient(90deg, #000, ${formatColor(hslToRgba({ ...hsl, l: 50 }), "hex")}, #fff)`}
                onChange={(l) => setColour(hslToRgba({ ...hsl, l }, parsed.a))}
              />
              <Slider
                label="A"
                value={parsed.a}
                max={1}
                suffix="%"
                track={`linear-gradient(90deg, transparent, ${formatColor(parsed, "hex")}), repeating-conic-gradient(oklch(0.9 0 0) 0 25%, #fff 0 50%) 0 0/8px 8px`}
                onChange={(a) => setColour({ ...parsed, a })}
              />
            </div>
          )}

          {failure && (
            <div className="grid gap-3 rounded-lg border border-destructive p-3">
              <p className="text-sm font-medium text-destructive">
                {failure.label}: {failure.ratio.toFixed(2)}, needs{" "}
                {failure.floor}
              </p>
              {/* The specimen, so the failure is visible and not only numeric. */}
              <div
                className="rounded-md p-3"
                style={{
                  background: failure.backgroundValue,
                  color: failure.inkValue,
                }}
              >
                <span className="text-[11px] tracking-wide uppercase opacity-75">
                  Project charter
                </span>
                <span className="mt-1 block text-lg font-semibold">
                  {brandName} Q3 review
                </span>
              </div>
              {failure.remedy && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 justify-start"
                  onClick={() => onChange(failure.remedy!.value)}
                >
                  Use {failure.remedy.label}, {failure.remedy.ratio.toFixed(2)}
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="token-value" className="text-xs text-muted-foreground">
            Value
          </Label>
          <Input
            id="token-value"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 font-mono text-xs"
          />
        </div>
      )}

      <div className="grid gap-2 border-t pt-3">
        <h3 className="text-[11px] tracking-wide text-muted-foreground uppercase">
          Compiles to
        </h3>
        <ul className="grid gap-1">
          {token.cssVars.map((cssVar) => (
            <li key={cssVar} className="font-mono text-[11px] text-muted-foreground">
              {cssVar}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-2 border-t pt-3">
        <h3 className="text-[11px] tracking-wide text-muted-foreground uppercase">
          Saved value
        </h3>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
            {savedValue}
          </span>
          {dirty && (
            <Button
              type="button"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={onRevert}
            >
              Revert
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
