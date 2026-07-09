"use client";

import React from "react";

interface MediaItem {
  id: string;
  file_name: string;
  mime_type: string;
  status: string;
}

interface MediaGalleryProps {
  items: MediaItem[];
  onRemove?: (id: string) => void;
  onPreview?: (id: string) => void;
}

export function MediaGallery({ items, onRemove, onPreview }: MediaGalleryProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/20 rounded-md border border-border/50">
      {items.map((item) => (
        <div key={item.id} className="relative group flex items-center justify-between p-2 rounded bg-background border border-border w-48 text-sm cursor-pointer shadow-sm" onClick={() => onPreview?.(item.id)}>
          <div className="flex items-center gap-2 overflow-hidden">
            {item.mime_type.startsWith("image/") ? (
              <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            <span className="truncate text-xs font-medium">{item.file_name}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {item.status === "processing" && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            )}
            {onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
