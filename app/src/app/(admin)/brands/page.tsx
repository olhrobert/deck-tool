import { PageHeader } from "~/components/layout/page-header"
import { listBrands } from "~/lib/brands"

import { BrandsTable } from "./brands-table"
import { NewBrandDialog } from "./new-brand-dialog"

export const metadata = { title: "Brands" }

export default async function BrandsPage() {
  const brands = await listBrands()

  return (
    <>
      <PageHeader
        title="Brands"
        subtitle="A brand is a token override, not a fork of the design system."
        actions={<NewBrandDialog />}
      />
      <div className="px-6 pb-6">
        <BrandsTable brands={brands} />
      </div>
    </>
  )
}
