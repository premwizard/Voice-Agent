// ==============================================================================
// FILE: src/components/QuickPrompts.tsx
// WHAT THIS FILE IS: 1-Click Interactive Prompt Suggestions Component.
// WHY IT IS USED: Offers instant prompt chips to let users test voice interaction without typing.
// ==============================================================================

"use client";

import { Sparkles, Compass, Lightbulb, Code2 } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

const PROMPT_SUGGESTIONS = [
  {
    icon: Sparkles,
    title: "Say Hello",
    prompt: "Hello! Tell me a fun fact about voice AI.",
  },
  {
    icon: Compass,
    title: "Explain Concept",
    prompt: "Explain Quantum Physics in simple terms.",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm",
    prompt: "Give me 3 innovative startup ideas for 2026.",
  },
  {
    icon: Code2,
    title: "Tech Stack",
    prompt: "What makes FastAPI and WebSockets great for voice agents?",
  },
];

export default function QuickPrompts({ onSelectPrompt, disabled }: QuickPromptsProps) {
  return (
    <div className="w-full">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Quick Starter Prompts</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PROMPT_SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(item.prompt)}
              className="glass-panel glass-panel-hover p-2.5 rounded-xl text-left border border-slate-800 hover:border-indigo-500/40 group transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-colors">
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-300 line-clamp-1">
                {item.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
