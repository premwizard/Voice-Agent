// ==============================================================================
// FILE: frontend/src/components/TelemetryWidget.tsx
// WHAT THIS FILE IS: Glassmorphic Real-Time Telemetry Dashboard Component.
// WHY IT IS USED: Displays live CPU, RAM, Disk, Network, and Battery metrics with
//                 automatic 3-second periodic polling when mounted/active.
// ==============================================================================

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { fetchSystemTelemetry, SystemTelemetry } from "../services/apiService";
import { Cpu, HardDrive, MemoryStick, RefreshCw, Activity, Server, Zap, Wifi } from "lucide-react";

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
    loadMetrics();
    const interval = setInterval(() => {
      loadMetrics();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadMetrics]);

  const getMetricColor = (percent: number) => {
    if (percent >= 85) return "from-rose-500 to-rose-700";
    if (percent >= 70) return "from-amber-600 to-amber-700";
    return "from-[#C9B59C] to-[#9E8A73]";
  };

  const getMetricBadge = (percent: number) => {
    if (percent >= 85) return "bg-rose-100 text-rose-800 border-rose-300";
    if (percent >= 70) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-[#C9B59C]/20 text-[#4A3E35] border-[#C9B59C]/40";
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 shadow-xl space-y-4 border border-[#D9CFC7]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D9CFC7] pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-[#C9B59C] animate-ping" />
          <h2 className="text-base font-bold text-[#2D2825] tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#4A3E35]" />
            <span>Workstation Hardware Telemetry</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9B59C]/20 text-[#4A3E35] border border-[#C9B59C]/40 font-mono font-bold">
              LIVE (3s)
            </span>
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-[11px] text-[#6C625A] font-mono font-semibold hidden sm:inline">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadMetrics}
            className="p-1.5 rounded-lg bg-[#EFE9E3] hover:bg-[#F9F8F6] text-[#2D2825] transition-all text-xs flex items-center gap-1 border border-[#D9CFC7] active:scale-95 shadow-sm"
            title="Refresh Now"
          >
            <RefreshCw className="w-3.5 h-3.5 hover:rotate-180 transition-transform duration-500 text-[#4A3E35]" />
          </button>
        </div>
      </div>

      {isLoading && !telemetry ? (
        <div className="py-8 text-center text-[#6C625A] text-sm animate-pulse flex items-center justify-center gap-2 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-[#C9B59C]" />
          Connecting to system telemetry agent...
        </div>
      ) : telemetry ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Gauge Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#F9F8F6]/80 border border-[#D9CFC7] rounded-xl p-4 flex flex-col justify-between space-y-3 glass-panel-hover"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#2D2825] uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#4A3E35]" />
                CPU Usage
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${getMetricBadge(telemetry.cpu_usage_percent)}`}>
                {telemetry.cpu_usage_percent}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-[#D9CFC7]/50 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, telemetry.cpu_usage_percent)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${getMetricColor(telemetry.cpu_usage_percent)} rounded-full`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#6C625A] font-mono font-medium">
                <span>{telemetry.processor ? telemetry.processor.split(" ")[0] : "Processor"}</span>
                <span>{telemetry.cpu_count_logical} Logical Cores</span>
              </div>
            </div>
          </motion.div>

          {/* RAM Gauge Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-[#F9F8F6]/80 border border-[#D9CFC7] rounded-xl p-4 flex flex-col justify-between space-y-3 glass-panel-hover"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#2D2825] uppercase tracking-wider flex items-center gap-1.5">
                <MemoryStick className="w-4 h-4 text-[#4A3E35]" />
                Memory (RAM)
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${getMetricBadge(telemetry.ram_percent)}`}>
                {telemetry.ram_percent}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-[#D9CFC7]/50 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, telemetry.ram_percent)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${getMetricColor(telemetry.ram_percent)} rounded-full`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#6C625A] font-mono font-medium">
                <span>{telemetry.ram_used_gb} GB used</span>
                <span>{telemetry.ram_total_gb} GB total</span>
              </div>
            </div>
          </motion.div>

          {/* Disk Gauge Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-[#F9F8F6]/80 border border-[#D9CFC7] rounded-xl p-4 flex flex-col justify-between space-y-3 glass-panel-hover"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#2D2825] uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#4A3E35]" />
                Storage Disk
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${getMetricBadge(telemetry.disk_percent)}`}>
                {telemetry.disk_percent}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-[#D9CFC7]/50 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, telemetry.disk_percent)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${getMetricColor(telemetry.disk_percent)} rounded-full`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#6C625A] font-mono font-medium">
                <span>{telemetry.disk_free_gb} GB free</span>
                <span>{telemetry.disk_total_gb} GB total</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Metrics Strip */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-[#EFE9E3]/70 border border-[#D9CFC7] rounded-lg p-2.5 text-center">
              <span className="text-[10px] font-bold text-[#6C625A] uppercase tracking-wider flex items-center justify-center gap-1">
                <Server className="w-3 h-3 text-[#4A3E35]" /> OS Kernel
              </span>
              <span className="text-xs font-bold text-[#2D2825]">{telemetry.os} {telemetry.os_version?.split(" ")[0]}</span>
            </div>
            <div className="bg-[#EFE9E3]/70 border border-[#D9CFC7] rounded-lg p-2.5 text-center">
              <span className="text-[10px] font-bold text-[#6C625A] uppercase tracking-wider flex items-center justify-center gap-1">
                <Activity className="w-3 h-3 text-[#4A3E35]" /> Tasks
              </span>
              <span className="text-xs font-bold text-[#4A3E35] font-mono">{telemetry.total_processes} processes</span>
            </div>
            <div className="bg-[#EFE9E3]/70 border border-[#D9CFC7] rounded-lg p-2.5 text-center">
              <span className="text-[10px] font-bold text-[#6C625A] uppercase tracking-wider flex items-center justify-center gap-1">
                <Wifi className="w-3 h-3 text-[#4A3E35]" /> Network
              </span>
              <span className="text-xs font-bold text-[#4A3E35] font-mono">↑{telemetry.net_bytes_sent_mb} MB / ↓{telemetry.net_bytes_recv_mb} MB</span>
            </div>
            <div className="bg-[#EFE9E3]/70 border border-[#D9CFC7] rounded-lg p-2.5 text-center">
              <span className="text-[10px] font-bold text-[#6C625A] uppercase tracking-wider flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-[#4A3E35]" /> Power
              </span>
              <span className="text-xs font-bold text-[#4A3E35] font-mono">
                {telemetry.battery ? `${telemetry.battery.percent}% ${telemetry.battery.power_plugged ? "⚡" : "🔋"}` : "AC Power 🔌"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-[#6C625A] text-xs font-medium">
          Unable to fetch system telemetry. Backend service may be offline.
        </div>
      )}
    </div>
  );
};


