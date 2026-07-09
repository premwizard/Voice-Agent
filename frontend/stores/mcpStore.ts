import { create } from 'zustand';

export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  transport: string;
  command?: string;
  args?: string;
  url?: string;
  status: string;
}

interface MCPState {
  servers: MCPServer[];
  fetchServers: (token: string) => Promise<void>;
  connectServer: (token: string, serverId: string) => Promise<void>;
  deleteServer: (token: string, serverId: string) => Promise<void>;
}

export const useMCPStore = create<MCPState>((set) => ({
  servers: [],
  fetchServers: async (token: string) => {
    try {
      const res = await fetch('http://localhost:8000/api/mcp/servers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const servers = await res.json();
        set({ servers });
      }
    } catch (err) {
      console.error('Failed to fetch MCP servers', err);
    }
  },
  connectServer: async (token: string, serverId: string) => {
    try {
      await fetch(`http://localhost:8000/api/mcp/servers/${serverId}/connect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Refresh status
      const res = await fetch('http://localhost:8000/api/mcp/servers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) set({ servers: await res.json() });
    } catch (err) {
      console.error('Failed to connect MCP server', err);
    }
  },
  deleteServer: async (token: string, serverId: string) => {
    try {
      await fetch(`http://localhost:8000/api/mcp/servers/${serverId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      set((state) => ({ servers: state.servers.filter(s => s.id !== serverId) }));
    } catch (err) {
      console.error('Failed to delete MCP server', err);
    }
  }
}));
