"use client";

import { useState } from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Share2,
  Check,
  MoreHorizontal,
  Trash2,
  Pencil,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title: string;
  modelId: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onShare?: () => Promise<string | null>;
  onExport?: (format: "markdown" | "json") => void;
  onRename?: (title: string) => void;
  onDelete?: () => void;
}

export function ChatHeader({
  title,
  modelId,
  sidebarOpen,
  onToggleSidebar,
  onShare,
  onExport,
  onRename,
  onDelete,
}: ChatHeaderProps) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const handleShare = async () => {
    if (!onShare) return;
    const url = await onShare();
    if (url) {
      await navigator.clipboard.writeText(window.location.origin + url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2500);
    }
  };

  return (
    <header
      className={cn(
        "relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/50 px-4",
        "bg-background/80 backdrop-blur-xl",
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3 min-w-0">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleSidebar}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              />
            }
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            {sidebarOpen ? "Close sidebar" : "Open sidebar"}
          </TooltipContent>
        </Tooltip>

        <div className="min-w-0 flex items-center gap-2.5">
          <h1 className="truncate text-sm font-medium tracking-tight">
            {title}
          </h1>
          <Badge
            variant="secondary"
            className="shrink-0 border-border/40 bg-secondary/60 text-[10px] font-normal tracking-wide uppercase text-muted-foreground"
          >
            {modelId.split("-").slice(0, 2).join("-")}
          </Badge>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {onShare && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleShare}
                  className="text-muted-foreground hover:text-ember"
                />
              }
            >
              {shareState === "copied" ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Share2 className="size-3.5" />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {shareState === "copied" ? "Link copied" : "Share chat"}
            </TooltipContent>
          </Tooltip>
        )}

        {(onRename || onDelete || onExport) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRename && (
                <DropdownMenuItem
                  onClick={() => {
                    const name = prompt("Rename chat:", title);
                    if (name?.trim()) onRename(name.trim());
                  }}
                  className="cursor-pointer gap-2"
                >
                  <Pencil className="size-3.5" />
                  Rename
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem
                  onClick={() => onExport("markdown")}
                  className="cursor-pointer gap-2"
                >
                  <Download className="size-3.5" />
                  Export Markdown
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem
                  onClick={() => onExport("json")}
                  className="cursor-pointer gap-2"
                >
                  <Download className="size-3.5" />
                  Export JSON
                </DropdownMenuItem>
              )}
              {(onRename || onExport) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onDelete}
                  className="cursor-pointer gap-2"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Bottom edge glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ember/15 to-transparent" />
    </header>
  );
}
