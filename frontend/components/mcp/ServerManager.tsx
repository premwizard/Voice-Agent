import React, { useState } from 'react';
import { MCPServer, useMCPStore } from '../../stores/mcpStore';
import { useAuthStore } from '../../stores/authStore';
import { Play, Square, Trash, Plus } from 'lucide-react';
import { ConnectionWizard } from './ConnectionWizard';

export function ServerManager({ servers }: { servers: MCPServer[] }) {
  const token = useAuthStore(state => state.token);
  const { connectServer, deleteServer } = useMCPStore();
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Connected Servers</h2>
        <button 
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Server
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {servers.length === 0 ? (
          <div className="col-span-full p-8 border border-white/10 border-dashed rounded-3xl text-center text-muted-foreground">
            No MCP servers configured. Add one to expand the AI's capabilities.
          </div>
        ) : servers.map(server => (
          <div key={server.id} className="glass p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">{server.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{server.transport.toUpperCase()}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${server.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-muted-foreground'}`}>
                {server.status}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {server.description || 'No description provided.'}
            </p>

            <div className="flex gap-2 pt-4 border-t border-white/10">
              <button 
                onClick={() => token && connectServer(token, server.id)}
                disabled={server.status === 'connected'}
                className="flex-1 flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Play size={14} /> Connect
              </button>
              <button 
                onClick={() => token && deleteServer(token, server.id)}
                className="flex justify-center items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showWizard && <ConnectionWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
