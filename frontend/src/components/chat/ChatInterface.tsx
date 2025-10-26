"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ChatEmptyState } from "./ChatEmptyState";
import { useChatSession } from "@/components/hooks/useChatSession";

interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const { messages, sessionId, isLoading, error, sendMessage, clearChat } =
    useChatSession(userId);
  const [inputValue, setInputValue] = useState("");

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    await sendMessage(inputValue);
    setInputValue("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <Card className="flex flex-col h-full w-full rounded-none border-x-0 border-b-0">
      {/* <ChatHeader onClearChat={clearChat} /> */}

      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          <>
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              sessionId={sessionId}
            />
            {error && (
              <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isLoading}
        placeholder="Ask about your spending, budgets, or financial insights..."
      />
    </Card>
  );
}
