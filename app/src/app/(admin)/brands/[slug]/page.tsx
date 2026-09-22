import Link from "next/link"
import { notFound } from "next/navigation"
import { PencilIcon } from "lucide-react"

import { PageHeader } from "~/components/layout/page-header"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { displayValue, getPath, groupsIn, leaves } from "~/lib/brand-tokens"
import {
  checkBrand,
  decksUsingBrand,
  getBrand,
  getLogoSourceDataUrl,
} from "~/lib/brands"
import { logoDevConfig } from "~/lib/logo-dev"
import { isValidSlug } from "~/lib/repo"

import { SlideThumb } from "../../decks/slide-thumb"
import { LogoPicker } from "./logo-picker"

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  return { title: slug }
}

function TokenRow({ name, value }: { name: string; value: string }) {
  const isColour = /^(rgb|rgba|#)/.test(value)
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
      <span className="font-mono text-xs text-muted-foreground">{name}</span>
      <span className="flex min-w-0 items-center gap-2">
        {isColour && (
          <span
            className="size-4 shrink-0 rounded-sm border"
            style={{ background: value }}
          />
        )}
        <span className="truncate font-mono text-xs">{value}</span>
      </span>
    </div>
  )
}

export default async function BrandPage({ params }: Params) {
  const { slug } = await params
  if (!isValidSlug(slug)) notFound()

  let brand
  try {
    brand = await getBrand(slug)
  } catch {
    notFound()
  }

  const basic = brand.foundations.basic
  const [decks, check, logoSource] = await Promise.all([
    decksUsingBrand(slug),
    checkBrand(slug),
    getLogoSourceDataUrl(slug),
  ])
  const rows = leaves(brand)
  const groups = groupsIn(rows)
  const logoFile = basic.logo

  return (
    <>
      <PageHeader
        title={basic.name}
        subtitle={`brands/${slug}`}
        actions={
          <Button asChild className="h-9">
            <Link href={`/brands/${slug}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 px-6 pb-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tokens</CardTitle>
            <CardDescription>
              From brand-settings.json. Colour roles, type steps, and component
              paint. Spacing and the type scale stay in the design system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groups.map((group) => (
              <div key={group} className="mb-4 last:mb-0">
                <h3 className="mb-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                  {group}
                </h3>
                {rows
                  .filter((row) => row.group === group)
                  .map((row) => (
                    <TokenRow
                      key={row.path}
                      name={row.path}
                      value={displayValue(getPath(brand, row.path))}
                    />
                  ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">State</span>
                {basic.archived ? (
                  <Badge variant="outline">Archived</Badge>
                ) : (
                  <span>Active</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Theme</span>
                <span className="font-mono text-xs">
                  cover {brand.foundations.colorTheme?.cover ?? "—"} · slide{" "}
                  {brand.foundations.colorTheme?.slide ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Validation</span>
                {check.errors.length > 0 ? (
                  <Badge variant="destructive">
                    {check.errors.length} error
                    {check.errors.length === 1 ? "" : "s"}
                  </Badge>
                ) : check.warnings.length > 0 ? (
                  <Badge variant="secondary">
                    {check.warnings.length} warning
                    {check.warnings.length === 1 ? "" : "s"}
                  </Badge>
                ) : (
                  <span>Passes</span>
                )}
              </div>
              {(check.errors.length > 0 || check.warnings.length > 0) && (
                <ul className="grid gap-1 border-t pt-3 text-xs">
                  {check.errors.map((error) => (
                    <li key={error} className="text-destructive">
                      {error}
                    </li>
                  ))}
                  {check.warnings.map((warning) => (
                    <li key={warning} className="text-muted-foreground">
                      {warning}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>{logoFile ?? "No logo file"}</CardDescription>
            </CardHeader>
            <CardContent>
              {logoFile ? (
                // Served read-only from the working tree. Baked fills, not a sprite.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/repo/brands/${slug}/${logoFile}`}
                  alt={`${basic.name} logo`}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Missing.</p>
              )}

              {logoSource && basic.logoSource && (
                <div className="mt-4 grid gap-2 border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    From logo.dev ({basic.logoSource.domain}) — raster, kept
                    beside the SVG lockup.
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoSource}
                    alt={`${basic.name} logo from logo.dev`}
                    className="h-10 w-auto self-start object-contain"
                  />
                </div>
              )}

              <div className="mt-4">
                <LogoPicker
                  slug={slug}
                  brandName={basic.name}
                  domain={basic.domain}
                  configured={logoDevConfig()}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Decks</CardTitle>
              <CardDescription>
                {decks.length === 0
                  ? "No deck uses this brand."
                  : `${decks.length} deck${decks.length === 1 ? " references" : "s reference"} this slug.`}
              </CardDescription>
            </CardHeader>
            {decks.length > 0 && (
              <CardContent className="grid gap-3">
                {decks.map((deck) => (
                  <Link
                    key={deck.slug}
                    href={`/decks/${deck.slug}`}
                    className="group grid gap-2"
                  >
                    <SlideThumb
                      slug={deck.slug}
                      file="01.html"
                      className="rounded-md border"
                    />
                    <span className="text-sm group-hover:underline">
                      {deck.title}
                    </span>
                  </Link>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
