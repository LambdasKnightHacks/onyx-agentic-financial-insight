"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Lightbulb,
  ShieldAlert,
  Zap,
  Settings,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "AI Chat", icon: MessageCircle },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
  },
  { href: "/dashboard/insights", label: "Insights", icon: Lightbulb },
  { href: "/dashboard/alerts", label: "Alerts", icon: ShieldAlert },
  { href: "/dashboard/automations", label: "Automations", icon: Zap },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-semibold text-sidebar-foreground">
          MyFinance
        </h1>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
