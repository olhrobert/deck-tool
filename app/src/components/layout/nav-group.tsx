"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LockIcon } from "lucide-react"
import type { NavGroup as NavGroupType } from "./types"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "~/components/ui/sidebar"

export function NavGroup({ group }: { group: NavGroupType }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.locked ? (
                <SidebarMenuButton
                  tooltip={item.title}
                  disabled
                  className="opacity-50"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <LockIcon className="ml-auto !size-3" />
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={pathname === item.url}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
