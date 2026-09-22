import type { LucideIcon } from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  locked?: boolean
  items?: NavItem[]
}

export type NavGroup = {
  label?: string
  items: NavItem[]
}
