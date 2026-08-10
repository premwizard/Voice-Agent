// ==============================================================================
// FILE: src/components/QuickPrompts.tsx
// WHAT THIS FILE IS: 1-Click Interactive Prompt Suggestions Component.
// WHY IT IS USED: Offers instant prompt chips to let users test voice interaction without typing.
// ==============================================================================

"use client";

import { motion } from "framer-motion";
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
      <div className="text-[11px] font-bold text-[#6C625A] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-[#C9B59C]" />
        <span>Quick Starter Prompts</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PROMPT_SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(item.prompt)}
              className="glass-panel glass-panel-hover p-2.5 rounded-xl text-left border border-[#D9CFC7] hover:border-[#C9B59C] group transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-lg bg-[#C9B59C]/20 text-[#4A3E35] group-hover:bg-[#C9B59C] group-hover:text-white flex items-center justify-center transition-colors">
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-xs font-bold text-[#2D2825] group-hover:text-[#4A3E35]">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-[#6C625A] group-hover:text-[#2D2825] line-clamp-1 font-sans font-medium">
                {item.prompt}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}


