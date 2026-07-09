"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TracesPage() {
    const [traces, setTraces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrace, setSelectedTrace] = useState<any>(null);

    useEffect(() => {
        const fetchTraces = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://127.0.0.1:8000/api/observability/traces', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTraces(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTraces();
    }, []);

    const fetchTraceDetail = async (id: str) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:8000/api/observability/traces/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedTrace(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-10">Loading traces...</div>;

    return (
        <div className="p-10 flex h-full gap-6">
            <div className="w-1/3 flex flex-col border border-white/10 rounded-xl bg-[#111] overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-[#151515]">
                    <h2 className="font-semibold">Recent Traces</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {traces.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => fetchTraceDetail(t.id)}
                            className={`p-4 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors ${selectedTrace?.id === t.id ? 'bg-blue-500/10' : ''}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-xs px-2 py-1 rounded ${t.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {t.status.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400">{new Date(t.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-sm text-gray-300 font-mono truncate">{t.request_id}</div>
                            <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                                <span>{t.total_latency_ms.toFixed(0)}ms</span>
                                <span>{t.total_tokens} tokens</span>
                            </div>
                        </div>
                    ))}
                    {traces.length === 0 && <div className="p-4 text-gray-500">No traces recorded yet.</div>}
                </div>
            </div>

            <div className="w-2/3 border border-white/10 rounded-xl bg-[#111] p-6 overflow-y-auto">
                {selectedTrace ? (
                    <div>
                        <div className="flex justify-between items-start border-b border-white/10 pb-6 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">Trace Details</h1>
                                <div className="text-sm font-mono text-gray-400">{selectedTrace.id}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-semibold text-blue-400">{selectedTrace.total_latency_ms.toFixed(1)}ms</div>
                                <div className="text-sm text-gray-400">{selectedTrace.total_tokens} tokens</div>
                                <div className="text-sm text-green-400">${selectedTrace.cost.toFixed(5)}</div>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold mb-4">Execution Spans</h3>
                        <div className="space-y-3">
                            {selectedTrace.spans && selectedTrace.spans.length > 0 ? (
                                selectedTrace.spans.map((span: any) => (
                                    <div key={span.id} className="bg-[#151515] border border-white/5 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-purple-400">{span.name}</span>
                                            <span className="text-sm text-gray-400">{span.latency_ms?.toFixed(1)}ms</span>
                                        </div>
                                        {span.error && (
                                            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded mb-2">
                                                {span.error}
                                            </div>
                                        )}
                                        <pre className="text-xs text-gray-500 bg-black p-2 rounded overflow-x-auto">
                                            {JSON.stringify(span.metadata, null, 2)}
                                        </pre>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 text-sm">No internal spans recorded.</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Select a trace to view details.
                    </div>
                )}
            </div>
        </div>
    );
}
