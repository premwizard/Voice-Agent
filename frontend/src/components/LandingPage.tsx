// ==============================================================================
// FILE: src/components/LandingPage.tsx
// WHAT THIS FILE IS: Luxury Landing Page powered by GSAP Animations & Three.js 3D.
// WHY IT IS USED: Serves as the landing experience featuring GSAP text reveals,
//                 staggered scroll animations, 3D WebGL visuals, and a direct CTA to launch the Voice Studio.
// ==============================================================================

"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { LandingHero3D } from "./LandingHero3D";
import {
  Sparkles,
  Zap,
  Cpu,
  Radio,
  SlidersHorizontal,
  Activity,
  ArrowRight,
  ShieldCheck,
  Globe,
  Terminal,
  Volume2,
  Lock,
} from "lucide-react";

interface LandingPageProps {
  onLaunchStudio: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchStudio }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Timeline Entrance
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(badgeRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.8,
      })
        .from(
          titleRef.current,
          {
            y: 40,
            opacity: 0,
            duration: 1,
            scale: 0.96,
          },
          "-=0.5"
        )
        .from(
          subtitleRef.current,
          {
            y: 25,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          ctaRef.current,
          {
            y: 20,
            opacity: 0,
            scale: 0.95,
            duration: 0.7,
          },
          "-=0.5"
        );

      // 2. Feature Cards GSAP Stagger Reveal
      if (cardsRef.current) {
        gsap.from(cardsRef.current.children, {
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          delay: 0.6,
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="min-h-screen bg-[#F9F8F6] text-[#2D2825] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#C9B59C]/30">
      {/* Background ambient glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9B59C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#D9CFC7]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#C9B59C] flex items-center justify-center text-white shadow-md border border-[#b5a085]">
            <Radio className="w-5 h-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[#2D2825]">
            Phoenix AI <span className="text-[#C9B59C] font-mono text-sm">v2.5</span>
          </span>
        </div>

        <button
          onClick={onLaunchStudio}
          className="px-5 py-2.5 rounded-xl bg-[#EFE9E3] hover:bg-[#F9F8F6] border border-[#D9CFC7] text-[#2D2825] font-bold text-xs transition-all flex items-center gap-2 shadow-sm hover:border-[#C9B59C]"
        >
          <span>Open Voice Studio</span>
          <ArrowRight className="w-4 h-4 text-[#C9B59C]" />
        </button>
      </header>

      {/* Hero Section */}
      <div className="w-full max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-auto">
        {/* Left Column: GSAP Animated Typography */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div ref={badgeRef} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE9E3] border border-[#D9CFC7] text-[#4A3E35] text-xs font-mono font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#C9B59C] animate-pulse" />
            <span>JARVIS-STYLE WORKSTATION INTELLIGENCE</span>
          </div>

          <h1 ref={titleRef} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#2D2825] leading-[1.15]">
            Next-Gen Real-Time <br />
            <span className="bg-gradient-to-r from-[#C9B59C] via-[#b5a085] to-[#8C7A6B] bg-clip-text text-transparent">
              Voice AI Assistant
            </span>
          </h1>

          <p ref={subtitleRef} className="text-base sm:text-lg text-[#6C625A] max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
            Execute local system commands under <strong className="text-[#2D2825]">50ms</strong> via fast-path REST, stream token speech via SSE, and control hardware telemetry seamlessly.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              onClick={onLaunchStudio}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#C9B59C] hover:bg-[#b5a085] text-white font-extrabold text-sm transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-3 border border-[#b5a085]"
            >
              <Zap className="w-5 h-5 text-amber-100" />
              <span>Launch Voice Studio Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#EFE9E3] hover:bg-[#F9F8F6] border border-[#D9CFC7] text-[#2D2825] font-bold text-sm text-center transition shadow-sm"
            >
              Explore Architecture
            </a>
          </div>
        </div>

        {/* Right Column: Three.js Interactive 3D Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full glass-panel rounded-3xl p-4 border border-[#D9CFC7] shadow-xl relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-[#EFE9E3]/90 border border-[#D9CFC7] text-[10px] font-mono font-bold text-[#4A3E35] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              Interactive Three.js 3D Core
            </div>
            
            <LandingHero3D />

            <div className="text-center pb-2">
              <span className="text-[11px] font-mono text-[#6C625A] font-semibold">
                Drag mouse over 3D sphere for parallax physics
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GSAP Animated Feature Showcase Cards */}
      <section id="features" className="w-full max-w-6xl mx-auto px-6 py-12 z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#2D2825] tracking-tight">
            Engineered For Low Latency & Hardware Control
          </h2>
          <p className="text-xs text-[#6C625A] font-medium mt-1">
            Built with FastAPI backends, Next.js frontend, and WebSockets live listeners.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-[#D9CFC7] space-y-3 glass-panel-hover shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#C9B59C]" />
            </div>
            <h3 className="text-sm font-bold text-[#2D2825]">Fast-Path REST (&lt;50ms)</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              Bypasses heavy LLM reasoning to execute local Windows OS actions instantaneously.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-[#D9CFC7] space-y-3 glass-panel-hover shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-[#C9B59C]" />
            </div>
            <h3 className="text-sm font-bold text-[#2D2825]">Hardware OS Controls</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              Bi-directional sync for screen brightness, master volume, and active processes.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-[#D9CFC7] space-y-3 glass-panel-hover shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#C9B59C]" />
            </div>
            <h3 className="text-sm font-bold text-[#2D2825]">Real-Time Telemetry</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              3-second periodic live hardware polling for CPU, RAM, Disk, and Power usage.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-[#D9CFC7] space-y-3 glass-panel-hover shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-[#C9B59C]" />
            </div>
            <h3 className="text-sm font-bold text-[#2D2825]">Voice Barge-in Interruption</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              Start speaking anytime to immediately stop AI audio playback and launch new commands.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-[#D9CFC7] text-center text-xs text-[#6C625A] font-mono z-20">
        Phoenix AI Agent Platform • Powered by Next.js, Three.js, GSAP & Python FastAPI
      </footer>
    </div>
  );
};
