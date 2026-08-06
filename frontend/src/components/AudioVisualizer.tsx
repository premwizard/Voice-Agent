// ==============================================================================
// FILE: src/components/AudioVisualizer.tsx
// WHAT THIS FILE IS: Modern Dynamic Glassmorphic Audio Wave Equalizer Component.
// WHY IT IS USED: Renders animated glowing audio equalizer wave bars that animate dynamically 
//                 when the user is speaking or the AI is talking, creating a premium visual effect.
// ==============================================================================

"use client";

interface AudioVisualizerProps {
  isActive: boolean;
  mode: "user" | "ai";
  audioLevel?: number;
}

export default function AudioVisualizer({ isActive, mode, audioLevel = 0 }: AudioVisualizerProps) {
  const gradientClass = mode === "user" 
    ? "from-rose-500 via-amber-500 to-orange-400" 
    : "from-cyan-400 via-indigo-500 to-purple-500";
    
  const glowShadow = mode === "user" 
    ? "shadow-rose-500/50 drop-shadow-[0_0_10px_rgba(244,63,94,0.7)]" 
    : "shadow-indigo-500/50 drop-shadow-[0_0_10px_rgba(99,102,241,0.7)]";

  const bars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="flex items-center justify-center space-x-1.5 h-14 px-5 rounded-2xl glass-panel border border-slate-800/80 shadow-2xl">
      {bars.map((bar) => {
        // Base bar heights
        const heights = [18, 32, 24, 42, 28, 38, 22, 34, 20, 28];
        const baseHeight = heights[bar - 1] || 24;
        
        // Dynamically scale height by real audioLevel if provided
        const dynamicMultiplier = audioLevel ? 0.4 + audioLevel * 1.2 : 1.0;
        const heightVal = Math.min(46, Math.max(8, baseHeight * dynamicMultiplier));

        return (
          <span
            key={bar}
            className={`w-1.5 rounded-full transition-all duration-150 bg-gradient-to-t ${gradientClass} ${
              isActive ? `animate-pulse ${glowShadow}` : "h-2 opacity-20"
            }`}
            style={{
              height: isActive ? `${heightVal}px` : "6px",
              animationDelay: `${bar * 80}ms`,
              animationDuration: `${400 + bar * 60}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
