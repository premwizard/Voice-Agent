"use client";

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, User, Key, Palette, Monitor, Download, Upload, Info, Moon, Sun } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import { toast } from 'sonner';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'api', label: 'API Keys', icon: <Key size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'about', label: 'About', icon: <Info size={18} /> },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] glass-panel border-l border-white/10 z-50 flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                  <Dialog.Title className="text-xl font-bold">Settings</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>
                
                <div className="flex flex-1 overflow-hidden">
                  {/* Tabs Sidebar */}
                  <div className="w-1/3 bg-black/20 p-2 space-y-1 overflow-y-auto">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-2 p-3 text-sm font-medium rounded-xl transition-colors ${
                          activeTab === tab.id 
                            ? 'bg-white/10 text-foreground' 
                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                        }`}
                      >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="w-2/3 p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'general' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Model Selection</h3>
                          <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-indigo-500">
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                            <option value="gpt-4o">GPT-4o</option>
                            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                          </select>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold mb-3">System Prompt</h3>
                          <textarea 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 min-h-[100px] resize-none"
                            placeholder="You are a helpful AI assistant..."
                          ></textarea>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'api' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Google API Key</h3>
                          <input 
                            type="password" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-indigo-500"
                            placeholder="AIzaSy..."
                          />
                        </div>
                        <button 
                          onClick={() => toast.success('API keys saved')}
                          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
                        >
                          Save Keys
                        </button>
                      </div>
                    )}
                    
                    {activeTab === 'appearance' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Theme</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                              <Moon size={16} /> Dark
                            </button>
                            <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors opacity-50 cursor-not-allowed">
                              <Sun size={16} /> Light
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'about' && (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-center justify-center p-6 mb-2">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-2xl">
                            AI
                          </div>
                        </div>
                        <p className="text-center font-medium text-foreground">Voice Agent v1.0.0</p>
                        <p className="text-center">A premium real-time AI voice assistant running directly in your browser.</p>
                        <div className="flex justify-center gap-4 pt-4 border-t border-white/5">
                          <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                            <Download size={16} /> Export Data
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
