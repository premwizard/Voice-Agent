// ==============================================================================
// FILE: src/components/CanvasAudioOrb.tsx
// WHAT THIS FILE IS: Futuristic Interactive 3D/Canvas Audio Orb Visualizer
// WHY IT IS USED: Uses HTML5 Canvas animation loops to create a dynamic, glowing, 
//                 pulsating orb with orbiting particles that react to voice state.
// ==============================================================================

"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface CanvasAudioOrbProps {
  isActive: boolean;
  mode: "user" | "ai" | "idle";
  size?: number;
  audioLevel?: number;
}

export default function CanvasAudioOrb({ isActive, mode, size = 180, audioLevel = 0 }: CanvasAudioOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    // Particle pool for ambient floating particles
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      distance: 35 + Math.random() * 45,
      speed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      radius: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    const render = () => {
      tick += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate dynamic radius based on real audio level input
      const levelBoost = audioLevel ? audioLevel * 30 : Math.sin(tick * 3) * 6;
      const baseRadius = isActive ? 50 + levelBoost : 42 + Math.sin(tick) * 2;

      // Warm Luxury Palette Tokens:
      // #F9F8F6 (249, 248, 246)
      // #EFE9E3 (239, 233, 227)
      // #D9CFC7 (217, 207, 199)
      // #C9B59C (201, 181, 156)
      let primaryColor = "201, 181, 156"; // #C9B59C Gold
      let secondaryColor = "217, 207, 199"; // #D9CFC7 Taupe
      let glowColor = "180, 155, 125"; // Warm Deep Oak

      if (mode === "user") {
        primaryColor = "217, 120, 100"; // Muted Rose Gold
        secondaryColor = "201, 181, 156";
        glowColor = "230, 150, 130";
      } else if (mode === "ai") {
        primaryColor = "180, 155, 125"; // Rich Oak
        secondaryColor = "217, 207, 199";
        glowColor = "201, 181, 156";
      }

      // Outer Ripple Waves when active
      if (isActive) {
        for (let i = 1; i <= 3; i++) {
          const ringRadius = baseRadius + ((tick * 15 * i) % 45);
          const ringAlpha = Math.max(0, 1 - (ringRadius - baseRadius) / 45);

          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${primaryColor}, ${ringAlpha * 0.45})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Outer Ambient Glow Aura
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, baseRadius * 0.2,
        centerX, centerY, baseRadius * 2
      );
      glowGradient.addColorStop(0, `rgba(${glowColor}, ${isActive ? 0.5 + (audioLevel * 0.3) : 0.2})`);
      glowGradient.addColorStop(0.5, `rgba(${primaryColor}, ${isActive ? 0.3 + (audioLevel * 0.2) : 0.1})`);
      glowGradient.addColorStop(1, "rgba(249, 248, 246, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Main Deforming Sound Orb Core
      ctx.beginPath();
      const points = 16;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const waveAmp = audioLevel ? 4 + audioLevel * 14 : 5;
        const wave = isActive
          ? Math.sin(angle * 4 + tick * 4) * waveAmp + Math.cos(angle * 2 - tick * 3) * (waveAmp * 0.8)
          : Math.sin(angle * 3 + tick) * 2;
        const r = baseRadius + wave;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const coreGradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        4,
        centerX,
        centerY,
        baseRadius * 1.2
      );
      coreGradient.addColorStop(0, `rgba(249, 248, 246, 0.95)`);
      coreGradient.addColorStop(0.5, `rgba(${primaryColor}, 0.9)`);
      coreGradient.addColorStop(1, `rgba(${secondaryColor}, 0.8)`);

      ctx.fillStyle = coreGradient;
      ctx.shadowColor = `rgba(${primaryColor}, 0.8)`;
      ctx.shadowBlur = isActive ? 25 + (audioLevel * 20) : 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Orbiting Spark Particles
      particles.forEach((p) => {
        p.angle += p.speed * (isActive ? (2 + audioLevel * 3) : 1);
        const distMultiplier = isActive ? 1.2 + Math.sin(tick * 2) * 0.2 + (audioLevel * 0.3) : 1.0;
        const px = centerX + Math.cos(p.angle) * (p.distance * distMultiplier);
        const py = centerY + Math.sin(p.angle) * (p.distance * distMultiplier);

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${glowColor}, ${p.alpha * (isActive ? 0.9 : 0.6)})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, mode, audioLevel]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glowing Aura Ring */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.12, 1] : [1, 1.04, 1],
          opacity: isActive ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: isActive ? 1.8 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute rounded-full pointer-events-none blur-xl bg-[#C9B59C]/40"
        style={{
          width: size * 1.3,
          height: size * 1.3,
        }}
      />

      <canvas
        ref={canvasRef}
        width={size * 1.6}
        height={size * 1.6}
        className="pointer-events-none drop-shadow-lg z-10"
      />
    </div>
  );
}


