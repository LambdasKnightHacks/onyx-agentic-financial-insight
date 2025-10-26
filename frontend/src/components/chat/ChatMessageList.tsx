"use client";

import { ChatMessage as ChatMessageType } from "@/src/lib/types";
import { ChatMessage } from "./ChatMessage";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import { useChatScroll } from "@/src/components/hooks/useChatScroll";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  sessionId?: string;
}

export function ChatMessageList({
  messages,
  isLoading,
  sessionId,
}: ChatMessageListProps) {
  const scrollRef = useChatScroll([messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} sessionId={sessionId} />
      ))}
      {isLoading && <ChatTypingIndicator />}
    </div>
  );
}
