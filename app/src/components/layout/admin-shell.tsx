"use client"

import { cn } from "~/lib/utils"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { Toaster } from "~/components/ui/sonner"
import { AppSidebar } from "./app-sidebar"
import { Header } from "./header"
import { BreadcrumbTitleProvider } from "./breadcrumb-title"

export function AdminShell({
  children,
  defaultOpen,
}: {
  children: React.ReactNode
  defaultOpen: boolean
}) {
  return (
    <BreadcrumbTitleProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <div
            className={cn(
              "flex h-full w-full min-w-0 flex-col",
              "has-[div[data-layout=fixed]]:h-svh",
              "group-data-[scroll-locked=1]/body:h-full",
              "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh"
            )}
          >
            {children}
          </div>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbTitleProvider>
  )
}
