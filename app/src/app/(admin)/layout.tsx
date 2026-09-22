import { cookies } from "next/headers"
import { AdminShell } from "~/components/layout/admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sidebarDefaultOpen =
    cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <AdminShell defaultOpen={sidebarDefaultOpen}>{children}</AdminShell>
  )
}
