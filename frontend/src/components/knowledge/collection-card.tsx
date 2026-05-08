"use client";

import { BookOpen, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Collection } from "@/lib/types";

interface CollectionCardProps {
  collection: Collection;
  onSelect: () => void;
  onDelete: () => void;
}

export function CollectionCard({
  collection,
  onSelect,
  onDelete,
}: CollectionCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "noise-texture group relative cursor-pointer rounded-xl border border-border/50 bg-surface-raised p-5",
        "transition-all duration-300",
        "hover:border-ember/25 hover:shadow-lg hover:shadow-ember/[0.04] hover:-translate-y-0.5",
        "active:translate-y-0",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ember-muted">
          <BookOpen className="size-5 text-ember" />
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <h3 className="mt-3 text-sm font-medium tracking-tight">
        {collection.name}
      </h3>
      {collection.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {collection.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <FileText className="size-3" />
        <span>{collection.document_count} document{collection.document_count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}
