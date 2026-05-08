"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { api } from "@/lib/api-client";
import type { Chat } from "@/lib/types";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<Chat[]>([]);

  const activeChatId = pathname?.startsWith("/c/")
    ? pathname.split("/c/")[1]
    : null;

  const fetchChats = useCallback(async () => {
    try {
      const data = await api.get<Chat[]>("/chats");
      setChats(data);
    } catch {
      // Silently fail if not authenticated
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) fetchChats();
  }, [user, fetchChats]);

  const handleNewChat = async () => {
    try {
      const chat = await api.post<Chat>("/chats", { title: "New Chat" });
      setChats((prev) => [chat, ...prev]);
      router.push(`/c/${chat.id}`);
    } catch {
      // Handle error
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await api.del(`/chats/${id}`);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) router.push("/");
    } catch {
      // Handle error
    }
  };

  const handleSelectChat = (id: string) => {
    router.push(`/c/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <ChatLayoutInner
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNavigateKnowledge={() => router.push("/knowledge")}
      >
        {children}
      </ChatLayoutInner>
    </SidebarProvider>
  );
}

function ChatLayoutInner({
  children,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onNavigateKnowledge,
}: {
  children: React.ReactNode;
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNavigateKnowledge: () => void;
}) {
  const sidebar = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isOpen={sidebar.isOpen}
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={onNewChat}
        onSelectChat={onSelectChat}
        onDeleteChat={onDeleteChat}
        onNavigateKnowledge={onNavigateKnowledge}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
