"use client"
import React, { useEffect, useState } from 'react';

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null);
    const [content, setContent] = useState("");

    const fetchPrompts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/prompts/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPrompts(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrompts();
    }, []);

    const handleSave = async () => {
        if (!editing) return;
        try {
            const token = localStorage.getItem('token');
            await fetch('http://127.0.0.1:8000/api/prompts/', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editing.name,
                    content: content,
                    tags: editing.tags
                })
            });
            setEditing(null);
            setContent("");
            await fetchPrompts();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-8">Prompt Registry</h1>
            
            {editing ? (
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold mb-4">Editing {editing.name} (v{editing.version})</h2>
                    <textarea 
                        className="w-full h-64 bg-[#0a0a0a] border border-white/20 rounded p-4 text-white font-mono text-sm mb-4 focus:outline-none focus:border-blue-500"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex space-x-4">
                        <button 
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Save New Version
                        </button>
                        <button 
                            onClick={() => setEditing(null)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div>Loading prompts...</div>
                    ) : prompts.map(p => (
                        <div key={p.id} className="bg-[#111] border border-white/10 p-6 rounded-xl flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-semibold flex items-center space-x-3">
                                    <span>{p.name}</span>
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">v{p.version}</span>
                                </h3>
                                <p className="text-gray-400 text-sm mt-2 max-w-3xl truncate font-mono bg-[#0a0a0a] p-3 rounded">{p.content}</p>
                            </div>
                            <button 
                                onClick={() => { setEditing(p); setContent(p.content); }}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                                Edit Prompt
                            </button>
                        </div>
                    ))}
                    {prompts.length === 0 && !loading && (
                        <div className="text-gray-400">No prompts found. The system_prompt will be auto-created on first use.</div>
                    )}
                </div>
            )}
        </div>
    );
}
