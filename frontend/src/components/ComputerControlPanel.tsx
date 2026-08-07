"use client";

// ==============================================================================
// FILE: frontend/src/components/ComputerControlPanel.tsx
// WHAT THIS FILE IS: Computer Control & Process Management UI Component.
// WHY IT IS USED: Provides quick interactive controls for system volume, screen
//                 brightness, application launcher, process manager, and power options.
// ==============================================================================

import React, { useState } from "react";
import { executeSystemAction, ProcessItem } from "../services/apiService";

export const ComputerControlPanel: React.FC = () => {
  const [volume, setVolume] = useState<number>(50);
  const [brightness, setBrightness] = useState<number>(75);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Power action confirmation state
  const [pendingPowerAction, setPendingPowerAction] = useState<"shutdown" | "restart" | null>(null);

  // Process manager state
  const [showProcesses, setShowProcesses] = useState<boolean>(false);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loadingProcs, setLoadingProcs] = useState<boolean>(false);

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleAppLaunch = async (appName: string) => {
    showFeedback(`Launching ${appName}...`);
    const res = await executeSystemAction("open_application", { app_name: appName });
    if (res.result?.message) {
      showFeedback(res.result.message);
    }
  };

  const handleVolumeChange = async (newVol: number) => {
    setVolume(newVol);
    await executeSystemAction("set_master_volume", { level_percent: newVol });
  };

  const handleBrightnessChange = async (newBright: number) => {
    setBrightness(newBright);
    await executeSystemAction("set_screen_brightness", { level_percent: newBright });
  };

  const handleLockPC = async () => {
    showFeedback("Locking workstation...");
    await executeSystemAction("lock_workstation");
  };

  const handleSleepPC = async () => {
    showFeedback("System entering sleep mode...");
    await executeSystemAction("sleep_system");
  };

  const confirmPowerAction = async () => {
    if (!pendingPowerAction) return;
    const action = pendingPowerAction === "shutdown" ? "shutdown_system" : "restart_system";
    showFeedback(`Initiating ${pendingPowerAction}...`);
    await executeSystemAction(action, { confirmed: true });
    setPendingPowerAction(null);
  };

  const loadProcesses = async () => {
    setLoadingProcs(true);
    const res = await executeSystemAction("list_running_processes", { limit: 12 });
    if (res.result?.processes) {
      setProcesses(res.result.processes);
    }
    setLoadingProcs(false);
  };

  const toggleProcessList = () => {
    if (!showProcesses) {
      loadProcesses();
    }
    setShowProcesses(!showProcesses);
  };

  const handleKillProcess = async (target: string) => {
    showFeedback(`Terminating process ${target}...`);
    const res = await executeSystemAction("terminate_process", { process_name_or_pid: target });
    showFeedback(res.result?.message || "Process termination requested.");
    loadProcesses();
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span>💻 Computer Control & App Launcher</span>
        </h2>
        {statusMessage && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-cyan-950/90 text-cyan-300 border border-cyan-800/60 animate-fade-in">
            {statusMessage}
          </span>
        )}
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sliders Box */}
        <div className="md:col-span-2 bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audio & Display Controls</h3>
          
          {/* Master Volume */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">🔊 Master Volume</span>
              <span className="font-mono text-cyan-400 font-bold">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Screen Brightness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">☀️ Screen Brightness</span>
              <span className="font-mono text-amber-400 font-bold">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* Quick App Launcher */}
        <div className="md:col-span-2 bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Application Launcher</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "VS Code", app: "vscode", icon: "💙" },
              { label: "Chrome", app: "chrome", icon: "🌐" },
              { label: "Terminal", app: "cmd", icon: "⚙️" },
              { label: "Calculator", app: "calc", icon: "🧮" },
              { label: "Notepad", app: "notepad", icon: "📝" },
              { label: "Explorer", app: "explorer", icon: "📁" },
            ].map((item) => (
              <button
                key={item.app}
                onClick={() => handleAppLaunch(item.app)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-200 text-xs font-medium transition-all hover:scale-105"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Workstation Power & Security Toolbar */}
        <div className="md:col-span-4 bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleProcessList}
              className="px-3.5 py-2 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 text-indigo-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <span>📊</span>
              <span>{showProcesses ? "Hide Process Manager" : "Open Process Manager"}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLockPC}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1"
            >
              🔒 Lock PC
            </button>
            <button
              onClick={handleSleepPC}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1"
            >
              🌙 Sleep
            </button>
            <button
              onClick={() => setPendingPowerAction("restart")}
              className="px-3 py-2 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 text-xs font-medium transition-colors border border-amber-800/60 flex items-center gap-1"
            >
              🔄 Reboot
            </button>
            <button
              onClick={() => setPendingPowerAction("shutdown")}
              className="px-3 py-2 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-medium transition-colors border border-red-800/60 flex items-center gap-1"
            >
              ⚡ Shutdown
            </button>
          </div>
        </div>
      </div>

      {/* Running Process Manager Drawer */}
      {showProcesses && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Active System Processes</span>
              {loadingProcs && <span className="text-cyan-400 text-xs animate-pulse">(refreshing...)</span>}
            </h4>
            <button
              onClick={loadProcesses}
              className="text-xs text-cyan-400 hover:underline"
            >
              Refresh List
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {processes.map((proc) => (
              <div
                key={proc.pid}
                className="flex items-center justify-between py-1.5 px-3 bg-slate-900/80 border border-slate-800/80 rounded-lg text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-400 text-[11px] w-12">PID {proc.pid}</span>
                  <span className="font-medium text-slate-200">{proc.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-mono text-slate-400 text-[11px]">CPU: {proc.cpu_percent}%</span>
                  <span className="font-mono text-slate-400 text-[11px]">RAM: {proc.memory_percent}%</span>
                  <button
                    onClick={() => handleKillProcess(String(proc.pid))}
                    className="px-2 py-0.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded text-[11px] border border-red-800/50"
                  >
                    Kill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Power Confirmation Modal */}
      {pendingPowerAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              ⚠️ Confirm System {pendingPowerAction === "shutdown" ? "Shutdown" : "Restart"}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to {pendingPowerAction} your computer? Any unsaved work in other applications may be lost.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setPendingPowerAction(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmPowerAction}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
              >
                Confirm {pendingPowerAction === "shutdown" ? "Shutdown" : "Restart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
