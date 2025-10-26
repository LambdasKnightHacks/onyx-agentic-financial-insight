"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export function ChatTypingIndicator() {
  return (
    <div className="flex gap-3 mb-6">
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-lg px-4 py-3">
        <div className="flex gap-1">
          <div
            className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
