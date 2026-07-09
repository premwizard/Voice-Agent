import React, { useEffect, useState } from 'react';
import { MCPServer } from '../../stores/mcpStore';
import { useAuthStore } from '../../stores/authStore';

export function ToolExplorer({ servers }: { servers: MCPServer[] }) {
  const token = useAuthStore(state => state.token);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTools = async () => {
      if (!token) return;
      setLoading(true);
      const allTools = [];
      const connected = servers.filter(s => s.status === 'connected');
      
      for (const server of connected) {
        try {
          const res = await fetch(`http://localhost:8000/api/mcp/servers/${server.id}/tools`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const serverTools = await res.json();
            allTools.push(...serverTools.map((t: any) => ({ ...t, serverName: server.name })));
          }
        } catch (err) {
          console.error(err);
        }
      }
      setTools(allTools);
      setLoading(false);
    };
    fetchTools();
  }, [servers, token]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading tools...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Discovered Tools ({tools.length})</h2>
      {tools.length === 0 ? (
        <div className="p-8 border border-white/10 border-dashed rounded-3xl text-center text-muted-foreground">
          No tools discovered. Ensure servers are connected.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool, i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-white/5 shadow-lg">
              <div className="flex justify-between">
                <h3 className="font-bold text-indigo-400">{tool.name}</h3>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{tool.serverName}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{tool.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
