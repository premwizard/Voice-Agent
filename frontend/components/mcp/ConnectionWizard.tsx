import React, { useState } from 'react';
import { useMCPStore } from '../../stores/mcpStore';
import { useAuthStore } from '../../stores/authStore';
import { X } from 'lucide-react';

export function ConnectionWizard({ onClose }: { onClose: () => void }) {
  const token = useAuthStore(state => state.token);
  const { fetchServers } = useMCPStore();
  const [name, setName] = useState('');
  const [command, setCommand] = useState('npx');
  const [args, setArgs] = useState('-y @modelcontextprotocol/server-everything');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payload = {
      name,
      description: 'Custom MCP Server',
      transport: 'stdio',
      command,
      args: JSON.stringify(args.split(' ')),
      env_vars: JSON.stringify({})
    };

    try {
      const res = await fetch('http://localhost:8000/api/mcp/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchServers(token);
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-3xl w-full max-w-md relative shadow-2xl border border-white/10">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">Add MCP Server</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Server Name</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Everything Server" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Command (STDIO)</label>
            <input required type="text" value={command} onChange={e => setCommand(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Arguments</label>
            <input required type="text" value={args} onChange={e => setArgs(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 text-sm" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium mt-2">
            Register Server
          </button>
        </form>
      </div>
    </div>
  );
}
