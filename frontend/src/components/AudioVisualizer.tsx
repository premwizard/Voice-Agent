// ==============================================================================
// FILE: src/components/AudioVisualizer.tsx
// WHAT THIS FILE IS: Modern Dynamic Glassmorphic Audio Wave Visualizer Component.
// WHY IT IS USED: Renders animated glowing audio equalizer wave bars that animate dynamically 
//                 when the user is speaking or the AI is talking, creating a premium visual effect.
// ==============================================================================

"use client";

interface AudioVisualizerProps {
  // State indicating if audio activity is active (listening or speaking)
  isActive: boolean;
  // Color theme mode ('user' for listening mic or 'ai' for AI speaking)
  mode: "user" | "ai";
}

export default function AudioVisualizer({ isActive, mode }: AudioVisualizerProps) {
  // Color setup depending on mode
  const gradientClass = mode === "user" 
    ? "from-red-500 via-rose-500 to-amber-500" 
    : "from-blue-500 via-indigo-500 to-purple-500";
    
  const shadowGlow = mode === "user" 
    ? "shadow-red-500/50 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
    : "shadow-indigo-500/50 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]";

  return (
    <div className="flex items-center justify-center space-x-2 h-16 py-3 px-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
      {/* Generate 7 glowing animated audio wave equalizer bars */}
      {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
        <span
          key={bar}
          className={`w-2 rounded-full transition-all duration-300 bg-gradient-to-t ${gradientClass} ${
            isActive ? `animate-pulse ${shadowGlow}` : "h-2 opacity-25"
          }`}
          style={{
            height: isActive ? `${Math.floor(Math.random() * 36) + 12}px` : "8px",
            animationDelay: `${bar * 120}ms`,
            animationDuration: `${500 + bar * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}
