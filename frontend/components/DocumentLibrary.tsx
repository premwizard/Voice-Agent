"use client";

import React, { useEffect, useCallback, useRef } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { motion, AnimatePresence } from 'framer-motion';
import { drawerVariants, smoothTransition } from './ui/motion';
import { X, Upload, FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function DocumentLibrary() {
  const { 
    documents, 
    isLibraryOpen, 
    setLibraryOpen, 
    fetchDocuments, 
    uploadDocument, 
    deleteDocument,
    isUploading,
    uploadProgress
  } = useDocumentStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLibraryOpen) {
      fetchDocuments();
    }
  }, [isLibraryOpen, fetchDocuments]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadDocument(file);
    }
  }, [uploadDocument]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadDocument(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isLibraryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setLibraryOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      {/* Drawer */}
      <motion.div
        variants={drawerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-md h-full bg-surface/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Knowledge Base</h2>
          <button 
            onClick={() => setLibraryOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
          
          {/* Upload Zone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isUploading ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/20 hover:border-indigo-500/50 hover:bg-white/5'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.md,.csv"
            />
            {isUploading ? (
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
                <div className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={smoothTransition}
                  />
                </div>
                <p className="text-sm text-indigo-300">Processing Document...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 rounded-full bg-white/5 text-muted-foreground mb-2">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-foreground">Click or drag document to upload</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD, CSV (Max 50MB)</p>
              </div>
            )}
          </div>

          {/* Document List */}
          <div className="space-y-3 mt-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Indexed Documents</h3>
            <AnimatePresence>
              {documents.length === 0 && !isUploading && (
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground text-center py-8"
                >
                  No documents found in knowledge base.
                </motion.p>
              )}
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">{formatSize(doc.file_size)}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[11px] text-muted-foreground">{doc.chunk_count} chunks</span>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {doc.status === 'ready' && <><CheckCircle2 size={12} className="text-emerald-400" /><span className="text-[10px] text-emerald-400 uppercase font-semibold">Ready</span></>}
                      {doc.status === 'processing' && <><Loader2 size={12} className="text-indigo-400 animate-spin" /><span className="text-[10px] text-indigo-400 uppercase font-semibold">Processing</span></>}
                      {doc.status === 'failed' && <><AlertCircle size={12} className="text-red-400" /><span className="text-[10px] text-red-400 uppercase font-semibold">Failed</span></>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
