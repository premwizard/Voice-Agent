"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Mic, 
  Settings, 
  PlusCircle, 
  Clock, 
  Menu, 
  X,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const store = useVoiceStore();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsExpanded(!isExpanded);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const navItems = [
    {
      id: 'voice',
      label: 'Voice Agent',
      icon: <Mic size={20} />,
      onClick: () => { store.setActiveMode('voice'); router.push('/chat'); },
      active: store.activeMode === 'voice'
    },
    {
      id: 'chat',
      label: 'Text Chat',
      icon: <MessageSquare size={20} />,
      onClick: () => { store.setActiveMode('chat'); router.push('/chat'); },
      active: store.activeMode === 'chat'
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface/50 backdrop-blur-xl border-r border-white/5 transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
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
          onClick={toggleSidebar} 
          className="hidden md:flex p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-4">
        <button 
          onClick={() => { store.clearMessages(); router.push('/chat'); }}
          className={`w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all ${isExpanded ? '' : 'px-0'}`}
        >
          <PlusCircle size={20} />
          {isExpanded && <span className="font-medium whitespace-nowrap">New Session</span>}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
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
            {isExpanded && <span className="whitespace-nowrap font-medium">{item.label}</span>}
          </button>
        ))}

        {/* Mock History */}
        {isExpanded && (
          <div className="mt-8 mb-2 px-3 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">
            Recent
          </div>
        )}
        <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-muted-foreground hover:bg-white/5 hover:text-foreground ${isExpanded ? 'justify-start' : 'justify-center'}`} title="React Components">
          <MessageSquare size={20} />
          {isExpanded && <span className="whitespace-nowrap truncate text-sm">React Components</span>}
        </button>
        <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-muted-foreground hover:bg-white/5 hover:text-foreground ${isExpanded ? 'justify-start' : 'justify-center'}`} title="Next.js Routing">
          <MessageSquare size={20} />
          {isExpanded && <span className="whitespace-nowrap truncate text-sm">Next.js Routing</span>}
        </button>
      </div>

      {/* Footer / Profile */}
      <div className="p-3 border-t border-white/5">
        <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-muted-foreground hover:bg-white/5 hover:text-foreground ${isExpanded ? 'justify-start' : 'justify-center'}`} title="Settings">
          <Settings size={20} />
          {isExpanded && <span className="whitespace-nowrap font-medium">Settings</span>}
        </button>
        <button className={`w-full flex items-center gap-3 p-3 mt-1 rounded-xl transition-all text-muted-foreground hover:bg-white/5 hover:text-foreground ${isExpanded ? 'justify-start' : 'justify-center'}`} title="Profile">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0">
            A
          </div>
          {isExpanded && (
            <div className="flex flex-col items-start overflow-hidden">
              <span className="whitespace-nowrap font-medium text-sm text-foreground">Asus</span>
              <span className="whitespace-nowrap text-xs text-muted-foreground truncate w-full">Pro Plan</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleMobile}
        className="md:hidden fixed top-4 left-4 z-50 p-2 glass rounded-xl text-foreground"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 260 : 72 }}
        className="hidden md:block h-screen flex-shrink-0 z-40 relative"
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
              onClick={toggleMobile}
              className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
