import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import CommandPalette from '@/components/CommandPalette';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice Agent - Real-time AI Assistant',
  description: 'A premium, real-time AI voice assistant running in the browser.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        {children}
        <Toaster position="bottom-right" theme="dark" richColors />
        <CommandPalette />
      </body>
    </html>
  );
}
