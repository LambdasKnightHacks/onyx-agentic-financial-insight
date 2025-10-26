"use client";

import { ChatInterface } from "@/src/components/chat/ChatInterface";
import { useAuth } from "@/src/components/auth-context";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function ChatPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Please log in to use the chat feature.
        </p>
      </div>
    );
  }

  return (
    <div className="-m-8 h-[calc(100vh-4rem)]">
      <ChatInterface userId={user.id} />
    </div>
  );
}
