"use client"

import * as React from "react"

type BreadcrumbTitleContextValue = {
  title: string
  setTitle: (title: string) => void
}

const BreadcrumbTitleContext =
  React.createContext<BreadcrumbTitleContextValue | null>(null)

export function BreadcrumbTitleProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [title, setTitle] = React.useState("")
  const value = React.useMemo(() => ({ title, setTitle }), [title])
  return (
    <BreadcrumbTitleContext.Provider value={value}>
      {children}
    </BreadcrumbTitleContext.Provider>
  )
}

export function useBreadcrumbTitle() {
  const ctx = React.useContext(BreadcrumbTitleContext)
  if (!ctx) {
    throw new Error(
      "useBreadcrumbTitle must be used within BreadcrumbTitleProvider"
    )
  }
  return ctx
}
