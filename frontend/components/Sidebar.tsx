"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Mic,
  Settings,
  PlusCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Pin,
  Trash2,
  Pencil,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import { useConversationStore } from '../stores/conversationStore';
import { wsService } from '../services/websocket';
import { useRouter } from 'next/navigation';
import type { Conversation } from '../types/conversation';
import { useUIStore } from '../stores/uiStore';

// ------------------------------------------------------------------ //
// Helpers
// ------------------------------------------------------------------ //

function formatRelativeTime(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ------------------------------------------------------------------ //
// ConversationItem sub-component
// ------------------------------------------------------------------ //

interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}

function ConversationItem({
  conv,
  isActive,
  isExpanded,
  onSelect,
  onRename,
  onDelete,
  onPin,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowDeleteConfirm(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const startEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const saveEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conv.title) {
      onRename(conv.id, trimmed);
    } else {
      setEditTitle(conv.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') {
      setEditTitle(conv.title);
      setIsEditing(false);
    }
  };

  const icon =
    conv.mode === 'voice' ? (
      <Mic size={15} className="shrink-0 text-indigo-400" />
    ) : (
      <MessageSquare size={15} className="shrink-0 text-muted-foreground" />
    );

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-white/10 text-foreground'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      } ${isExpanded ? '' : 'justify-center'}`}
      onClick={() => !isEditing && onSelect(conv.id)}
      title={!isExpanded ? conv.title : undefined}
    >
      {icon}

      {isExpanded && (
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white/10 text-foreground text-sm rounded-lg px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          ) : (
            <p className="text-sm truncate leading-tight">{conv.title}</p>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {formatRelativeTime(conv.updated_at)}
          </p>
        </div>
      )}

      {isExpanded && conv.is_pinned && (
        <Pin size={10} className="shrink-0 text-indigo-400/70 rotate-45" />
      )}

      {/* Context menu trigger */}
      {isExpanded && !isEditing && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
            title="Options"
          >
            <MoreHorizontal size={14} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-7 z-50 w-44 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                >
                  <Pencil size={13} /> Rename
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onPin(conv.id); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                >
                  <Pin size={13} /> {conv.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <div className="border-t border-white/5 my-1" />
                {!showDeleteConfirm ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-red-500/10 text-red-400 transition-colors text-left"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                ) : (
                  <div className="px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-2">Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                          setShowMenu(false);
                        }}
                        className="flex-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-1.5 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                        className="flex-1 text-xs hover:bg-white/10 rounded-lg py-1.5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ //
export default function Sidebar() {
  const voiceStore = useVoiceStore();
  const convStore = useConversationStore();
  const setSettingsOpen = useUIStore(state => state.setSettingsOpen);
  const router = useRouter();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    convStore.loadConversations();
  }, []);

  const displayedConversations =
    convStore.searchResults ?? convStore.conversations;

  const handleNewSession = () => {
    voiceStore.clearMessages();
    voiceStore.setAiPartialTranscript('');
    // Disconnect old session; new conversation_id will be assigned on reconnect
    wsService.disconnect();
    convStore.setActiveConversationId(null);
    setTimeout(() => {
      wsService.connect(null);
    }, 100);
    router.push('/chat');
    setIsMobileOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    if (convStore.activeConversationId === id) return;
    voiceStore.clearMessages();
    voiceStore.setAiPartialTranscript('');
    convStore.setActiveConversationId(id);
    // Reconnect with the selected conversation_id to load its history
    wsService.disconnect();
    setTimeout(() => {
      wsService.connect(id);
    }, 100);
    router.push('/chat');
    setIsMobileOpen(false);
  };

  const handleRename = (id: string, title: string) => {
    convStore.renameConversation(id, title);
  };

  const handleDelete = (id: string) => {
    convStore.deleteConversation(id);
    // If we deleted the active conversation, start a new session
    if (convStore.activeConversationId === id) {
      handleNewSession();
    }
  };

  const handlePin = (id: string) => {
    convStore.togglePin(id);
  };

  const navItems = [
    {
      id: 'voice',
      label: 'Voice Agent',
      icon: <Mic size={20} />,
      onClick: () => {
        voiceStore.setActiveMode('voice');
        router.push('/chat');
        setIsMobileOpen(false);
      },
      active: voiceStore.activeMode === 'voice',
    },
    {
      id: 'chat',
      label: 'Text Chat',
      icon: <MessageSquare size={20} />,
      onClick: () => {
        voiceStore.setActiveMode('chat');
        router.push('/chat');
        setIsMobileOpen(false);
      },
      active: voiceStore.activeMode === 'chat',
    },
  ];

  const pinnedConvs = displayedConversations.filter((c) => c.is_pinned);
  const recentConvs = displayedConversations.filter((c) => !c.is_pinned);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface/50 backdrop-blur-xl border-r border-white/5 transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between shrink-0">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-lg overflow-hidden whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
            >
              AI
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden md:flex p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* New Session Button */}
      <div className="px-3 pb-3 shrink-0">
        <button
          onClick={handleNewSession}
          className={`w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all ${
            isExpanded ? '' : 'px-0'
          }`}
          title="New Session"
        >
          <PlusCircle size={20} />
          {isExpanded && <span className="font-medium whitespace-nowrap">New Session</span>}
        </button>
      </div>

      {/* Search (only when expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3 shrink-0"
          >
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                searchFocused
                  ? 'bg-white/10 border-indigo-500/40'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              <Search size={14} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={convStore.searchQuery}
                onChange={(e) => convStore.runSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 min-w-0"
              />
              {convStore.searchQuery && (
                <button
                  onClick={() => convStore.clearSearch()}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Items */}
      <div className="px-3 space-y-1 shrink-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              item.active
                ? 'bg-white/10 text-foreground'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            } ${isExpanded ? 'justify-start' : 'justify-center'}`}
            title={item.label}
          >
            {item.icon}
            {isExpanded && (
              <span className="whitespace-nowrap font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </div>

      {/* Conversation History */}
      <div className="flex-1 px-3 mt-4 overflow-y-auto custom-scrollbar space-y-0.5 min-h-0">
        {/* Pinned */}
        {isExpanded && pinnedConvs.length > 0 && (
          <div className="mb-1">
            <p className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
              Pinned
            </p>
            {pinnedConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={convStore.activeConversationId === conv.id}
                isExpanded={isExpanded}
                onSelect={handleSelectConversation}
                onRename={handleRename}
                onDelete={handleDelete}
                onPin={handlePin}
              />
            ))}
          </div>
        )}

        {/* Recent */}
        {isExpanded && recentConvs.length > 0 && (
          <div>
            <p className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
              {convStore.searchQuery ? 'Results' : 'Recent'}
            </p>
            {recentConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={convStore.activeConversationId === conv.id}
                isExpanded={isExpanded}
                onSelect={handleSelectConversation}
                onRename={handleRename}
                onDelete={handleDelete}
                onPin={handlePin}
              />
            ))}
          </div>
        )}

        {/* Collapsed — show icons only */}
        {!isExpanded &&
          displayedConversations.slice(0, 8).map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={convStore.activeConversationId === conv.id}
              isExpanded={false}
              onSelect={handleSelectConversation}
              onRename={handleRename}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          ))}

        {/* Loading state */}
        {convStore.isLoading && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!convStore.isLoading &&
          displayedConversations.length === 0 &&
          isExpanded && (
            <div className="text-center py-8 text-muted-foreground/40">
              <MessageSquare size={24} className="mx-auto mb-2" />
              <p className="text-xs">
                {convStore.searchQuery
                  ? 'No conversations found'
                  : 'No conversations yet'}
              </p>
            </div>
          )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <button
          onClick={() => setSettingsOpen(true)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-muted-foreground hover:bg-white/5 hover:text-foreground ${
            isExpanded ? 'justify-start' : 'justify-center'
          }`}
          title="Settings"
        >
          <Settings size={20} />
          {isExpanded && <span className="whitespace-nowrap font-medium">Settings</span>}
        </button>

        {isExpanded && (
          <div className="mt-1 px-3 py-2 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0">
              A
            </div>
            <div className="flex flex-col items-start overflow-hidden">
              <span className="whitespace-nowrap font-medium text-sm text-foreground">
                Asus
              </span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {convStore.conversations.length} conversation
                {convStore.conversations.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen((v) => !v)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 glass rounded-xl text-foreground"
        title="Toggle Sidebar"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 260 : 72 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:block h-screen flex-shrink-0 z-40 relative overflow-visible"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[260px] z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
