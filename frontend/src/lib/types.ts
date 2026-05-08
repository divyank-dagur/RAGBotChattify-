export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Chat {
  id: string;
  title: string;
  model_id: string;
  collection_id: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: string | null;
  attachments: string | null;
  token_count: number | null;
  created_at: string;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}

export interface Citation {
  content: string;
  source: string;
  chunk_index: number;
  score: number;
}

export interface SSEEvent {
  type: "token" | "citation" | "done" | "artifact" | "error";
  content?: string;
  sources?: Citation[];
  token_count?: number;
  id?: string;
  title?: string;
  kind?: string;
  language?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  document_count: number;
}

export interface DocumentInfo {
  id: string;
  collection_id: string;
  filename: string;
  mime_type: string;
  chunk_count: number;
  status: string;
  created_at: string;
}

export interface Artifact {
  id: string;
  chat_id: string;
  message_id: string | null;
  title: string;
  content: string;
  kind: string;
  language: string | null;
  version: number;
  created_at: string;
}
