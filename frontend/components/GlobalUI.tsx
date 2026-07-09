"use client";

import React from 'react';
import SettingsDrawer from './SettingsDrawer';
import DeveloperPanel from './DeveloperPanel';
import { useUIStore } from '../stores/uiStore';
import { useShortcuts } from '../hooks/useShortcuts';

export default function GlobalUI() {
  const { isSettingsOpen, setSettingsOpen } = useUIStore();
  
  // Initialize global keyboard shortcuts
  useShortcuts();

  return (
    <>
      <SettingsDrawer open={isSettingsOpen} onOpenChange={setSettingsOpen} />
      <DeveloperPanel />
    </>
  );
}
