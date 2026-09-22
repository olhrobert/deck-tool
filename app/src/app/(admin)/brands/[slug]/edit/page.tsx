import { notFound } from "next/navigation"

import { getBrand } from "~/lib/brands"
import { isValidSlug } from "~/lib/repo"

import { BrandForm } from "./brand-form"

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  return { title: `Edit ${slug}` }
}

export default async function EditBrandPage({ params }: Params) {
  const { slug } = await params
  if (!isValidSlug(slug)) notFound()

  let brand
  try {
    brand = await getBrand(slug)
  } catch {
    notFound()
  }

  return <BrandForm slug={slug} brand={brand} />
}
