"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

interface UploadDialogProps {
  collectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}

interface FileUploadState {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
}

export function UploadDialog({
  collectionId,
  open,
  onOpenChange,
  onUploaded,
}: UploadDialogProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).map((file) => ({
      file,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...arr]);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)),
      );
      try {
        await api.upload(
          `/collections/${collectionId}/documents`,
          files[i].file,
        );
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f)),
        );
      } catch {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "error" } : f)),
        );
      }
    }
    onUploaded();
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="upload-dialog-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-background p-6 shadow-2xl animate-float-in">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="upload-dialog-title" className="text-base font-semibold tracking-tight">
            Upload Documents
          </h2>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all",
            dragging
              ? "border-ember bg-ember-muted"
              : "border-border/60 hover:border-ember/30",
          )}
        >
          <Upload
            className={cn(
              "size-8",
              dragging ? "text-ember" : "text-muted-foreground/40",
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium">
              Drop files here or{" "}
              <label className="cursor-pointer text-ember underline underline-offset-2">
                browse
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.csv,.json"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, TXT, MD, CSV, JSON
            </p>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {files.map((f, i) => (
              <div
                key={`${f.file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-border/30 bg-surface px-3 py-2"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {f.file.name}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {(f.file.size / 1024).toFixed(0)}KB
                </span>
                {f.status === "uploading" && (
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-ember" />
                )}
                {f.status === "done" && (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                )}
                {f.status === "error" && (
                  <AlertCircle className="size-3.5 shrink-0 text-destructive" />
                )}
                {f.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeFile(i)}
                    className="size-5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={pendingCount === 0}
            className="bg-ember text-ember-foreground hover:brightness-110"
          >
            Upload {pendingCount > 0 ? `(${pendingCount})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
