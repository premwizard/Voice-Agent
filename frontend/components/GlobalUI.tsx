"use client";

import React from 'react';
import SettingsDrawer from './SettingsDrawer';
import DeveloperPanel from './DeveloperPanel';
import { useUIStore } from '../stores/uiStore';

export default function GlobalUI() {
  const { isSettingsOpen, setSettingsOpen } = useUIStore();

  return (
    <>
      <SettingsDrawer open={isSettingsOpen} onOpenChange={setSettingsOpen} />
      <DeveloperPanel />
    </>
  );
}
