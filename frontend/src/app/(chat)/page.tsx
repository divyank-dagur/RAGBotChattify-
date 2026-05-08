"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatHeader } from "@/components/chat/chat-header";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useSidebar } from "@/hooks/use-sidebar";
import { api } from "@/lib/api-client";
import type { Chat } from "@/lib/types";

export default function NewChatPage() {
  const router = useRouter();
  const sidebar = useSidebar();
  const stream = useChatStream();
  const [modelId, setModelId] = useState("gpt-4o-mini");

  const handleSend = useCallback(
    async (content: string) => {
      // Create a new chat then send the message
      try {
        const chat = await api.post<Chat>("/chats", {
          title: content.slice(0, 80),
          model_id: modelId,
        });
        // Navigate to the chat page which will handle the message
        router.push(`/c/${chat.id}?q=${encodeURIComponent(content)}`);
      } catch {
        // Handle error
      }
    },
    [modelId, router],
  );

  return (
    <>
      <ChatHeader
        title="New Chat"
        modelId={modelId}
        sidebarOpen={sidebar.isOpen}
        onToggleSidebar={sidebar.toggle}
      />
      <ChatPanel
        messages={stream.messages}
        isStreaming={stream.isStreaming}
        citations={stream.citations}
        modelId={modelId}
        onModelChange={setModelId}
        onSendMessage={handleSend}
        onStopStreaming={stream.stopStreaming}
      />
    </>
  );
}
