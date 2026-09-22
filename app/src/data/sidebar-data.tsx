import {
  LayoutDashboardIcon,
  PresentationIcon,
  PaletteIcon,
  BlocksIcon,
  SettingsIcon,
} from "lucide-react"
import type { NavGroup } from "~/components/layout/types"

export const sidebarData: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboardIcon,
      },
      {
        title: "Decks",
        url: "/decks",
        icon: PresentationIcon,
      },
    ],
  },
  {
    label: "Design",
    items: [
      {
        title: "Brands",
        url: "/brands",
        icon: PaletteIcon,
      },
      {
        title: "Presets",
        url: "/presets",
        icon: BlocksIcon,
        locked: true,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Settings",
        url: "/settings",
        icon: SettingsIcon,
        locked: true,
      },
    ],
  },
]
