"use client";

import { cn } from "@/src/lib/utils";
import { useState } from "react";
import { Search, RefreshCw, User, LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/components/auth-context";
import { signout } from "@/src/lib/auth-actions";

import { useRouter } from "next/navigation";

export function AppHeader() {
  const router = useRouter();
  const [lastSync, setLastSync] = useState("2m ago");
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLastSync("Just now");
    setIsSyncing(false);
  };

  const handleSignOut = async () => {
    await signout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
      <div className="flex-1" />{" "}
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="text-xs">
          Last synced {lastSync}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")}
          />
          Sync Now
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email || "My Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
