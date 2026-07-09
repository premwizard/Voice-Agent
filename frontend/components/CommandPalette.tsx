"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Settings, Monitor, Moon, Sun, MessageSquare, Plus, Mic, Trash2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useVoiceStore } from "../stores/voiceStore";
import { useUIStore } from "../stores/uiStore";
import { useDocumentStore } from "../stores/documentStore";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const voiceStore = useVoiceStore();
  const setSettingsOpen = useUIStore(state => state.setSettingsOpen);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Also close on Escape
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div 
        className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-surface/90 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command Menu" className="w-full" shouldFilter={true}>
          <div className="flex items-center border-b border-white/10 px-4">
            <Search className="mr-2 h-5 w-5 text-muted-foreground shrink-0" />
            <Command.Input
              className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground text-foreground"
              placeholder="Type a command or search..."
              autoFocus
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Suggestions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => {
                  voiceStore.clearMessages();
                  router.push('/chat');
                })}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-white/10 aria-selected:bg-white/10 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Session</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => voiceStore.clearMessages())}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-white/10 aria-selected:bg-white/10 transition-colors text-red-400 focus:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Conversation</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => voiceStore.setActiveMode('chat'))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-white/10 aria-selected:bg-white/10 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Switch to Text Chat</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => voiceStore.setActiveMode('voice'))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-white/10 aria-selected:bg-white/10 transition-colors"
              >
                <Mic className="h-4 w-4" />
                <span>Switch to Voice Agent</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => useDocumentStore.getState().setLibraryOpen(true))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-white/10 aria-selected:bg-white/10 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Open Knowledge Base</span>
              </Command.Item>
            </Command.Group>
            
            <Command.Group heading="Settings" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => setSettingsOpen(true))}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-white/10 aria-selected:bg-white/10 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Open Settings</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => {})}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-white/10 aria-selected:bg-white/10 transition-colors"
              >
                <Moon className="h-4 w-4" />
                <span>Toggle Theme (Dark)</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
