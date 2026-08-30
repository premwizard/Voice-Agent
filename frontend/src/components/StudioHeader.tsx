// ==============================================================================
// FILE: src/components/StudioHeader.tsx
// WHAT THIS FILE IS: Header Navigation Component for Phoenix AI Studio.
// WHY IT IS USED: Renders studio title, latency indicator, auto-listen toggle,
//                 mute control, and connection status badge.
// ==============================================================================

"use client";

import { motion } from "framer-motion";
import { Home, Zap, Repeat, Volume2, VolumeX, Wifi } from "lucide-react";

interface StudioHeaderProps {
  onReturnHome: () => void;
  lastLatency: number | null;
  isHandsFreeContinuous: boolean;
  onToggleHandsFree: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  wsActive: boolean;
}

export function StudioHeader({
  onReturnHome,
  lastLatency,
  isHandsFreeContinuous,
  onToggleHandsFree,
  isMuted,
  onToggleMute,
  wsActive,
}: StudioHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-5xl mx-auto flex items-center justify-between py-3.5 px-6 rounded-2xl glass-panel border border-[#D9CFC7] shadow-xl z-10"
    >
      <div className="flex items-center space-x-3.5">
        <button
          onClick={onReturnHome}
          className="w-10 h-10 rounded-xl bg-[#EFE9E3] hover:bg-[#F9F8F6] border border-[#D9CFC7] flex items-center justify-center text-[#2D2825] shadow-sm transition active:scale-95"
          title="Return to Landing Page"
        >
          <Home className="w-5 h-5 text-[#C9B59C]" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#2D2825]">
              Phoenix AI Voice Studio
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] text-[10px] font-bold tracking-wider uppercase">
              v2.5 Hybrid
            </span>
          </div>
          <p className="text-xs text-[#6C625A] hidden sm:block">
            Jarvis Workstation Agent • REST Fast Path + SSE Stream • Barge-in Voice
          </p>
        </div>
      </div>

      {/* Status Indicators & Settings Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Latency Indicator */}
        {lastLatency !== null && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-2.5 py-1 rounded-xl bg-[#EFE9E3] border border-[#D9CFC7] text-[#4A3E35] text-[11px] font-mono flex items-center gap-1 shadow-sm font-bold"
          >
            <Zap className="w-3 h-3 text-[#C9B59C]" />
            <span>{lastLatency}ms</span>
          </motion.div>
        )}

        {/* Hands-Free Auto-Listen Toggle */}
        <button
          onClick={onToggleHandsFree}
          className={`px-3 py-1.5 rounded-xl border transition text-[11px] font-mono flex items-center gap-1.5 active:scale-95 ${
            isHandsFreeContinuous
              ? "bg-[#C9B59C]/30 border-[#C9B59C] text-[#2D2825] font-bold shadow-sm"
              : "bg-[#EFE9E3] border-[#D9CFC7] text-[#6C625A]"
          }`}
          title="Hands-Free Continuous Auto-Listen"
        >
          <Repeat className={`w-3.5 h-3.5 ${isHandsFreeContinuous ? "text-[#4A3E35] animate-spin" : "text-[#847970]"}`} />
          <span className="hidden sm:inline">{isHandsFreeContinuous ? "Auto-Listen ON" : "Manual Mic"}</span>
        </button>

        {/* Mute Audio Button */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 active:scale-95 ${
            isMuted
              ? "bg-rose-100 border-rose-300 text-rose-800 font-bold"
              : "bg-[#EFE9E3] border-[#D9CFC7] text-[#2D2825] hover:bg-[#F9F8F6] font-semibold"
          }`}
          title={isMuted ? "Unmute Voice Output" : "Mute Voice Output"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden md:inline">{isMuted ? "Muted" : "Audio On"}</span>
        </button>

        {/* Hybrid Status Badge */}
        <div className="flex items-center space-x-2 text-xs px-3.5 py-1.5 rounded-xl bg-[#EFE9E3] border border-[#D9CFC7] shadow-sm">
          <Wifi className={`w-3.5 h-3.5 ${wsActive ? "text-emerald-700" : "text-amber-700"}`} />
          <span className="text-[#2D2825] font-mono text-[11px] font-bold hidden sm:inline">
            HYBRID ACTIVE
          </span>
        </div>
      </div>
    </motion.header>
  );
}
