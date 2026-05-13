"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUp, Paperclip, Square, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ModelSelector } from "./model-selector";
import { CollectionSelector } from "./collection-selector";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string, strictRag: boolean) => void;
  onStop?: () => void;
  isStreaming: boolean;
  modelId: string;
  onModelChange: (id: string) => void;
  collectionId: string | null;
  onCollectionChange: (id: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  onSend,
  onStop,
  isStreaming,
  modelId,
  onModelChange,
  collectionId,
  onCollectionChange,
  disabled = false,
  className,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [isMac, setIsMac] = useState(false);
  const [strictRag, setStrictRag] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /Mac/i.test(navigator.platform));
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed, strictRag);
    setValue("");
    // Re-focus after send
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [value, isStreaming, disabled, onSend, strictRag]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div className={cn("relative px-4 pb-4 pt-2", className)}>
      {/* Gradient fade from chat area */}
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-background to-transparent" />

      {/* Input container */}
      <div
        className={cn(
          "noise-texture relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl",
          "border border-border/60 bg-surface-raised shadow-lg shadow-black/[0.03]",
          "transition-all duration-300",
          "focus-within:border-ember/30 focus-within:shadow-xl focus-within:shadow-ember/[0.04]",
          "dark:shadow-black/20 dark:focus-within:shadow-ember/[0.06]",
        )}
      >
        {/* Textarea */}
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          minRows={1}
          maxRows={8}
          disabled={disabled}
          className={cn(
            "w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm leading-relaxed",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          {/* Left tools */}
          <div className="flex items-center gap-1.5">
            <ModelSelector
              value={modelId}
              onChange={onModelChange}
              compact
            />

            <CollectionSelector
              value={collectionId}
              onChange={onCollectionChange}
            />

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={strictRag ? "outline" : "ghost"}
                    size="icon-xs"
                    onClick={() => setStrictRag(!strictRag)}
                    className={cn(
                      "transition-all duration-200",
                      strictRag
                        ? "border-ember/40 bg-ember-muted text-ember"
                        : "text-muted-foreground/60 hover:text-muted-foreground",
                    )}
                  />
                }
              >
                <ShieldCheck className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                {strictRag ? "Strict RAG: ON — answers only from documents" : "Strict RAG: OFF — answers from documents + LLM"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground/60 hover:text-muted-foreground"
                  />
                }
              >
                <Paperclip className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: hint + send */}
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] tracking-wide text-muted-foreground/40 sm:block">
              Shift+Enter for new line
            </span>

            {isStreaming ? (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={onStop}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Square className="size-3 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon-sm"
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "transition-all duration-300",
                  canSend
                    ? "bg-ember text-ember-foreground shadow-md shadow-ember/20 hover:shadow-lg hover:shadow-ember/30 hover:brightness-110"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {disabled ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="size-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
