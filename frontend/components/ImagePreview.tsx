"use client";

import React, { useEffect } from "react";

interface ImagePreviewProps {
  url: string;
  onClose: () => void;
}

export function ImagePreview({ url, onClose }: ImagePreviewProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4" onClick={onClose}>
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-muted rounded-full hover:bg-muted/80 text-foreground shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div 
        className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* We would ideally show a real image if we had an endpoint to serve them. For now, a placeholder based on file. */}
        <div className="bg-muted w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center rounded-xl border border-border">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xl font-medium">Image Preview</p>
          <p className="text-sm opacity-80 mt-2 max-w-md">The file is securely stored on the backend. Serving raw images to the frontend will require an authenticated media route in a future update.</p>
        </div>
      </div>
    </div>
  );
}
