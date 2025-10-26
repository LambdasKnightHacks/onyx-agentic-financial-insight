import { useState, useCallback } from "react";
import { ChatMessage, ChatResponse } from "@/lib/types";
import { sendChatMessage } from "@/lib/chat-api";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useChatSession(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => uuidv4());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        status: "sending",
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Call backend API
        const response = await sendChatMessage(userId, content, sessionId);

        // Update session ID if new
        if (response.session_id !== sessionId) {
          setSessionId(response.session_id);
        }

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: response.message,
          charts: response.charts,
          timestamp: response.timestamp,
          status: "sent",
        };

        setMessages((prev) => {
          // Update user message status
          const updated = prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, status: "sent" as const }
              : msg
          );
          return [...updated, assistantMessage];
        });
      } catch (err) {
        console.error("Failed to send message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");

        // Update user message to show error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, status: "error" as const }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userId, sessionId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(uuidv4());
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
