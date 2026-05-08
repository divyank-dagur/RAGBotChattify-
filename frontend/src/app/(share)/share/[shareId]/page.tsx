"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sparkles, ExternalLink } from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { ChatWithMessages } from "@/lib/types";
import Link from "next/link";

export default function SharedChatPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [chat, setChat] = useState<ChatWithMessages | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<ChatWithMessages>(`/share/${shareId}`)
      .then(setChat)
      .catch(() => setError(true));
  }, [shareId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Link expired or not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This shared chat is no longer available.
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-4">
              Go to RAGBot Chattify
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-ember-muted">
              <Sparkles className="size-3.5 text-ember" />
            </div>
            <h1 className="text-sm font-medium">{chat.title}</h1>
            <Badge variant="secondary" className="text-[10px]">
              Shared
            </Badge>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-1.5">
              Try RAGBot Chattify
              <ExternalLink className="size-3" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="mx-auto max-w-3xl py-6">
        {chat.messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
