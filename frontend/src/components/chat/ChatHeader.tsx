"use client";

import { MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatHeaderProps {
  onClearChat: () => void;
}

export function ChatHeader({ onClearChat }: ChatHeaderProps) {
  return (
    <div className="border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">FinFlow AI Assistant</h2>
          <p className="text-xs text-muted-foreground">
            Your personal financial advisor
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all messages in this conversation. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearChat}>Clear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
