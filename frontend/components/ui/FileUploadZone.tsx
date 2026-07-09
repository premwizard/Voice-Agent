"use client";

import React, { useCallback, useState } from "react";

interface FileUploadZoneProps {
  onUpload: (files: File[]) => void;
  children: React.ReactNode;
}

export function FileUploadZone({ onUpload, children }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        onUpload(files);
      }
    },
    [onUpload]
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative w-full h-full transition-all duration-300 ${
        isDragging ? "bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg" : ""
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-4">
            <div className="p-4 bg-primary/20 rounded-full inline-block">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground">Drop files to upload</h3>
            <p className="text-sm text-muted-foreground">Supports images and documents</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
