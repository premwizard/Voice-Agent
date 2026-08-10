// ==============================================================================
// FILE: src/components/LandingPage.tsx
// WHAT THIS FILE IS: Full-Page Luxury Landing Experience with Framer Motion, GSAP & 3D WebGL.
// WHY IT IS USED: Edge-to-edge responsive layout (no side gaps), featuring 
//                 multiple Three.js WebGL visualizers, Framer Motion entrance animations,
//                 interactive command matrix, and live telemetry previews.
// ==============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { LandingHero3D } from "./LandingHero3D";
import { LandingArchitecture3D } from "./LandingArchitecture3D";
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
  MemoryStick,
  HardDrive,
  CheckCircle2,
  Code,
  Laptop,
  Play,
  Layers,
} from "lucide-react";

interface LandingPageProps {
  onLaunchStudio: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchStudio }) => {
  const [activeCommandTab, setActiveCommandTab] = useState<"system" | "apps" | "telemetry">("system");
  const glowOrbRef = useRef<HTMLDivElement>(null);

  // GSAP continuous background pulse effect
  useEffect(() => {
    if (glowOrbRef.current) {
      gsap.to(glowOrbRef.current, {
        scale: 1.2,
        opacity: 0.25,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };


  return (
    <div className="w-full min-h-screen bg-[#F9F8F6] text-[#2D2825] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#C9B59C]/30">
      {/* GSAP Animated Background ambient radial glow overlays */}
      <div ref={glowOrbRef} className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#C9B59C]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#D9CFC7]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[#EFE9E3]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Full-Width Edge-to-Edge Navigation Bar */}
      <header className="w-full px-6 sm:px-12 lg:px-20 py-5 flex items-center justify-between z-30 border-b border-[#D9CFC7]/60 glass-panel sticky top-0 backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#C9B59C] flex items-center justify-center text-white shadow-md border border-[#b5a085]">
            <Radio className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-[#2D2825]">
              Phoenix AI
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] text-[11px] font-bold tracking-wider font-mono uppercase">
              v2.5 Hybrid Core
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-xs font-bold text-[#6C625A]">
          <a href="#features" className="hover:text-[#2D2825] transition-colors">Features</a>
          <a href="#matrix" className="hover:text-[#2D2825] transition-colors">Command Matrix</a>
          <a href="#architecture" className="hover:text-[#2D2825] transition-colors">3D Architecture</a>
          <a href="#telemetry" className="hover:text-[#2D2825] transition-colors">Telemetry</a>
        </div>

        <button
          onClick={onLaunchStudio}
          className="px-6 py-2.5 rounded-xl bg-[#C9B59C] hover:bg-[#b5a085] text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-md hover:shadow-lg border border-[#b5a085] active:scale-95"
        >
          <span>Launch Voice Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero Stage - Full Edge-to-Edge Container */}
      <section className="w-full px-6 sm:px-12 lg:px-20 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 my-auto">
        {/* Left Column: Framer Motion Animated Typography */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 space-y-6 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFE9E3] border border-[#D9CFC7] text-[#4A3E35] text-xs font-mono font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-[#C9B59C] animate-pulse" />
            <span>JARVIS-INSPIRED PERSONAL ASSISTANT ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#2D2825] leading-[1.1]">
            Next-Gen Real-Time <br />
            <span className="bg-gradient-to-r from-[#C9B59C] via-[#b5a085] to-[#8C7A6B] bg-clip-text text-transparent">
              Voice AI Workstation
            </span>
          </h1>

          <p className="text-base sm:text-xl text-[#6C625A] max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
            Instantaneous local system command execution under <strong className="text-[#2D2825]">50ms</strong> via fast-path REST, progressive speech streaming via SSE, and full bi-directional workstation hardware control.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <button
              onClick={onLaunchStudio}
              className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-[#C9B59C] hover:bg-[#b5a085] text-white font-extrabold text-sm transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-3 border border-[#b5a085]"
            >
              <Zap className="w-5 h-5 text-amber-100" />
              <span>Enter Voice Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4.5 rounded-2xl bg-[#EFE9E3] hover:bg-[#F9F8F6] border border-[#D9CFC7] text-[#2D2825] font-bold text-sm text-center transition shadow-sm hover:border-[#C9B59C]"
            >
              Explore Features
            </a>
          </div>

          {/* Quick Metrics Badge Strip */}
          <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#D9CFC7]/60">
            <div>
              <span className="block text-2xl lg:text-3xl font-extrabold text-[#2D2825] font-mono">&lt;50ms</span>
              <span className="text-xs text-[#6C625A] font-semibold">Fast-Path Latency</span>
            </div>
            <div>
              <span className="block text-2xl lg:text-3xl font-extrabold text-[#2D2825] font-mono">100%</span>
              <span className="text-xs text-[#6C625A] font-semibold">Hardware Control</span>
            </div>
            <div>
              <span className="block text-2xl lg:text-3xl font-extrabold text-[#2D2825] font-mono">SSE+WS</span>
              <span className="text-xs text-[#6C625A] font-semibold">Dual Streaming</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Three.js Interactive 3D WebGL Hero Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="lg:col-span-5 flex flex-col items-center justify-center"
        >
          <div className="w-full glass-panel rounded-3xl p-6 border border-[#D9CFC7] shadow-2xl relative overflow-hidden">
            <div className="absolute top-5 left-5 z-10 px-3.5 py-1.5 rounded-full bg-[#EFE9E3]/95 border border-[#D9CFC7] text-xs font-mono font-bold text-[#4A3E35] flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              Interactive Three.js 3D Core
            </div>
            
            <LandingHero3D />

            <div className="text-center pb-2 pt-2">
              <span className="text-xs font-mono text-[#6C625A] font-bold">
                ✨ Drag mouse over 3D sphere to tilt WebGL camera & satellites
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Live Hardware Telemetry Preview Strip Section */}
      <section id="telemetry" className="w-full px-6 sm:px-12 lg:px-20 py-8 bg-[#EFE9E3]/60 border-y border-[#D9CFC7] z-10">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#C9B59C] animate-ping" />
            <div>
              <h3 className="text-sm font-extrabold text-[#2D2825] tracking-wide uppercase font-mono">
                Live Workstation Telemetry Engine
              </h3>
              <p className="text-xs text-[#6C625A] font-medium">3-second periodic hardware polling</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
            <div className="bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl px-4 py-2.5 text-center shadow-sm">
              <span className="text-[10px] font-bold text-[#6C625A] uppercase font-mono flex items-center justify-center gap-1">
                <Cpu className="w-3 h-3 text-[#4A3E35]" /> CPU Cores
              </span>
              <span className="text-sm font-extrabold text-[#2D2825]">Logical Multi-Core</span>
            </div>

            <div className="bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl px-4 py-2.5 text-center shadow-sm">
              <span className="text-[10px] font-bold text-[#6C625A] uppercase font-mono flex items-center justify-center gap-1">
                <MemoryStick className="w-3 h-3 text-[#4A3E35]" /> RAM Sync
              </span>
              <span className="text-sm font-extrabold text-[#2D2825]">Dynamic Memory</span>
            </div>

            <div className="bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl px-4 py-2.5 text-center shadow-sm">
              <span className="text-[10px] font-bold text-[#6C625A] uppercase font-mono flex items-center justify-center gap-1">
                <HardDrive className="w-3 h-3 text-[#4A3E35]" /> Disk Storage
              </span>
              <span className="text-sm font-extrabold text-[#2D2825]">System Partition</span>
            </div>

            <div className="bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl px-4 py-2.5 text-center shadow-sm">
              <span className="text-[10px] font-bold text-[#6C625A] uppercase font-mono flex items-center justify-center gap-1">
                <Laptop className="w-3 h-3 text-[#4A3E35]" /> OS Control
              </span>
              <span className="text-sm font-extrabold text-[#2D2825]">Windows Native</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Card Feature Deep-Dive Grid */}
      <section id="features" className="w-full px-6 sm:px-12 lg:px-20 py-16 z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-mono font-bold text-[#C9B59C] uppercase tracking-widest">
            Core Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D2825] tracking-tight">
            Engineered For Low Latency & Workstation Automation
          </h2>
          <p className="text-sm text-[#6C625A] font-medium">
            Full-stack integration built with Python FastAPI backends, Next.js App Router, and WebSockets.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-[#D9CFC7] space-y-4 glass-panel-hover shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center glow-gold">
              <Zap className="w-6 h-6 text-[#C9B59C]" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D2825]">Fast-Path REST Execution</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              Bypasses heavy LLM reasoning to execute local Windows OS actions (volume, application opening, brightness) in &lt;50ms.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-[#D9CFC7] space-y-4 glass-panel-hover shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center glow-gold">
              <SlidersHorizontal className="w-6 h-6 text-[#C9B59C]" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D2825]">Bi-Directional OS Controls</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              Debounced hardware synchronization matching your physical laptop keys and OS volume/brightness sliders without fighting.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-[#D9CFC7] space-y-4 glass-panel-hover shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center glow-gold">
              <Activity className="w-6 h-6 text-[#C9B59C]" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D2825]">Real-Time Hardware Telemetry</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              3-second periodic live hardware monitoring for CPU utilization, RAM usage, storage partition status, and battery state.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-[#D9CFC7] space-y-4 glass-panel-hover shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center glow-gold">
              <Volume2 className="w-6 h-6 text-[#C9B59C]" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D2825]">Barge-In Voice Interruption</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              Start speaking at any point during AI voice output to immediately halt speech synthesis and execute your new intent.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-[#D9CFC7] space-y-4 glass-panel-hover shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center glow-gold">
              <Terminal className="w-6 h-6 text-[#C9B59C]" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D2825]">Process Manager Drawer</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              Inspect active Windows processes sorted by CPU and memory usage, with one-click process termination commands.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-[#D9CFC7] space-y-4 glass-panel-hover shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center glow-gold">
              <Layers className="w-6 h-6 text-[#C9B59C]" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D2825]">Multi-LLM Model Router</h3>
            <p className="text-xs text-[#6C625A] font-medium leading-relaxed">
              Seamlessly switch backend reasoning models between Llama 3.3 70B, DeepSeek V3, Claude 3.5 Haiku, and GPT-4o Mini.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive Command Matrix Playground Section */}
      <section id="matrix" className="w-full px-6 sm:px-12 lg:px-20 py-16 bg-[#EFE9E3]/40 border-y border-[#D9CFC7] z-10">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-[#C9B59C] uppercase tracking-widest">
              Natural Language Voice Triggers
            </span>
            <h2 className="text-3xl font-extrabold text-[#2D2825] tracking-tight">
              Interactive Voice & System Command Matrix
            </h2>
            <p className="text-xs text-[#6C625A] font-medium">
              Explore how Phoenix handles natural language queries across system control, app opening, and telemetry.
            </p>
          </div>

          {/* Matrix Tab Buttons */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setActiveCommandTab("system")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                activeCommandTab === "system"
                  ? "bg-[#C9B59C] text-white border-[#b5a085] shadow-md"
                  : "bg-[#F9F8F6] text-[#6C625A] border-[#D9CFC7] hover:text-[#2D2825]"
              }`}
            >
              System Controls
            </button>
            <button
              onClick={() => setActiveCommandTab("apps")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                activeCommandTab === "apps"
                  ? "bg-[#C9B59C] text-white border-[#b5a085] shadow-md"
                  : "bg-[#F9F8F6] text-[#6C625A] border-[#D9CFC7] hover:text-[#2D2825]"
              }`}
            >
              Application Launcher
            </button>
            <button
              onClick={() => setActiveCommandTab("telemetry")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                activeCommandTab === "telemetry"
                  ? "bg-[#C9B59C] text-white border-[#b5a085] shadow-md"
                  : "bg-[#F9F8F6] text-[#6C625A] border-[#D9CFC7] hover:text-[#2D2825]"
              }`}
            >
              Hardware Telemetry
            </button>
          </div>

          {/* Matrix Content Box */}
          <div className="glass-panel p-6 rounded-3xl border border-[#D9CFC7] shadow-xl space-y-4">
            {activeCommandTab === "system" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F9F8F6] border border-[#D9CFC7] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4A3E35]">
                    <span>&quot;Set my volume to 75 percent&quot;</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">FAST PATH (&lt;50ms)</span>
                  </div>
                  <p className="text-xs text-[#6C625A]">Direct PyCAW audio endpoint scalar control.</p>
                </div>

                <div className="bg-[#F9F8F6] border border-[#D9CFC7] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4A3E35]">
                    <span>&quot;Increase screen brightness&quot;</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">FAST PATH (&lt;50ms)</span>
                  </div>
                  <p className="text-xs text-[#6C625A]">WMI Monitor Brightness Methods execution.</p>
                </div>
              </div>
            )}

            {activeCommandTab === "apps" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F9F8F6] border border-[#D9CFC7] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4A3E35]">
                    <span>&quot;Open Antigravity IDE&quot;</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">INDEX RESOLVED</span>
                  </div>
                  <p className="text-xs text-[#6C625A]">Launches `antigravity-ide.cmd` via Windows shell.</p>
                </div>

                <div className="bg-[#F9F8F6] border border-[#D9CFC7] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4A3E35]">
                    <span>&quot;Open my browser&quot;</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">SYNONYM MATCH</span>
                  </div>
                  <p className="text-xs text-[#6C625A]">Resolves synonym to Google Chrome / MS Edge.</p>
                </div>
              </div>
            )}

            {activeCommandTab === "telemetry" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F9F8F6] border border-[#D9CFC7] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4A3E35]">
                    <span>&quot;How much memory am I using?&quot;</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">LIVE METRIC</span>
                  </div>
                  <p className="text-xs text-[#6C625A]">Queries psutil virtual memory metrics.</p>
                </div>

                <div className="bg-[#F9F8F6] border border-[#D9CFC7] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4A3E35]">
                    <span>&quot;Show running processes&quot;</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">PROCESS LIST</span>
                  </div>
                  <p className="text-xs text-[#6C625A]">Sorts top processes by CPU & RAM utilization.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3D Architecture Visualizer Section Stage */}
      <section id="architecture" className="w-full px-6 sm:px-12 lg:px-20 py-16 z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono font-bold text-[#C9B59C] uppercase tracking-widest">
              3D Architecture Visualizer
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D2825] tracking-tight">
              Modular 3-Tier Pipeline Architecture
            </h2>
            <p className="text-sm text-[#6C625A] font-medium leading-relaxed">
              Designed with strict separation of concerns between client speech processing, backend fast-path execution routing, and background WebSocket listeners.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EFE9E3] border border-[#D9CFC7]">
                <CheckCircle2 className="w-5 h-5 text-[#C9B59C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#2D2825]">Fast-Path REST Command Router</h4>
                  <p className="text-xs text-[#6C625A]">Bypasses LLM latency for local OS actions in &lt;50ms.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EFE9E3] border border-[#D9CFC7]">
                <CheckCircle2 className="w-5 h-5 text-[#C9B59C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#2D2825]">Server-Sent Events (SSE) Token Streaming</h4>
                  <p className="text-xs text-[#6C625A]">Streams multi-turn chat responses token-by-token.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EFE9E3] border border-[#D9CFC7]">
                <CheckCircle2 className="w-5 h-5 text-[#C9B59C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#2D2825]">Bi-Directional WebSockets Event Channel</h4>
                  <p className="text-xs text-[#6C625A]">Pushes background hardware alerts & notifications.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="glass-panel p-6 rounded-3xl border border-[#D9CFC7] shadow-2xl relative overflow-hidden">
              <div className="absolute top-5 left-5 z-10 px-3.5 py-1.5 rounded-full bg-[#EFE9E3]/95 border border-[#D9CFC7] text-xs font-mono font-bold text-[#4A3E35] flex items-center gap-2 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9B59C] animate-ping" />
                3D Three.js Matrix Stage
              </div>

              <LandingArchitecture3D />

              <div className="text-center pb-2 pt-2">
                <span className="text-xs font-mono text-[#6C625A] font-bold">
                  ✨ Interactive 3D Wireframe Cube Matrix Visualizer
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Bleed Gold Luxury Launch Call-to-Action Section */}
      <section className="w-full px-6 sm:px-12 lg:px-20 py-16 bg-gradient-to-r from-[#C9B59C] via-[#b5a085] to-[#8C7A6B] text-white z-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-mono font-bold">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>READY TO EXPERIENCE PHOENIX AI?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Transform Your Workstation Experience Today
          </h2>

          <p className="text-sm sm:text-base text-amber-100/90 font-medium max-w-xl mx-auto leading-relaxed">
            Experience real-time voice control, hardware synchronization, fast-path REST execution, and Jarvis-style system intelligence.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={onLaunchStudio}
              className="px-10 py-5 rounded-2xl bg-white text-[#2D2825] hover:bg-[#F9F8F6] font-extrabold text-sm transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              <Zap className="w-5 h-5 text-[#C9B59C]" />
              <span>Launch Voice Studio</span>
              <ArrowRight className="w-4 h-4 text-[#C9B59C]" />
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Edge-to-Edge Footer */}
      <footer className="w-full px-6 sm:px-12 lg:px-20 py-8 border-t border-[#D9CFC7] text-center text-xs text-[#6C625A] font-mono z-20 font-medium bg-[#F9F8F6]">
        Phoenix AI Workstation Platform • Next.js App Router • Three.js 3D WebGL • GSAP Animation Engine
      </footer>
    </div>
  );
};
