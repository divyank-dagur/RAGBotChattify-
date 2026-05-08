"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingText({
  content,
  isStreaming,
  className,
}: StreamingTextProps) {
  return (
    <div className={cn("relative", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span
          className="animate-cursor-blink ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] rounded-full bg-ember"
          aria-hidden
        />
      )}
    </div>
  );
}
