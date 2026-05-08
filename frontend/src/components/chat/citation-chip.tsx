"use client";

import { FileText } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/types";

interface CitationChipProps {
  citation: Citation;
  index: number;
  className?: string;
}

export function CitationChip({ citation, index, className }: CitationChipProps) {
  const confidence = Math.round((1 - citation.score) * 100);

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "group/cite inline-flex items-center gap-1 rounded-md border border-ember/20 bg-ember-muted px-2 py-0.5",
          "text-xs font-medium text-ember transition-all duration-200",
          "hover:border-ember/40 hover:bg-ember-muted hover:shadow-[0_0_12px_-3px] hover:shadow-ember/20",
          "cursor-default",
          className,
        )}
      >
        <FileText className="size-3 opacity-70" />
        <span className="max-w-[120px] truncate">{citation.source}</span>
        <span className="ml-0.5 rounded bg-ember/10 px-1 text-[10px] tabular-nums text-ember/80">
          [{index + 1}]
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{citation.source}</span>
            <span className="text-[10px] tabular-nums opacity-70">
              {confidence}% match
            </span>
          </div>
          <p className="line-clamp-3 text-[11px] leading-relaxed opacity-80">
            {citation.content}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
