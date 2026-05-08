"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatHeader } from "@/components/chat/chat-header";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useSidebar } from "@/hooks/use-sidebar";
import { api } from "@/lib/api-client";
import type { ChatWithMessages } from "@/lib/types";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sidebar = useSidebar();
  const stream = useChatStream();
  const chatId = params.chatId as string;

  const [title, setTitle] = useState("Chat");
  const [modelId, setModelId] = useState("gpt-4o-mini");
  const [loaded, setLoaded] = useState(false);
  const initialSentRef = useRef(false);
  const loadedChatIdRef = useRef<string | null>(null);

  // Load chat data — with cleanup flag to prevent stale updates
  useEffect(() => {
    let cancelled = false;
    initialSentRef.current = false;
    setLoaded(false);

    const loadChat = async () => {
      try {
        const chat = await api.get<ChatWithMessages>(`/chats/${chatId}`);
        if (cancelled) return;
        setTitle(chat.title);
        setModelId(chat.model_id);
        stream.setMessages(chat.messages);
        loadedChatIdRef.current = chatId;
        setLoaded(true);
      } catch {
        if (!cancelled) router.replace("/");
      }
    };
    loadChat();

    return () => {
      cancelled = true;
    };
    // stream.setMessages is stable (from useState), safe to omit stream object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, router]);

  // Handle initial query from new chat redirect
  useEffect(() => {
    if (!loaded || initialSentRef.current) return;
    if (loadedChatIdRef.current !== chatId) return;

    const q = searchParams.get("q");
    if (q) {
      initialSentRef.current = true;
      stream.sendMessage(q, chatId);
      router.replace(`/c/${chatId}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, chatId, searchParams, router]);

  const handleSend = useCallback(
    (content: string) => {
      stream.sendMessage(content, chatId);
    },
    // sendMessage is stable (useCallback with [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId],
  );

  const handleModelChange = useCallback(
    async (id: string) => {
      const prev = modelId;
      setModelId(id);
      try {
        await api.patch(`/chats/${chatId}`, { model_id: id });
      } catch {
        setModelId(prev); // Actually revert on failure
      }
    },
    [chatId, modelId],
  );

  const handleShare = useCallback(async () => {
    try {
      const res = await api.post<{ url: string }>(`/chats/${chatId}/share`);
      return res.url;
    } catch {
      return null;
    }
  }, [chatId]);

  const handleRename = useCallback(
    async (newTitle: string) => {
      const prev = title;
      setTitle(newTitle);
      try {
        await api.patch(`/chats/${chatId}`, { title: newTitle });
      } catch {
        setTitle(prev); // Actually revert on failure
      }
    },
    [chatId, title],
  );

  const handleDelete = useCallback(async () => {
    try {
      await api.del(`/chats/${chatId}`);
      router.push("/");
    } catch {
      // Handle error
    }
  }, [chatId, router]);

  return (
    <>
      <ChatHeader
        title={title}
        modelId={modelId}
        sidebarOpen={sidebar.isOpen}
        onToggleSidebar={sidebar.toggle}
        onShare={handleShare}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      <ChatPanel
        messages={stream.messages}
        isStreaming={stream.isStreaming}
        citations={stream.citations}
        modelId={modelId}
        onModelChange={handleModelChange}
        onSendMessage={handleSend}
        onStopStreaming={stream.stopStreaming}
      />
    </>
  );
}
