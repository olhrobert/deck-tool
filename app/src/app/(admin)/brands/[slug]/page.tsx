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
import {
  checkBrand,
  decksUsingBrand,
  getBrand,
  getFigmaMode,
  getLogoSourceDataUrl,
  getLogoSvg,
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

  const [decks, figmaMode, logo, check, logoSource] = await Promise.all([
    decksUsingBrand(slug),
    getFigmaMode(brand.name),
    getLogoSvg(slug),
    checkBrand(slug),
    getLogoSourceDataUrl(slug),
  ])
  const logoSymbolId = logo?.match(/<symbol[^>]*\bid="([^"]+)"/)?.[1] ?? null

  return (
    <>
      <PageHeader
        title={brand.name}
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
            <CardTitle>Colours</CardTitle>
            <CardDescription>
              Only these keys become CSS variables. Spacing, type scale and
              weights stay in the design system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(brand.colors).map(([key, value]) => (
              <TokenRow key={key} name={key} value={value} />
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
                {brand.archived ? (
                  <Badge variant="outline">Archived</Badge>
                ) : (
                  <span>Active</span>
                )}
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Figma mode</span>
                <span className="font-mono text-xs">
                  {figmaMode ? figmaMode.modeId : "none"}
                </span>
              </div>
              {(check.errors.length > 0 || check.warnings.length > 0) && (
                <ul className="grid gap-1 border-t pt-3 text-xs">
                  {check.errors.map((e) => (
                    <li key={e} className="text-destructive">
                      {e}
                    </li>
                  ))}
                  {check.warnings.map((w) => (
                    <li key={w} className="text-muted-foreground">
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>{brand.logo}</CardDescription>
            </CardHeader>
            <CardContent>
              {logo ? (
                <div
                  className="flex h-16 items-center"
                  style={{ color: brand.colors.text }}
                >
                  {/* The file is a <symbol> sprite, which renders nothing on
                      its own — inject it hidden and <use> the symbol. It comes
                      from the repo, not from user input. */}
                  <div
                    className="hidden"
                    dangerouslySetInnerHTML={{ __html: logo }}
                  />
                  {logoSymbolId ? (
                    <svg className="h-8 w-auto" aria-label={`${brand.name} logo`}>
                      <use href={`#${logoSymbolId}`} />
                    </svg>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No &lt;symbol id&gt; to render.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Missing.</p>
              )}

              {logoSource && brand.logoSource && (
                <div className="mt-4 grid gap-2 border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    From logo.dev ({brand.logoSource.domain}) — raster, so it is
                    not the deck sprite.
                  </p>
                  {/* Data URL from the repo; next/image would need a loader. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoSource}
                    alt={`${brand.name} logo from logo.dev`}
                    className="h-10 w-auto self-start object-contain"
                  />
                </div>
              )}

              <div className="mt-4">
                <LogoPicker
                  slug={slug}
                  brandName={brand.name}
                  domain={brand.domain}
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
                    {/* The deck's first slide, rendered with this brand. */}
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

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Type, radius and borders</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 md:grid-cols-3">
            <div>
              {Object.entries(brand.fonts).map(([key, value]) => (
                <TokenRow key={key} name={`fonts.${key}`} value={value} />
              ))}
            </div>
            <div>
              {Object.entries(brand.borderRadius).map(([key, value]) => (
                <TokenRow key={key} name={`radius.${key}`} value={value} />
              ))}
            </div>
            <div>
              {Object.entries(brand.borderSize).flatMap(([group, sides]) =>
                Object.entries(sides).map(([side, value]) => (
                  <TokenRow
                    key={`${group}.${side}`}
                    name={`${group}.${side}`}
                    value={value}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
