/**
 * Long-term memory item types.
 */

export type MemoryCategory = 'preference' | 'fact' | 'goal' | 'style';

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface UpsertMemoryPayload {
  key: string;
  value: string;
  category: MemoryCategory;
  confidence?: number;
}
