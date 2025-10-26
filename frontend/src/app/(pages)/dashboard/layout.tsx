import type React from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { AppHeader } from "@/src/components/app-header";
import { ProtectedRoute } from "@/src/components/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppSidebar />
      <div className="ml-64">
        <AppHeader />
        <main className="min-h-[calc(100vh-4rem)] pt-22 p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
