"use client";

// ==============================================================================
// FILE: frontend/src/components/ComputerControlPanel.tsx
// WHAT THIS FILE IS: Computer Control & Hardware Sync Component.
// WHY IT IS USED: Provides live bi-directional hardware level synchronization for system 
//                 volume and screen brightness, matching laptop physical keys and OS state.
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { executeSystemAction, ProcessItem } from "../services/apiService";
import {
  Volume2,
  Sun,
  Laptop,
  RotateCw,
  Lock,
  Moon,
  Power,
  RefreshCcw,
  Activity,
  Terminal,
  Calculator,
  FileText,
  Globe,
  Code,
  Rocket,
  XCircle,
  AlertTriangle,
  Sliders,
} from "lucide-react";

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

  const isUserDraggingRef = useRef<boolean>(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const brightDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Lock polling while user is actively sliding or recently slid
  const markUserActive = () => {
    isUserDraggingRef.current = true;
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      isUserDraggingRef.current = false;
    }, 4000);
  };

  // Sync volume and brightness from OS hardware
  const syncHardwareLevels = async () => {
    if (isUserDraggingRef.current) return;

    try {
      const volRes = await executeSystemAction("get_master_volume");
      if (!isUserDraggingRef.current) {
        if (volRes.result?.data?.volume_percent !== undefined) {
          setVolume(volRes.result.data.volume_percent);
        } else if (volRes.result?.data?.level !== undefined) {
          setVolume(volRes.result.data.level);
        }
      }

      const brightRes = await executeSystemAction("get_screen_brightness");
      if (!isUserDraggingRef.current) {
        if (brightRes.result?.data?.brightness_percent !== undefined) {
          setBrightness(brightRes.result.data.brightness_percent);
        } else if (brightRes.result?.data?.brightness !== undefined) {
          setBrightness(brightRes.result.data.brightness);
        }
      }
    } catch (e) {
      console.warn("Hardware level sync failed:", e);
    }
  };

  // Initial fetch and 3-second polling loop for real-time hardware sync
  useEffect(() => {
    syncHardwareLevels();
    const timer = setInterval(() => {
      syncHardwareLevels();
    }, 3000);

    return () => {
      clearInterval(timer);
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      if (volDebounceRef.current) clearTimeout(volDebounceRef.current);
      if (brightDebounceRef.current) clearTimeout(brightDebounceRef.current);
    };
  }, []);

  const handleAppLaunch = async (appName: string) => {
    showFeedback(`Launching ${appName}...`);
    const res = await executeSystemAction("open_application", { app_name: appName });
    if (res.result?.message) {
      showFeedback(res.result.message);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    markUserActive();

    if (volDebounceRef.current) clearTimeout(volDebounceRef.current);
    volDebounceRef.current = setTimeout(async () => {
      await executeSystemAction("set_master_volume", { level_percent: newVol });
    }, 180);
  };

  const handleBrightnessChange = (newBright: number) => {
    setBrightness(newBright);
    markUserActive();

    if (brightDebounceRef.current) clearTimeout(brightDebounceRef.current);
    brightDebounceRef.current = setTimeout(async () => {
      await executeSystemAction("set_screen_brightness", { level_percent: newBright });
    }, 180);
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
    if (res.result?.data?.processes) {
      setProcesses(res.result.data.processes);
    } else if (res.result?.processes) {
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
    <div className="w-full glass-panel border border-[#D9CFC7] rounded-2xl p-5 shadow-xl space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#D9CFC7] pb-3">
        <h2 className="text-base font-bold text-[#2D2825] flex items-center gap-2">
          <Laptop className="w-4 h-4 text-[#4A3E35]" />
          <span>Computer Control & Application Automation</span>
        </h2>
        {statusMessage && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#C9B59C]/20 text-[#4A3E35] border border-[#C9B59C]/40 font-mono"
          >
            {statusMessage}
          </motion.span>
        )}
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sliders Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-[#F9F8F6]/80 border border-[#D9CFC7] rounded-xl p-4 space-y-4 glass-panel-hover"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#2D2825] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#4A3E35]" /> Audio & Display Controls
            </h3>
            <button
              onClick={syncHardwareLevels}
              className="text-[11px] text-[#4A3E35] hover:underline transition flex items-center gap-1 font-mono font-bold"
            >
              <RotateCw className="w-3 h-3" /> Sync OS Driver
            </button>
          </div>
          
          {/* Master Volume */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#2D2825]">
              <span className="flex items-center gap-1.5 font-bold">
                <Volume2 className="w-4 h-4 text-[#4A3E35]" /> Master Volume
              </span>
              <span className="font-mono text-[#4A3E35] font-bold">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-2 bg-[#D9CFC7]/50 rounded-lg appearance-none cursor-pointer accent-[#C9B59C] transition"
            />
          </div>

          {/* Screen Brightness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#2D2825]">
              <span className="flex items-center gap-1.5 font-bold">
                <Sun className="w-4 h-4 text-[#4A3E35]" /> Screen Brightness
              </span>
              <span className="font-mono text-[#4A3E35] font-bold">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full h-2 bg-[#D9CFC7]/50 rounded-lg appearance-none cursor-pointer accent-[#C9B59C] transition"
            />
          </div>
        </motion.div>

        {/* Quick App Launcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-[#F9F8F6]/80 border border-[#D9CFC7] rounded-xl p-4 space-y-3 glass-panel-hover"
        >
          <h3 className="text-xs font-bold text-[#2D2825] uppercase tracking-wider flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-[#4A3E35]" /> Quick App Launcher
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Antigravity", app: "antigravity", icon: <Rocket className="w-3.5 h-3.5 text-[#4A3E35]" /> },
              { label: "VS Code", app: "vscode", icon: <Code className="w-3.5 h-3.5 text-[#4A3E35]" /> },
              { label: "Chrome", app: "chrome", icon: <Globe className="w-3.5 h-3.5 text-[#4A3E35]" /> },
              { label: "Terminal", app: "cmd", icon: <Terminal className="w-3.5 h-3.5 text-[#4A3E35]" /> },
              { label: "Calculator", app: "calc", icon: <Calculator className="w-3.5 h-3.5 text-[#4A3E35]" /> },
              { label: "Notepad", app: "notepad", icon: <FileText className="w-3.5 h-3.5 text-[#4A3E35]" /> },
            ].map((item) => (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                key={item.app}
                onClick={() => handleAppLaunch(item.app)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#EFE9E3] hover:bg-[#F9F8F6] border border-[#D9CFC7] text-[#2D2825] text-xs font-bold transition-all shadow-sm"
              >
                {item.icon}
                <span>{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Workstation Power & Security Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-4 bg-[#F9F8F6]/80 border border-[#D9CFC7] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleProcessList}
              className="px-3.5 py-2 rounded-lg bg-[#EFE9E3] hover:bg-[#F9F8F6] border border-[#D9CFC7] text-[#2D2825] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Activity className="w-4 h-4 text-[#4A3E35]" />
              <span>{showProcesses ? "Hide Process Manager" : "Open Process Manager"}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLockPC}
              className="px-3 py-2 rounded-lg bg-[#EFE9E3] hover:bg-[#F9F8F6] text-[#2D2825] text-xs font-bold transition-colors border border-[#D9CFC7] flex items-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-[#4A3E35]" /> Lock PC
            </button>
            <button
              onClick={handleSleepPC}
              className="px-3 py-2 rounded-lg bg-[#EFE9E3] hover:bg-[#F9F8F6] text-[#2D2825] text-xs font-bold transition-colors border border-[#D9CFC7] flex items-center gap-1.5 shadow-sm"
            >
              <Moon className="w-3.5 h-3.5 text-[#4A3E35]" /> Sleep
            </button>
            <button
              onClick={() => setPendingPowerAction("restart")}
              className="px-3 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors border border-amber-300 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-amber-900" /> Reboot
            </button>
            <button
              onClick={() => setPendingPowerAction("shutdown")}
              className="px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold transition-colors border border-rose-300 flex items-center gap-1.5 shadow-sm"
            >
              <Power className="w-3.5 h-3.5 text-rose-900" /> Shutdown
            </button>
          </div>
        </motion.div>
      </div>

      {/* Running Process Manager Drawer */}
      <AnimatePresence>
        {showProcesses && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl p-4 space-y-3 overflow-hidden shadow-inner"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#2D2825] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#4A3E35]" />
                <span>Active System Processes</span>
                {loadingProcs && <span className="text-[#C9B59C] text-xs animate-pulse font-bold">(refreshing...)</span>}
              </h4>
              <button
                onClick={loadProcesses}
                className="text-xs text-[#4A3E35] hover:underline flex items-center gap-1 font-bold"
              >
                <RotateCw className="w-3 h-3" /> Refresh List
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {processes.map((proc) => (
                <div
                  key={proc.pid}
                  className="flex items-center justify-between py-1.5 px-3 bg-[#EFE9E3] border border-[#D9CFC7] rounded-lg text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-[#6C625A] text-[11px] w-14 font-semibold">PID {proc.pid}</span>
                    <span className="font-bold text-[#2D2825]">{proc.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono text-[#6C625A] text-[11px] font-medium">CPU: {proc.cpu_percent}%</span>
                    <span className="font-mono text-[#6C625A] text-[11px] font-medium">RAM: {proc.memory_percent}%</span>
                    <button
                      onClick={() => handleKillProcess(String(proc.pid))}
                      className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold rounded text-[11px] border border-rose-300 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Kill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power Confirmation Modal */}
      <AnimatePresence>
        {pendingPowerAction && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F9F8F6] border border-[#D9CFC7] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-[#2D2825] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <span>Confirm System {pendingPowerAction === "shutdown" ? "Shutdown" : "Restart"}</span>
              </h3>
              <p className="text-xs text-[#6C625A] leading-relaxed font-medium">
                Are you sure you want to {pendingPowerAction} your computer? Any unsaved work in other applications may be lost.
              </p>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setPendingPowerAction(null)}
                  className="px-4 py-2 rounded-lg bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#2D2825] text-xs font-bold transition border border-[#D9CFC7]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPowerAction}
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-md transition"
                >
                  Confirm {pendingPowerAction === "shutdown" ? "Shutdown" : "Restart"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
