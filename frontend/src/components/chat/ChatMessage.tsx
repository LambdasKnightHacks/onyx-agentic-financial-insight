"use client";

import { ChatMessage as ChatMessageType } from "@/src/lib/types";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Bot, User, AlertCircle, Check, Clock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ChatChartRenderer } from "./ChatChartRenderer";

interface ChatMessageProps {
  message: ChatMessageType;
  sessionId?: string;
}

export function ChatMessage({ message, sessionId }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 mb-6", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback
          className={cn(
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn("flex-1 space-y-2", isUser && "flex flex-col items-end")}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-3 max-w-[80%] wrap-break-word",
            isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Show charts if present */}
        {message.charts && message.charts.length > 0 && (
          <div
            className={cn(
              "space-y-4",
              isUser ? "max-w-[90%] ml-auto" : "w-full max-w-full"
            )}
          >
            {message.charts.map((chart, idx) => (
              <ChatChartRenderer
                key={idx}
                chartData={chart}
                sessionId={sessionId}
              />
            ))}
          </div>
        )}

        {/* Message status */}
        {message.status && message.status !== "sent" && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
            {message.status === "sending" && (
              <>
                <Clock className="h-3 w-3" />
                <span>Sending...</span>
              </>
            )}
            {message.status === "error" && (
              <>
                <AlertCircle className="h-3 w-3 text-destructive" />
                <span className="text-destructive">Failed to send</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
