// ==============================================================================
// FILE: src/components/StudioNavigation.tsx
// WHAT THIS FILE IS: Navigation Tabs & Model Selector Component.
// WHY IT IS USED: Switches between Voice Studio, System Telemetry, and Computer Control
//                 views, and changes target AI LLM models.
// ==============================================================================

"use client";

import { MessageSquare, Monitor, SlidersHorizontal, Bot } from "lucide-react";
import { AI_MODELS, ActiveTab } from "@/config/constants";

interface StudioNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function StudioNavigation({
  activeTab,
  onTabChange,
  selectedModel,
  onModelChange,
}: StudioNavigationProps) {
  return (
    <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 border-b border-[#D9CFC7] mt-4 pb-2 z-10">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onTabChange("studio")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
            activeTab === "studio"
              ? "bg-[#C9B59C] border border-[#b5a085] text-white shadow-md"
              : "bg-[#EFE9E3]/70 border border-[#D9CFC7] text-[#6C625A] hover:text-[#2D2825]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Voice Studio</span>
        </button>

        <button
          onClick={() => onTabChange("telemetry")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
            activeTab === "telemetry"
              ? "bg-[#C9B59C] border border-[#b5a085] text-white shadow-md"
              : "bg-[#EFE9E3]/70 border border-[#D9CFC7] text-[#6C625A] hover:text-[#2D2825]"
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>System Telemetry</span>
        </button>

        <button
          onClick={() => onTabChange("control")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
            activeTab === "control"
              ? "bg-[#C9B59C] border border-[#b5a085] text-white shadow-md"
              : "bg-[#EFE9E3]/70 border border-[#D9CFC7] text-[#6C625A] hover:text-[#2D2825]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Computer Control</span>
        </button>
      </div>

      {/* Model Selector */}
      <div className="hidden md:flex items-center space-x-2 text-xs">
        <Bot className="w-3.5 h-3.5 text-[#4A3E35]" />
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="bg-[#EFE9E3] border border-[#D9CFC7] rounded-xl px-2.5 py-1 text-[#2D2825] focus:outline-none focus:border-[#C9B59C] font-mono text-[11px] font-semibold"
        >
          {AI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
