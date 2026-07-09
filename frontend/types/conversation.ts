/**
 * Conversation entity types — mirroring the backend database models.
 * Used by conversationStore and conversationService.
 */

export interface Conversation {
  id: string;
  title: string;
  created_at: string; // ISO string
  updated_at: string;
  message_count: number;
  is_pinned: boolean;
  mode: 'voice' | 'chat' | 'mixed';
}

export interface PersistedMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string
  mode: 'voice' | 'chat';
  metadata?: Record<string, unknown> | null;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: PersistedMessage[];
  summary: string | null;
}

export interface ConversationExportJSON {
  conversation: Conversation;
  summary: string | null;
  messages: PersistedMessage[];
  exported_at: string;
}

export interface ConversationExportText {
  content: string;
  filename: string;
}

export type ExportFormat = 'json' | 'markdown' | 'txt';
