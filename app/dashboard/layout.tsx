import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AppSidebar />
      <div className="ml-64">
        <AppHeader />
        <main className="min-h-[calc(100vh-4rem)] p-8">{children}</main>
      </div>
    </>
  )
}
