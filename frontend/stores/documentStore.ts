import { create } from 'zustand';

export interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  chunk_count: number;
  created_at: string;
  error_message?: string;
}

interface DocumentStore {
  documents: Document[];
  isLibraryOpen: boolean;
  isUploading: boolean;
  uploadProgress: number;
  
  setLibraryOpen: (isOpen: boolean) => void;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  isLibraryOpen: false,
  isUploading: false,
  uploadProgress: 0,

  setLibraryOpen: (isOpen) => set({ isLibraryOpen: isOpen }),

  fetchDocuments: async () => {
    try {
      const res = await fetch('http://localhost:8000/documents');
      const data = await res.json();
      set({ documents: data });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  },

  uploadDocument: async (file: File) => {
    set({ isUploading: true, uploadProgress: 0 });
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress for UI since fetch doesn't support progress events natively easily
      const progressInterval = setInterval(() => {
        set((state) => ({
          uploadProgress: Math.min(state.uploadProgress + 10, 90)
        }));
      }, 200);

      const res = await fetch('http://localhost:8000/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      set({ uploadProgress: 100 });

      if (res.ok) {
        // Refresh list
        await get().fetchDocuments();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setTimeout(() => {
        set({ isUploading: false, uploadProgress: 0 });
      }, 1000);
    }
  },

  deleteDocument: async (id: string) => {
    // Optimistic delete
    const previousDocs = get().documents;
    set({ documents: previousDocs.filter(d => d.id !== id) });
    
    try {
      const res = await fetch(`http://localhost:8000/documents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
    } catch (error) {
      console.error('Delete error:', error);
      // Revert
      set({ documents: previousDocs });
    }
  }
}));
