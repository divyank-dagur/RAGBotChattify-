"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { parseSSEStream } from "@/lib/stream-parser";
import type { Message, Citation } from "@/lib/types";
import { API_BASE_URL } from "@/lib/constants";

interface UseChatStreamReturn {
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  isStreaming: boolean;
  citations: Citation[];
  sendMessage: (content: string, chatId: string, strictRag?: boolean) => Promise<void>;
  stopStreaming: () => void;
}

export function useChatStream(): UseChatStreamReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string, chatId: string, strictRag?: boolean) => {
      // Abort any previous stream
      abortRef.current?.abort();

      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        role: "user",
        content,
        citations: null,
        attachments: null,
        token_count: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setCitations([]);

      const assistantMsg: Message = {
        id: `temp-assistant-${Date.now()}`,
        chat_id: chatId,
        role: "assistant",
        content: "",
        citations: null,
        attachments: null,
        token_count: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const token = localStorage.getItem("access_token");
        const res = await fetch(
          `${API_BASE_URL}/chats/${chatId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ content, strict_rag: strictRag || false }),
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error("Failed to send message");

        let accumulated = "";

        for await (const event of parseSSEStream(res)) {
          if (event.type === "token" && event.content) {
            accumulated += event.content;
            const snap = accumulated;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = { ...last, content: snap };
              }
              return updated;
            });
          } else if (event.type === "citation" && event.sources) {
            setCitations(event.sources);
          } else if (event.type === "error") {
            const errMsg = event.content || "An error occurred";
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: accumulated || errMsg,
                };
              }
              return updated;
            });
          } else if (event.type === "done") {
            const final_content = event.content || accumulated;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: final_content,
                  token_count: event.token_count || null,
                };
              }
              return updated;
            });
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant" && !last.content) {
              updated[updated.length - 1] = {
                ...last,
                content: "Sorry, an error occurred. Please try again.",
              };
            }
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [],
  );

  return {
    messages,
    setMessages,
    isStreaming,
    citations,
    sendMessage,
    stopStreaming,
  };
}
