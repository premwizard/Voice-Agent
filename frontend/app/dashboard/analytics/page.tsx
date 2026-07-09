"use client"
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://127.0.0.1:8000/api/observability/analytics?days=7', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return <div className="p-10 text-white">Loading analytics...</div>;
    }

    if (!metrics) {
        return <div className="p-10 text-red-400">Failed to load analytics</div>;
    }

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-8">LLMOps Analytics</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="text-gray-400 text-sm mb-2">Total Requests (7d)</div>
                    <div className="text-3xl font-semibold">{metrics.overview.total_requests}</div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="text-gray-400 text-sm mb-2">Total Tokens</div>
                    <div className="text-3xl font-semibold">{metrics.overview.total_tokens.toLocaleString()}</div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="text-gray-400 text-sm mb-2">Est. Cost</div>
                    <div className="text-3xl font-semibold text-green-400">${metrics.overview.total_cost.toFixed(4)}</div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="text-gray-400 text-sm mb-2">Success Rate</div>
                    <div className="text-3xl font-semibold text-blue-400">{metrics.overview.success_rate_percent}%</div>
                </div>
            </div>

            <div className="bg-[#111] border border-white/10 p-6 rounded-xl mb-10">
                <h2 className="text-xl font-semibold mb-6">Token Usage Trends</h2>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.trends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="date" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                            <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
