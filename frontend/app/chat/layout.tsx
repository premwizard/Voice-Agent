import React from 'react';
import Sidebar from '@/components/Sidebar';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      <AnimatedBackground />
      <Sidebar />
      <main className="flex-1 h-full relative z-10 p-2 md:p-6 transition-all duration-300 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
