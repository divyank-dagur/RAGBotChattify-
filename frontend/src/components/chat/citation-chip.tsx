"use client";

import { useState } from "react";
import { FileText, X, ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/types";

interface CitationChipProps {
  citation: Citation;
  index: number;
  className?: string;
}

export function CitationChip({ citation, index, className }: CitationChipProps) {
  const [expanded, setExpanded] = useState(false);
  const confidence = Math.round((1 - citation.score) * 100);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "group/cite inline-flex items-center gap-1 rounded-md border px-2 py-0.5",
            "text-xs font-medium transition-all duration-200 cursor-pointer",
            expanded
              ? "border-ember/40 bg-ember-muted text-ember shadow-[0_0_12px_-3px] shadow-ember/20"
              : "border-ember/20 bg-ember-muted text-ember hover:border-ember/40 hover:shadow-[0_0_12px_-3px] hover:shadow-ember/20",
            className,
          )}
        >
          <FileText className="size-3 opacity-70" />
          <span className="max-w-[120px] truncate">{citation.source}</span>
          <span className="ml-0.5 rounded bg-ember/10 px-1 text-[10px] tabular-nums text-ember/80">
            [{index + 1}]
          </span>
          <ChevronDown className={cn(
            "size-2.5 opacity-50 transition-transform duration-200",
            expanded && "rotate-180",
          )} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <span>{confidence}% match — click to {expanded ? "collapse" : "expand"}</span>
        </TooltipContent>
      </Tooltip>

      {/* Expanded source preview panel */}
      {expanded && (
        <div className="w-full animate-float-in rounded-lg border border-ember/20 bg-surface-raised p-3 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-3.5 text-ember" />
              <span className="text-xs font-medium">{citation.source}</span>
              <span className="rounded bg-ember/10 px-1.5 py-0.5 text-[10px] tabular-nums text-ember/70">
                Chunk #{citation.chunk_index + 1}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {confidence}% match
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setExpanded(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </Button>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {citation.content}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
