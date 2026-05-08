"use client";

import { useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Chat } from "@/lib/types";

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ChatListItem({
  chat,
  isActive,
  onSelect,
  onDelete,
}: ChatListItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group/item relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-200",
        isActive
          ? "bg-ember-muted text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <MessageSquare
        className={cn(
          "size-3.5 shrink-0",
          isActive ? "text-ember" : "opacity-50",
        )}
      />
      <span className="min-w-0 flex-1 truncate text-sm">{chat.title}</span>

      {/* Delete button */}
      <div
        className={cn(
          "shrink-0 transition-opacity duration-150",
          isActive
            ? "opacity-100"
            : "opacity-0 group-hover/item:opacity-100",
        )}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          className={cn(
            "size-5",
            confirmDelete
              ? "text-destructive hover:bg-destructive/10"
              : "text-muted-foreground hover:text-destructive",
          )}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-ember" />
      )}
    </button>
  );
}
