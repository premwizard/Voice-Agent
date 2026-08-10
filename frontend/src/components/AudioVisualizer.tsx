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
    ? "from-[#D97767] via-[#C9B59C] to-[#EFE9E3]" 
    : "from-[#C9B59C] via-[#b5a085] to-[#8C7A6B]";
    
  const glowShadow = mode === "user" 
    ? "shadow-[#D97767]/40 drop-shadow-[0_0_8px_rgba(217,119,103,0.5)]" 
    : "shadow-[#C9B59C]/40 drop-shadow-[0_0_8px_rgba(201,181,156,0.5)]";

  const bars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="flex items-center justify-center space-x-1.5 h-14 px-5 rounded-2xl glass-panel border border-[#D9CFC7] shadow-sm">
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
              isActive ? `animate-pulse ${glowShadow}` : "h-2 opacity-30"
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

