"use client"
import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, Cpu } from 'lucide-react';

export default function OperationsPage() {
    const [health, setHealth] = useState<any>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/health/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHealth(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchMetrics = async () => {
        try {
            // Note: in a real prod environment, /api/system/metrics returns prometheus plain text
            // Here we just simulate parsing it or providing a simplified view.
            const res = await fetch('http://127.0.0.1:8000/api/system/metrics');
            if (res.ok) {
                const text = await res.text();
                // Simple parser for demo purposes
                const lines = text.split('\n').filter(l => l && !l.startsWith('#'));
                const m: any = {};
                lines.forEach(l => {
                    const [k, v] = l.split(' ');
                    if (k && v) m[k] = v;
                });
                setMetrics(m);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        Promise.all([fetchHealth(), fetchMetrics()]).finally(() => setLoading(false));
        const interval = setInterval(() => {
            fetchHealth();
            fetchMetrics();
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-10 text-white">Loading operations data...</div>;

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-8 flex items-center space-x-3">
                <Server className="text-blue-500" />
                <span>Operations Dashboard</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className={`bg-[#111] border p-6 rounded-xl ${health?.status === 'ok' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    <div className="text-gray-400 text-sm mb-2 flex items-center space-x-2">
                        <Activity size={16} /> <span>System Status</span>
                    </div>
                    <div className={`text-2xl font-bold ${health?.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                        {health?.status.toUpperCase() || 'UNKNOWN'}
                    </div>
                </div>

                <div className={`bg-[#111] border p-6 rounded-xl ${health?.database === 'ok' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    <div className="text-gray-400 text-sm mb-2 flex items-center space-x-2">
                        <Database size={16} /> <span>Database</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                        {health?.database || 'UNKNOWN'}
                    </div>
                </div>

                <div className={`bg-[#111] border p-6 rounded-xl ${health?.redis === 'ok' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    <div className="text-gray-400 text-sm mb-2 flex items-center space-x-2">
                        <Server size={16} /> <span>Redis Cache</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                        {health?.redis || 'UNKNOWN'}
                    </div>
                </div>

                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="text-gray-400 text-sm mb-2 flex items-center space-x-2">
                        <Cpu size={16} /> <span>CPU & Memory</span>
                    </div>
                    <div className="text-lg font-bold text-white flex justify-between">
                        <span>CPU: {health?.cpu_usage}%</span>
                        <span>MEM: {health?.memory_usage}%</span>
                    </div>
                </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-4">Raw Prometheus Metrics</h2>
                <div className="h-96 overflow-y-auto custom-scrollbar">
                    {metrics ? (
                        <pre className="text-xs text-gray-400 font-mono">
                            {Object.entries(metrics).map(([k, v]) => (
                                <div key={k} className="hover:bg-white/5 py-1 px-2 rounded">
                                    <span className="text-purple-400">{k}</span>: <span className="text-green-400">{v as string}</span>
                                </div>
                            ))}
                        </pre>
                    ) : (
                        <div className="text-gray-500 text-sm">No metrics available. Ensure Prometheus instrumentator is running.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
