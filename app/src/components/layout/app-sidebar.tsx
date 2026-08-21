"use client"

import Link from "next/link"
import { LayersIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { sidebarData } from "~/data/sidebar-data"
import { NavGroup } from "./nav-group"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-12 flex-row items-center gap-2 px-3 group-data-[collapsible=icon]:px-2">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:hidden"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md border">
            <LayersIcon className="size-3.5" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">
            Deck Tool
          </span>
        </Link>
        {/* Stays visible when collapsed — the rail alone is a 16px target and
            leaves no way back for anyone who does not find it. */}
        <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:mx-auto" />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.map((group, i) => (
          <NavGroup key={group.label ?? i} group={group} />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
