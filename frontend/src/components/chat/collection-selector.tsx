"use client";

import { useState, useEffect } from "react";
import { BookOpen, ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type { Collection } from "@/lib/types";

interface CollectionSelectorProps {
  value: string | null;
  onChange: (collectionId: string | null) => void;
  className?: string;
}

export function CollectionSelector({
  value,
  onChange,
  className,
}: CollectionSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    api
      .get<Collection[]>("/collections")
      .then(setCollections)
      .catch(() => {});
  }, []);

  const selected = collections.find((c) => c.id === value);

  if (collections.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="xs"
            className={cn(
              "gap-1.5 font-normal transition-all duration-200",
              value
                ? "border-ember/30 bg-ember-muted text-ember"
                : "border-border/60 hover:border-ember/30 hover:bg-ember-muted",
              className,
            )}
          />
        }
      >
        <BookOpen className="size-3" />
        <span className="max-w-[100px] truncate text-[11px]">
          {selected?.name || "Knowledge"}
        </span>
        {value ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-ember/20"
          >
            <X className="size-2.5" />
          </span>
        ) : (
          <ChevronDown className="size-2.5 opacity-50" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem
          onClick={() => onChange(null)}
          className={cn(
            "cursor-pointer gap-2 text-xs",
            !value && "bg-ember-muted text-ember",
          )}
        >
          None (no RAG)
          {!value && <span className="ml-auto size-1.5 rounded-full bg-ember" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {collections.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => onChange(c.id)}
            className={cn(
              "cursor-pointer gap-2 text-xs",
              c.id === value && "bg-ember-muted text-ember",
            )}
          >
            <BookOpen className="size-3 opacity-60" />
            <span className="flex-1 truncate">{c.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {c.document_count} doc{c.document_count !== 1 ? "s" : ""}
            </span>
            {c.id === value && <span className="size-1.5 rounded-full bg-ember" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
