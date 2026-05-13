"use client";

import { Sparkles, ArrowRight, BookOpen, Code, FileSearch } from "lucide-react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { cn } from "@/lib/utils";
import type { Message, Citation } from "@/lib/types";

interface ChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  citations: Citation[];
  modelId: string;
  onModelChange: (id: string) => void;
  collectionId: string | null;
  onCollectionChange: (id: string | null) => void;
  onSendMessage: (content: string, strictRag?: boolean) => void;
  onStopStreaming: () => void;
  className?: string;
}

const SUGGESTION_PROMPTS = [
  {
    icon: Code,
    label: "Write code",
    prompt: "Write a Python function that implements binary search with clear comments",
  },
  {
    icon: FileSearch,
    label: "Analyze data",
    prompt: "Explain how to approach exploratory data analysis on a new dataset",
  },
  {
    icon: BookOpen,
    label: "Explain concept",
    prompt: "Explain how transformer attention mechanisms work in simple terms",
  },
];

export function ChatPanel({
  messages,
  isStreaming,
  citations,
  modelId,
  onModelChange,
  collectionId,
  onCollectionChange,
  onSendMessage,
  onStopStreaming,
  className,
}: ChatPanelProps) {
  const isEmpty = messages.length === 0;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {isEmpty ? (
        /* ── Empty state ── */
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="relative mb-8">
            {/* Branded gradient orb */}
            <div
              className="size-20 rounded-3xl bg-ember/10 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, var(--ember-muted) 0%, transparent 70%)",
              }}
            >
              <div className="size-14 rounded-2xl bg-ember/15 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="size-7 text-ember" />
              </div>
            </div>
            {/* Ambient glow */}
            <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-ember/5 blur-2xl" />
          </div>

          <h2 className="mb-2 text-xl font-semibold tracking-tight">
            RAGBot Chattify
          </h2>
          <p className="mb-10 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
            AI-powered conversations grounded in your documents.
            Ask anything, or try a suggestion below.
          </p>

          {/* Suggestion cards */}
          <div className="grid w-full max-w-lg gap-2.5 sm:grid-cols-3">
            {SUGGESTION_PROMPTS.map((s) => (
              <button
                key={s.label}
                onClick={() => onSendMessage(s.prompt)}
                className={cn(
                  "noise-texture group relative flex flex-col gap-2 rounded-xl border border-border/50 p-4 text-left",
                  "bg-surface-raised transition-all duration-300",
                  "hover:border-ember/25 hover:shadow-md hover:shadow-ember/[0.04]",
                  "hover:-translate-y-0.5",
                  "active:translate-y-0",
                )}
              >
                <s.icon className="size-4 text-ember/70 transition-colors group-hover:text-ember" />
                <span className="text-xs font-medium">{s.label}</span>
                <ArrowRight className="absolute bottom-3.5 right-3.5 size-3 text-muted-foreground/30 transition-all group-hover:text-ember/50 group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Message list ── */
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          citations={citations}
        />
      )}

      {/* ── Input ── */}
      <MessageInput
        onSend={onSendMessage}
        onStop={onStopStreaming}
        isStreaming={isStreaming}
        modelId={modelId}
        onModelChange={onModelChange}
        collectionId={collectionId}
        onCollectionChange={onCollectionChange}
      />
    </div>
  );
}
