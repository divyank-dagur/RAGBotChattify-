"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils";
import type { Message, Citation } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  citations: Citation[];
  className?: string;
}

export function MessageList({
  messages,
  isStreaming,
  citations,
  className,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isAutoScroll = useRef(true);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    isAutoScroll.current = true;
    setShowScrollBtn(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distFromBottom = scrollHeight - scrollTop - clientHeight;
      isAutoScroll.current = distFromBottom < 80;
      setShowScrollBtn(distFromBottom > 200);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll on new content
  useEffect(() => {
    if (isAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scroll-smooth"
      >
        <div className="mx-auto max-w-3xl py-6 space-y-1">
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isStreaming}
              isLast={i === messages.length - 1}
              citations={
                i === messages.length - 1 && msg.role === "assistant"
                  ? citations
                  : undefined
              }
              index={i}
            />
          ))}
          <div ref={bottomRef} className="h-px" />
        </div>
      </div>

      {/* Scroll-to-bottom FAB */}
      <div
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300",
          showScrollBtn
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none",
        )}
      >
        <Button
          variant="outline"
          size="icon-sm"
          onClick={scrollToBottom}
          className={cn(
            "rounded-full shadow-lg shadow-black/10 border-border/60",
            "bg-background/90 backdrop-blur-md",
            "hover:bg-ember-muted hover:border-ember/30 hover:text-ember",
            "transition-all duration-200",
          )}
        >
          <ArrowDown className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
