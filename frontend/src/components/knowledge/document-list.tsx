"use client";

import { FileText, Trash2, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentInfo } from "@/lib/types";

interface DocumentListProps {
  documents: DocumentInfo[];
  onDelete: (id: string) => void;
}

const STATUS_ICONS = {
  ready: CheckCircle2,
  processing: Loader2,
  error: AlertCircle,
  pending: Loader2,
};

const STATUS_COLORS = {
  ready: "text-emerald-500",
  processing: "text-ember animate-spin",
  error: "text-destructive",
  pending: "text-muted-foreground animate-spin",
};

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground/50">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => {
        const StatusIcon =
          STATUS_ICONS[doc.status as keyof typeof STATUS_ICONS] || FileText;
        const statusColor =
          STATUS_COLORS[doc.status as keyof typeof STATUS_COLORS] ||
          "text-muted-foreground";

        return (
          <div
            key={doc.id}
            className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/30 hover:bg-surface-raised"
          >
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{doc.filename}</p>
              <p className="text-[10px] text-muted-foreground">
                {doc.chunk_count} chunks
              </p>
            </div>
            <StatusIcon className={cn("size-3.5 shrink-0", statusColor)} />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(doc.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
