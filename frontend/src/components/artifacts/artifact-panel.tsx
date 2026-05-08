"use client";

import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/lib/types";

interface ArtifactPanelProps {
  artifact: Artifact;
  onClose: () => void;
  onUpdate?: (content: string) => void;
}

export function ArtifactPanel({
  artifact,
  onClose,
  onUpdate,
}: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editContent, setEditContent] = useState(artifact.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext =
      artifact.kind === "code"
        ? artifact.language === "python"
          ? ".py"
          : artifact.language === "javascript"
            ? ".js"
            : artifact.language === "typescript"
              ? ".ts"
              : ".txt"
        : artifact.kind === "markdown"
          ? ".md"
          : ".txt";
    const blob = new Blob([editContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasChanges = editContent !== artifact.content;

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border/50 bg-surface transition-all duration-300",
        expanded ? "fixed inset-0 z-50" : "w-[480px]",
      )}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/50 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <h3 className="truncate text-sm font-medium">{artifact.title}</h3>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {artifact.language || artifact.kind}
          </Badge>
          {artifact.version > 1 && (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              v{artifact.version}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
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

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDownload}
                  className="text-muted-foreground hover:text-foreground"
                />
              }
            >
              <Download className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setExpanded(!expanded)}
                  className="text-muted-foreground hover:text-foreground"
                />
              }
            >
              {expanded ? (
                <Minimize2 className="size-3" />
              ) : (
                <Maximize2 className="size-3" />
              )}
            </TooltipTrigger>
            <TooltipContent>{expanded ? "Collapse" : "Expand"}</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative flex-1 overflow-hidden">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          spellCheck={false}
          className={cn(
            "size-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed",
            "focus:outline-none",
            "placeholder:text-muted-foreground/40",
          )}
        />
      </div>

      {/* Save bar */}
      {hasChanges && onUpdate && (
        <div className="flex items-center justify-end gap-2 border-t border-border/50 bg-surface-raised px-4 py-2.5 animate-float-in">
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditContent(artifact.content)}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={() => onUpdate(editContent)}
            className="bg-ember text-ember-foreground hover:brightness-110"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
