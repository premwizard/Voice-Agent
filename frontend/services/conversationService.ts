/**
 * ConversationService — HTTP client for the /api/conversations REST endpoints.
 *
 * All methods throw on non-2xx responses with a descriptive error message.
 * The base URL is configurable via NEXT_PUBLIC_API_URL env var.
 */

import type {
  Conversation,
  ConversationDetail,
  ConversationExportJSON,
  ConversationExportText,
  ExportFormat,
} from '../types/conversation';
import type { MemoryItem, UpsertMemoryPayload } from '../types/memory';

import { useAuthStore } from '../stores/authStore';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...headers, ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ------------------------------------------------------------------ //
// Conversation endpoints
// ------------------------------------------------------------------ //

export const conversationService = {
  /** List all conversations ordered by pinned first, then most recent. */
  list(limit = 100): Promise<Conversation[]> {
    return request(`/api/conversations?limit=${limit}`);
  },

  /** Search conversations by title keyword. */
  search(query: string, limit = 50): Promise<Conversation[]> {
    const q = encodeURIComponent(query);
    return request(`/api/conversations/search?q=${q}&limit=${limit}`);
  },

  /** Get full conversation detail including all messages and latest summary. */
  get(id: string): Promise<ConversationDetail> {
    return request(`/api/conversations/${id}`);
  },

  /** Rename a conversation. */
  rename(id: string, title: string): Promise<{ status: string }> {
    return request(`/api/conversations/${id}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  /** Pin or unpin a conversation. */
  setPin(id: string, pinned: boolean): Promise<{ status: string }> {
    return request(`/api/conversations/${id}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned }),
    });
  },

  /** Permanently delete a conversation and all its messages. */
  delete(id: string): Promise<{ status: string }> {
    return request(`/api/conversations/${id}`, { method: 'DELETE' });
  },

  /** Export a conversation in the specified format. */
  export(
    id: string,
    format: ExportFormat,
  ): Promise<ConversationExportJSON | ConversationExportText> {
    return request(`/api/conversations/${id}/export?format=${format}`);
  },

  // ---------------------------------------------------------------- //
  // Memory endpoints
  // ---------------------------------------------------------------- //

  /** Get all long-term memory items. */
  getMemory(category?: string): Promise<MemoryItem[]> {
    const suffix = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/api/memory${suffix}`);
  },

  /** Create or update a memory item. */
  upsertMemory(payload: UpsertMemoryPayload): Promise<MemoryItem> {
    return request('/api/memory', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Delete a memory item by key. */
  deleteMemory(key: string): Promise<{ status: string }> {
    return request(`/api/memory/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  },

  /** Clear all long-term memory. */
  clearMemory(): Promise<{ status: string }> {
    return request('/api/memory', { method: 'DELETE' });
  },
};
