"use client";

// ==============================================================================
// FILE: frontend/src/components/TelemetryWidget.tsx
// WHAT THIS FILE IS: Glassmorphic Real-Time Telemetry Dashboard Component.
// WHY IT IS USED: Displays live CPU, RAM, Disk, Network, and Battery metrics with
//                 automatic 3-second periodic polling when mounted/active.
// ==============================================================================

import React, { useEffect, useState, useCallback } from "react";
import { fetchSystemTelemetry, SystemTelemetry } from "../services/apiService";

export const TelemetryWidget: React.FC = () => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadMetrics = useCallback(async () => {
    const data = await fetchSystemTelemetry();
    if (data) {
      setTelemetry(data);
      setLastUpdated(new Date());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Initial fetch
    loadMetrics();

    // User preference: 3-second periodic polling when dashboard component is open
    const interval = setInterval(() => {
      loadMetrics();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadMetrics]);

  const getMetricColor = (percent: number) => {
    if (percent >= 85) return "from-red-500 to-rose-600 border-red-500/50 shadow-red-500/20";
    if (percent >= 70) return "from-amber-400 to-orange-500 border-amber-400/50 shadow-amber-400/20";
    return "from-cyan-400 to-emerald-400 border-emerald-400/50 shadow-emerald-400/20";
  };

  const getMetricBadge = (percent: number) => {
    if (percent >= 85) return "bg-red-500/20 text-red-300 border-red-500/40";
    if (percent >= 70) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
          <h2 className="text-base font-semibold text-slate-100 tracking-wide flex items-center gap-2">
            <span>⚡ Workstation Telemetry</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 font-mono">
              LIVE (3s)
            </span>
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadMetrics}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-colors text-xs flex items-center gap-1"
            title="Refresh Now"
          >
            🔄
          </button>
        </div>
      </div>

      {isLoading && !telemetry ? (
        <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
          Connecting to system telemetry agent...
        </div>
      ) : telemetry ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Gauge Card */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">CPU Usage</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${getMetricBadge(telemetry.cpu_usage_percent)}`}>
                {telemetry.cpu_usage_percent}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getMetricColor(telemetry.cpu_usage_percent)} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, telemetry.cpu_usage_percent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{telemetry.processor ? telemetry.processor.split(" ")[0] : "Processor"}</span>
                <span>{telemetry.cpu_count_logical} Cores</span>
              </div>
            </div>
          </div>

          {/* RAM Gauge Card */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Memory (RAM)</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${getMetricBadge(telemetry.ram_percent)}`}>
                {telemetry.ram_percent}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getMetricColor(telemetry.ram_percent)} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, telemetry.ram_percent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{telemetry.ram_used_gb} GB used</span>
                <span>{telemetry.ram_total_gb} GB total</span>
              </div>
            </div>
          </div>

          {/* Disk Gauge Card */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Disk Usage</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${getMetricBadge(telemetry.disk_percent)}`}>
                {telemetry.disk_percent}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getMetricColor(telemetry.disk_percent)} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, telemetry.disk_percent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{telemetry.disk_free_gb} GB free</span>
                <span>{telemetry.disk_total_gb} GB total</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-950/30 border border-slate-800/40 rounded-lg p-2.5 text-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Operating System</span>
              <span className="text-xs font-semibold text-slate-200">{telemetry.os} {telemetry.os_version?.split(" ")[0]}</span>
            </div>
            <div className="bg-slate-950/30 border border-slate-800/40 rounded-lg p-2.5 text-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Active Processes</span>
              <span className="text-xs font-semibold text-cyan-400 font-mono">{telemetry.total_processes} tasks</span>
            </div>
            <div className="bg-slate-950/30 border border-slate-800/40 rounded-lg p-2.5 text-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Network I/O</span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">↑{telemetry.net_bytes_sent_mb} MB / ↓{telemetry.net_bytes_recv_mb} MB</span>
            </div>
            <div className="bg-slate-950/30 border border-slate-800/40 rounded-lg p-2.5 text-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Power Source</span>
              <span className="text-xs font-semibold text-purple-400 font-mono">
                {telemetry.battery ? `${telemetry.battery.percent}% ${telemetry.battery.power_plugged ? "⚡" : "🔋"}` : "AC Power 🔌"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-slate-400 text-xs">
          Unable to fetch system telemetry. Backend service may be offline.
        </div>
      )}
    </div>
  );
};
