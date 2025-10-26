import { ChatRequest, ChatResponse, ChatMessage } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function sendChatMessage(
  userId: string,
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      message,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getChatHistory(
  userId: string,
  sessionId: string
): Promise<ChatMessage[]> {
  // Implement if you add chat history storage
  // For now, return empty array
  return [];
}
