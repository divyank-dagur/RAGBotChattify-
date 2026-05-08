"use client";

import { useState, useMemo } from "react";
import { Check, Copy, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { StreamingText } from "./streaming-text";
import { CitationChip } from "./citation-chip";
import type { Message, Citation } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isLast?: boolean;
  citations?: Citation[];
  index: number;
}

export function MessageBubble({
  message,
  isStreaming = false,
  isLast = false,
  citations,
  index,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isUser = message.role === "user";

  const formattedTime = useMemo(() => {
    const d = new Date(message.created_at);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [message.created_at]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group/msg relative flex gap-3 px-4 py-3 animate-message-appear",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
          isUser
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-ember-muted text-ember shadow-sm shadow-ember/5",
        )}
      >
        {isUser ? (
          <User className="size-4" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {/* Subtle glow ring for assistant when streaming */}
        {!isUser && isStreaming && isLast && (
          <div className="absolute inset-0 rounded-lg animate-pulse-glow" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "relative min-w-0 max-w-[75%] space-y-2",
          isUser ? "items-end text-right" : "items-start",
        )}
      >
        {/* Message body */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl px-4 py-3 text-sm leading-relaxed",
            "transition-shadow duration-300",
            isUser
              ? "rounded-tr-md bg-primary text-primary-foreground shadow-sm"
              : [
                  "rounded-tl-md bg-surface-raised shadow-sm",
                  "border border-border/50",
                  "dark:bg-surface-raised dark:shadow-none",
                ],
          )}
        >
          {/* Glass noise texture on assistant bubbles */}
          {!isUser && <div className="noise-texture pointer-events-none" />}

          {/* Content rendering */}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : isStreaming && isLast ? (
            <div className="chat-prose">
              <StreamingText content={message.content} isStreaming />
            </div>
          ) : (
            <div className="chat-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citations row */}
        {!isUser && citations && citations.length > 0 && !isStreaming && (
          <div className="flex flex-wrap gap-1.5 px-1 animate-float-in">
            {citations.map((c, i) => (
              <CitationChip key={`${c.source}-${i}`} citation={c} index={i} />
            ))}
          </div>
        )}

        {/* Actions + timestamp */}
        <div
          className={cn(
            "flex items-center gap-2 px-1 transition-all duration-200",
            isUser ? "flex-row-reverse" : "flex-row",
            hovered ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Timestamp */}
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {formattedTime}
          </span>

          {/* Copy for assistant */}
          {!isUser && !isStreaming && message.content && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground"
                  />
                }
              >
                {copied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
