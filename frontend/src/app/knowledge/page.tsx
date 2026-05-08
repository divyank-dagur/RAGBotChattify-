"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CollectionCard } from "@/components/knowledge/collection-card";
import { DocumentList } from "@/components/knowledge/document-list";
import { UploadDialog } from "@/components/knowledge/upload-dialog";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Collection, DocumentInfo } from "@/lib/types";

export default function KnowledgePage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCollections = useCallback(async () => {
    try {
      const data = await api.get<Collection[]>("/collections");
      setCollections(data);
    } catch {
      // Handle error
    }
  }, []);

  const fetchDocuments = useCallback(async (collectionId: string) => {
    try {
      const data = await api.get<DocumentInfo[]>(
        `/collections/${collectionId}/documents`,
      );
      setDocuments(data);
    } catch {
      // Handle error
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (selectedId) fetchDocuments(selectedId);
  }, [selectedId, fetchDocuments]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const c = await api.post<Collection>("/collections", {
        name: newName.trim(),
      });
      setCollections((prev) => [c, ...prev]);
      setNewName("");
      setCreating(false);
      setSelectedId(c.id);
    } catch {
      // Handle error
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await api.del(`/collections/${id}`);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDocuments([]);
      }
    } catch {
      // Handle error
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await api.del(`/collections/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      // Handle error
    }
  };

  const selectedCollection = collections.find((c) => c.id === selectedId);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-ember" />
            <h1 className="text-sm font-semibold tracking-tight">
              Knowledge Base
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {!selectedId ? (
          /* ── Collections view ── */
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Collections
                </h2>
                <p className="text-sm text-muted-foreground">
                  Organize documents into collections and attach them to chats
                  for RAG-powered responses.
                </p>
              </div>
              <Button
                onClick={() => setCreating(true)}
                className="bg-ember text-ember-foreground hover:brightness-110 gap-1.5"
              >
                <Plus className="size-4" />
                New Collection
              </Button>
            </div>

            {creating && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-ember/20 bg-ember-muted p-4 animate-float-in">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name..."
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                  className="max-w-xs"
                />
                <Button
                  size="sm"
                  onClick={handleCreate}
                  className="bg-ember text-ember-foreground hover:brightness-110"
                >
                  Create
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {collections.length === 0 && !creating ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-ember-muted">
                  <BookOpen className="size-7 text-ember/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No collections yet. Create one to start uploading documents.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((c) => (
                  <CollectionCard
                    key={c.id}
                    collection={c}
                    onSelect={() => setSelectedId(c.id)}
                    onDelete={() => handleDeleteCollection(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Single collection view ── */
          <div>
            <div className="mb-6">
              <button
                onClick={() => {
                  setSelectedId(null);
                  setDocuments([]);
                }}
                className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3" />
                Back to collections
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {selectedCollection?.name}
                  </h2>
                  {selectedCollection?.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedCollection.description}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setShowUpload(true)}
                  className="bg-ember text-ember-foreground hover:brightness-110 gap-1.5"
                >
                  <Upload className="size-4" />
                  Upload
                </Button>
              </div>
            </div>

            <Separator className="mb-6 opacity-50" />

            <DocumentList documents={documents} onDelete={handleDeleteDoc} />

            <UploadDialog
              collectionId={selectedId}
              open={showUpload}
              onOpenChange={setShowUpload}
              onUploaded={() => {
                fetchDocuments(selectedId);
                fetchCollections();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
