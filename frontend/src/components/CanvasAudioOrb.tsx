// ==============================================================================
// FILE: src/components/CanvasAudioOrb.tsx
// WHAT THIS FILE IS: Futuristic Interactive 3D/Canvas Audio Orb Visualizer
// WHY IT IS USED: Uses HTML5 Canvas animation loops to create a dynamic, glowing, 
//                 pulsating orb with orbiting particles that react to voice state.
// ==============================================================================

"use client";

import { useEffect, useRef } from "react";

interface CanvasAudioOrbProps {
  isActive: boolean;
  mode: "user" | "ai" | "idle";
  size?: number;
}

export default function CanvasAudioOrb({ isActive, mode, size = 180 }: CanvasAudioOrbProps) {
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
      const baseRadius = isActive ? 52 + Math.sin(tick * 3) * 6 : 42 + Math.sin(tick) * 2;

      // Select colors based on current voice mode
      let primaryColor = "99, 102, 241"; // Indigo
      let secondaryColor = "168, 85, 247"; // Purple
      let glowColor = "129, 140, 248";

      if (mode === "user") {
        primaryColor = "244, 63, 94"; // Rose
        secondaryColor = "249, 115, 22"; // Orange
        glowColor = "251, 113, 133";
      } else if (mode === "ai") {
        primaryColor = "59, 130, 246"; // Blue
        secondaryColor = "168, 85, 247"; // Purple
        glowColor = "56, 189, 248";
      }

      // Outer Ripple Waves when active
      if (isActive) {
        for (let i = 1; i <= 3; i++) {
          const ringRadius = baseRadius + ((tick * 15 * i) % 45);
          const ringAlpha = Math.max(0, 1 - (ringRadius - baseRadius) / 45);

          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${primaryColor}, ${ringAlpha * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Outer Ambient Glow Aura
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, baseRadius * 0.2,
        centerX, centerY, baseRadius * 2
      );
      glowGradient.addColorStop(0, `rgba(${glowColor}, ${isActive ? 0.45 : 0.15})`);
      glowGradient.addColorStop(0.5, `rgba(${primaryColor}, ${isActive ? 0.25 : 0.08})`);
      glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Main Deforming Sound Orb Core
      ctx.beginPath();
      const points = 16;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave = isActive
          ? Math.sin(angle * 4 + tick * 4) * 5 + Math.cos(angle * 2 - tick * 3) * 4
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
      coreGradient.addColorStop(0, `rgba(${glowColor}, 0.9)`);
      coreGradient.addColorStop(0.5, `rgba(${primaryColor}, 0.8)`);
      coreGradient.addColorStop(1, `rgba(${secondaryColor}, 0.6)`);

      ctx.fillStyle = coreGradient;
      ctx.shadowColor = `rgba(${primaryColor}, 0.8)`;
      ctx.shadowBlur = isActive ? 25 : 12;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Orbiting Spark Particles
      particles.forEach((p) => {
        p.angle += p.speed * (isActive ? 2 : 1);
        const distMultiplier = isActive ? 1.2 + Math.sin(tick * 2) * 0.2 : 1.0;
        const px = centerX + Math.cos(p.angle) * (p.distance * distMultiplier);
        const py = centerY + Math.sin(p.angle) * (p.distance * distMultiplier);

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${glowColor}, ${p.alpha * (isActive ? 0.9 : 0.5)})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, mode]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={size * 1.6}
        height={size * 1.6}
        className="pointer-events-none drop-shadow-2xl"
      />
    </div>
  );
}
