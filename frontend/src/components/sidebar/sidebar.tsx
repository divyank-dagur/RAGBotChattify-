"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Plus, Sparkles, BookOpen, LogOut, Sun, Moon, GripVertical } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ChatList } from "./chat-list";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { Chat } from "@/lib/types";

interface SidebarProps {
  isOpen: boolean;
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNavigateKnowledge: () => void;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 288; // 18rem = w-72

export function Sidebar({
  isOpen,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onNavigateKnowledge,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => setMounted(true), []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "relative flex h-full flex-col border-r border-border/50 bg-sidebar transition-[width] ease-out",
        isOpen ? "" : "w-0 overflow-hidden border-r-0",
        isDragging ? "duration-0" : "duration-300",
      )}
      style={isOpen ? { width: `${width}px` } : undefined}
    >
      {/* Drag handle */}
      {isOpen && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute right-0 top-0 z-20 flex h-full w-1.5 cursor-col-resize items-center justify-center",
            "hover:bg-ember/10 active:bg-ember/20 transition-colors",
            isDragging && "bg-ember/20",
          )}
        >
          <div
            className={cn(
              "h-8 w-1 rounded-full transition-colors",
              isDragging ? "bg-ember/60" : "bg-border/60 hover:bg-ember/40",
            )}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-ember-muted">
          <Sparkles className="size-4 text-ember" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold tracking-tight">
            RAGBot Chattify
          </h2>
        </div>
      </div>

      {/* New Chat button */}
      <div className="px-3 pb-2">
        <Button
          variant="outline"
          onClick={onNewChat}
          className={cn(
            "w-full justify-start gap-2 border-dashed border-border/60",
            "hover:border-ember/30 hover:bg-ember-muted hover:text-ember",
            "transition-all duration-200",
          )}
        >
          <Plus className="size-4" />
          New Chat
        </Button>
      </div>

      <Separator className="opacity-50" />

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelect={onSelectChat}
          onDelete={onDeleteChat}
        />
      </div>

      <Separator className="opacity-50" />

      {/* Footer */}
      <div className="shrink-0 space-y-1 p-3">
        <Button
          variant="ghost"
          onClick={onNavigateKnowledge}
          className="w-full justify-start gap-2 text-sm font-normal text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="size-4" />
          Knowledge Base
        </Button>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          {mounted && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="text-muted-foreground hover:text-foreground"
                  />
                }
              >
                {theme === "dark" ? (
                  <Sun className="size-3.5" />
                ) : (
                  <Moon className="size-3.5" />
                )}
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          )}

          {/* User info + logout */}
          <div className="min-w-0 flex-1 px-2">
            <p className="truncate text-xs text-muted-foreground">
              {user?.display_name || user?.email}
            </p>
          </div>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive"
                />
              }
            >
              <LogOut className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
