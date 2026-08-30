// ==============================================================================
// FILE: src/config/constants.ts
// WHAT THIS FILE IS: Shared Frontend Constants & Configurations.
// WHY IT IS USED: Consolidates AI models, assistant personalities, studio tab definitions,
//                 and environment configuration defaults into a single source of truth.
// ==============================================================================

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/api/v1/ws/events";

export interface AIModel {
  id: string;
  name: string;
}

export const AI_MODELS: AIModel[] = [
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
];

export interface Personality {
  id: string;
  name: string;
  prompt: string;
}

export const PERSONALITIES: Personality[] = [
  {
    id: "default",
    name: "🎙️ Natural",
    prompt: "Your name is Phoenix. You are a real-time, highly intelligent AI personal assistant inspired by Jarvis with system control capabilities.",
  },
  {
    id: "concise",
    name: "⚡ Quick & Crisp",
    prompt: "Your name is Phoenix, a rapid Jarvis-style voice assistant. Answer in 1-2 ultra-short sentences max.",
  },
];

export type ActiveTab = "studio" | "telemetry" | "control";
