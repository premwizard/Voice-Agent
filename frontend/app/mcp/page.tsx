"use client";

import React, { useEffect, useState } from 'react';
import { useMCPStore } from '../../stores/mcpStore';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ServerManager } from '../../components/mcp/ServerManager';
import { ToolExplorer } from '../../components/mcp/ToolExplorer';
import Sidebar from '../../components/Sidebar';

export default function MCPDashboard() {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { servers, fetchServers } = useMCPStore();
  const [activeTab, setActiveTab] = useState('servers');

  useEffect(() => {
    if (!isAuthenticated() || !token) {
      router.push('/login');
      return;
    }
    fetchServers(token);
  }, [isAuthenticated, router, token, fetchServers]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10 relative">
        <header className="p-6 border-b border-white/5 glass">
          <h1 className="text-2xl font-bold">MCP Developer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage external tools, resources, and context via Model Context Protocol.</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-4 border-b border-white/10 pb-4">
            <button onClick={() => setActiveTab('servers')} className={`font-medium ${activeTab === 'servers' ? 'text-indigo-400' : 'text-muted-foreground'}`}>Servers</button>
            <button onClick={() => setActiveTab('tools')} className={`font-medium ${activeTab === 'tools' ? 'text-indigo-400' : 'text-muted-foreground'}`}>Tool Explorer</button>
          </div>

          {activeTab === 'servers' && <ServerManager servers={servers} />}
          {activeTab === 'tools' && <ToolExplorer servers={servers} />}
        </div>
      </div>
    </div>
  );
}
