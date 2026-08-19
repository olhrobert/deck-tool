/**
 * What each brand token is for, and which of them the validator judges.
 *
 * Roles come from the table in `docs/brands.md`; the CSS variables from
 * `TOKEN_MAP` in `scripts/generate-brand-css.js`; the pairs from
 * `validateBrand()` in `scripts/validate-brand.js`. Pure data — no imports —
 * so both server and client components can read it.
 */

export type TokenGroup =
  | "Slide surfaces"
  | "Alerts"
  | "Charts"
  | "Type"
  | "Radius"
  | "Border size"

export type TokenMeta = {
  /** Dotted path in brand.json, e.g. `colors.primary`. */
  path: string
  group: TokenGroup
  role: string
  cssVars: string[]
  kind: "color" | "text"
}

const colour = (
  key: string,
  group: TokenGroup,
  role: string,
  cssVars: string[]
): TokenMeta => ({ path: `colors.${key}`, group, role, cssVars, kind: "color" })

export const TOKENS: TokenMeta[] = [
  colour("primary", "Slide surfaces", "Cover fill", [
    "--color-primary",
    "--color-slide-bg-primary",
  ]),
  colour("textOnPrimary", "Slide surfaces", "Ink on the cover", [
    "--color-text-on-primary",
    "--color-text-on-primary-strong (100%)",
    "--color-text-on-primary-base (70%)",
    "--color-text-on-primary-subtle (50%)",
  ]),
  colour("tertiary", "Slide surfaces", "Content canvas", [
    "--color-tertiary",
    "--color-slide-bg",
  ]),
  colour("surface", "Slide surfaces", "Card fill", [
    "--color-surface",
    "--color-card-bg",
  ]),
  colour("surfaceOnPrimary", "Slide surfaces", "Card on a cover", [
    "--color-surface-on-primary",
    "--color-card-on-primary-bg",
  ]),
  colour("text", "Slide surfaces", "Body ink", [
    "--color-text",
    "--color-text-strong (100%)",
    "--color-text-base (70%)",
    "--color-text-subtle (50%)",
  ]),
  colour("border", "Slide surfaces", "Card stroke", [
    "--color-border",
    "--color-card-border",
    "--color-separator",
  ]),
  colour("secondary", "Slide surfaces", "Utility only", ["--color-secondary"]),

  colour("positive", "Alerts", "Positive alert border", ["--color-positive"]),
  colour("positiveBg", "Alerts", "Positive alert fill", ["--color-positive-bg"]),
  colour("warning", "Alerts", "Warning alert border", ["--color-warning"]),
  colour("warningBg", "Alerts", "Warning alert fill", ["--color-warning-bg"]),
  colour("negative", "Alerts", "Negative alert border", ["--color-negative"]),
  colour("negativeBg", "Alerts", "Negative alert fill", ["--color-negative-bg"]),
  colour("informative", "Alerts", "Informative alert border", [
    "--color-informative",
  ]),
  colour("informativeBg", "Alerts", "Informative alert fill", [
    "--color-informative-bg",
  ]),

  colour("chart1", "Charts", "No chart component yet", ["--color-chart-1"]),
  colour("chart2", "Charts", "No chart component yet", ["--color-chart-2"]),
  colour("chart3", "Charts", "No chart component yet", ["--color-chart-3"]),
  colour("chart4", "Charts", "No chart component yet", ["--color-chart-4"]),

  { path: "fonts.display", group: "Type", role: "Headings", cssVars: ["--font-family-display"], kind: "text" },
  { path: "fonts.base", group: "Type", role: "Body copy", cssVars: ["--font-family-base"], kind: "text" },

  { path: "borderRadius.none", group: "Radius", role: "Square", cssVars: ["--border-radius-none"], kind: "text" },
  { path: "borderRadius.sm", group: "Radius", role: "Small", cssVars: ["--border-radius-sm"], kind: "text" },
  { path: "borderRadius.med", group: "Radius", role: "Medium", cssVars: ["--border-radius-med"], kind: "text" },
  { path: "borderRadius.lg", group: "Radius", role: "Large", cssVars: ["--border-radius-lg"], kind: "text" },
  { path: "borderRadius.full", group: "Radius", role: "Pill", cssVars: ["--border-radius-full"], kind: "text" },

  { path: "borderSize.card.top", group: "Border size", role: "Card top", cssVars: ["--card-border-size-top"], kind: "text" },
  { path: "borderSize.card.bottom", group: "Border size", role: "Card bottom", cssVars: ["--card-border-size-bottom"], kind: "text" },
  { path: "borderSize.card.left", group: "Border size", role: "Card left", cssVars: ["--card-border-size-left"], kind: "text" },
  { path: "borderSize.card.right", group: "Border size", role: "Card right", cssVars: ["--card-border-size-right"], kind: "text" },
  { path: "borderSize.alert.top", group: "Border size", role: "Alert top", cssVars: ["--alert-border-size-top"], kind: "text" },
  { path: "borderSize.alert.bottom", group: "Border size", role: "Alert bottom", cssVars: ["--alert-border-size-bottom"], kind: "text" },
  { path: "borderSize.alert.left", group: "Border size", role: "Alert left", cssVars: ["--alert-border-size-left"], kind: "text" },
  { path: "borderSize.alert.right", group: "Border size", role: "Alert right", cssVars: ["--alert-border-size-right"], kind: "text" },
]

export const TOKEN_GROUPS: TokenGroup[] = [
  "Slide surfaces",
  "Alerts",
  "Charts",
  "Type",
  "Radius",
  "Border size",
]

export type ContrastPair = {
  /** The message `validate-brand.js` emits, minus the ratio. */
  id: string
  label: string
  ink: string
  background: string
  /**
   * Only the text-on-surface check composites the ink over the background
   * before measuring. Mirroring that is the difference between the number here
   * and the number that fails the save.
   */
  composite: boolean
}

export const CONTRAST_PAIRS: ContrastPair[] = [
  {
    id: "text on tertiary",
    label: "Body ink on the canvas",
    ink: "text",
    background: "tertiary",
    composite: false,
  },
  {
    id: "textOnPrimary on primary",
    label: "Ink on the cover",
    ink: "textOnPrimary",
    background: "primary",
    composite: false,
  },
  {
    id: "text on surface",
    label: "Body ink on a card",
    ink: "text",
    background: "surface",
    composite: true,
  },
]

export const AA_FLOOR = 4.5

/** Colour keys the validator parses and can fail the brand on. */
export const AA_KEYS = Array.from(
  new Set(CONTRAST_PAIRS.flatMap((p) => [p.ink, p.background]))
)

export function tokenMeta(path: string): TokenMeta | undefined {
  return TOKENS.find((t) => t.path === path)
}

export function getPath(source: unknown, path: string): string | undefined {
  const value = path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      source
    )
  return typeof value === "string" ? value : undefined
}

export function setPath<T>(source: T, path: string, value: string): T {
  const keys = path.split(".")
  const next = { ...(source as object) } as Record<string, unknown>
  let cursor = next
  for (const key of keys.slice(0, -1)) {
    cursor[key] = { ...(cursor[key] as Record<string, unknown>) }
    cursor = cursor[key] as Record<string, unknown>
  }
  cursor[keys[keys.length - 1]] = value
  return next as T
}
