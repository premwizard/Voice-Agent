import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-xl ${className}`} />
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-4 p-4 w-full">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex flex-col gap-2 w-full max-w-[80%]">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    </div>
  );
}
