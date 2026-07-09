import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Conversation } from '../types/conversation';
import { conversationService } from '../services/conversationService';

interface ConversationStore {
  /** Full list of conversations from the backend (sorted: pinned first, then recent). */
  conversations: Conversation[];
  /** ID of the currently active conversation (persisted across refreshes). */
  activeConversationId: string | null;
  /** Whether the list is currently being fetched. */
  isLoading: boolean;
  /** Search query currently active in the sidebar. */
  searchQuery: string;
  /** Filtered results from search (null = no active search, show all). */
  searchResults: Conversation[] | null;

  // ---------------------------------------------------------------- //
  // Actions
  // ---------------------------------------------------------------- //

  /** Load (or reload) the conversation list from the backend. */
  loadConversations: () => Promise<void>;

  /** Set the active conversation ID. */
  setActiveConversationId: (id: string | null) => void;

  /** Optimistically rename a conversation locally + sync to backend. */
  renameConversation: (id: string, title: string) => Promise<void>;

  /** Optimistically pin/unpin + sync to backend. */
  togglePin: (id: string) => Promise<void>;

  /** Optimistically delete from list + sync to backend. */
  deleteConversation: (id: string) => Promise<void>;

  /** Add a newly created conversation to the top of the list. */
  addConversation: (conv: Conversation) => void;

  /** Update a single conversation in the list (e.g., after auto-title). */
  updateConversation: (partial: Partial<Conversation> & { id: string }) => void;

  /** Run a live search and store results. */
  runSearch: (query: string) => Promise<void>;

  /** Clear search state. */
  clearSearch: () => void;
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isLoading: false,
      searchQuery: '',
      searchResults: null,

      loadConversations: async () => {
        set({ isLoading: true });
        try {
          const convs = await conversationService.list();
          set({ conversations: convs, isLoading: false });
        } catch (err) {
          console.error('[ConversationStore] Failed to load conversations:', err);
          set({ isLoading: false });
        }
      },

      setActiveConversationId: (id) => set({ activeConversationId: id }),

      renameConversation: async (id, title) => {
        // Optimistic update
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c,
          ),
        }));
        try {
          await conversationService.rename(id, title);
        } catch (err) {
          console.error('[ConversationStore] Rename failed — reloading:', err);
          get().loadConversations();
        }
      },

      togglePin: async (id) => {
        const current = get().conversations.find((c) => c.id === id);
        if (!current) return;
        const newPinned = !current.is_pinned;
        // Optimistic update
        set((state) => ({
          conversations: state.conversations
            .map((c) => (c.id === id ? { ...c, is_pinned: newPinned } : c))
            .sort((a, b) => {
              if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
              return b.updated_at.localeCompare(a.updated_at);
            }),
        }));
        try {
          await conversationService.setPin(id, newPinned);
        } catch (err) {
          console.error('[ConversationStore] Pin failed — reloading:', err);
          get().loadConversations();
        }
      },

      deleteConversation: async (id) => {
        // Optimistic removal
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
        }));
        try {
          await conversationService.delete(id);
        } catch (err) {
          console.error('[ConversationStore] Delete failed — reloading:', err);
          get().loadConversations();
        }
      },

      addConversation: (conv) =>
        set((state) => ({
          conversations: [conv, ...state.conversations],
        })),

      updateConversation: (partial) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === partial.id ? { ...c, ...partial } : c,
          ),
        })),

      runSearch: async (query) => {
        set({ searchQuery: query });
        if (!query.trim()) {
          set({ searchResults: null });
          return;
        }
        try {
          const results = await conversationService.search(query);
          set({ searchResults: results });
        } catch (err) {
          console.error('[ConversationStore] Search failed:', err);
          set({ searchResults: [] });
        }
      },

      clearSearch: () => set({ searchQuery: '', searchResults: null }),
    }),
    {
      name: 'conversation-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist the active conversation ID — list is always re-fetched from backend
      partialize: (state) => ({
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
);
