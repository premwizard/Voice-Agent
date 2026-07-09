"use client";

import React from "react";

interface VisionStatusProps {
  status: string; // e.g. "Processing media...", "Analyzing image...", "Running OCR..."
}

export function VisionStatus({ status }: VisionStatusProps) {
  if (!status) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 w-fit mb-2 animate-pulse">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="font-medium">{status}</span>
    </div>
  );
}
