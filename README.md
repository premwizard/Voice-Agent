# 🎙️ Phoenix AI Personal Assistant & Voice Studio

A production-ready, full-stack, real-time AI Voice Assistant and Computer Control System built with a high-performance hybrid streaming architecture (REST, SSE, WebSockets), powered by **OpenRouter AI (LLaMA 3.3 70B / Google Gemini)**, **FastAPI**, **Next.js 16**, **React 19**, and a glassmorphic Web Audio Studio.

Phoenix integrates hands-free Speech-to-Text (STT), sentence-level & Neural Edge-TTS voice synthesis, computer automation, persistent SQLite memory, computer vision screenshot analysis, browser search, and live system hardware telemetry.

---

## 🌟 Key Features

- ⚡ **Hybrid Multi-Channel Streaming Architecture**:
  - **Fast-Path REST Command Router (`/api/v1/commands`)**: Executes local system actions (launching apps, volume/brightness control, process management, stats) in `<50ms` without waiting for LLM network latency.
  - **Server-Sent Events (SSE) Streaming (`/api/v1/chat/stream`)**: Progressive token-by-token text response streaming for low latency.
  - **Real-Time WebSockets (`/api/v1/ws/events`)**: Bi-directional streaming for live task progress, notifications, and interactive chat.
  - **Neural Edge-TTS API (`/api/v1/voice/tts`)**: Low-latency MP3 neural audio voice streaming.

- 🤖 **Advanced AI & Tool Calling Engine**:
  - Powered by OpenRouter using models like `meta-llama/llama-3.3-70b-instruct` (with seamless Google Gemini fallback).
  - Dynamic tool registry (`backend/tools/tool_registry.py`) enabling the AI to invoke function calls autonomously.

- 💻 **Computer Control & Application Automation**:
  - **App Discovery Scanner (`backend/tools/applications/discovery.py`)**: Automatically indexes installed applications across Windows Registry, Start Menu, and System directories.
  - **Fuzzy Name Resolver (`resolver.py`)**: Smart alias matching (e.g., "code" -> VS Code, "chrome" -> Google Chrome).
  - **Workstation Control (`system_control.py`)**: System volume adjust, display brightness control, workstation lock, sleep, shutdown, and process termination.

- 🧠 **Persistent SQLite Long-Term Memory**:
  - Database-backed memory storage (`phoenix_memory.db`) managed via `memory_manager.py`.
  - Save, query, edit, and delete user facts, coding styles, reminders, and daily context with category tagging.

- 👁️ **Vision & Multimodal Analysis**:
  - Screen capture, OCR text extraction, UI element inspection, and visual document analysis (`backend/tools/vision.py`).

- 🌐 **Browser Automation & Web Intelligence**:
  - Web search query execution, webpage scraping, and document text summarization (`backend/tools/browser_automation.py`).

- 📊 **Live System Telemetry Monitoring**:
  - Real-time CPU, RAM memory, Disk usage, and system uptime monitoring displayed visually in the UI (`TelemetryWidget.tsx`).

- 🎙️ **Interactive Voice Studio & Visualizers**:
  - **Hands-Free STT**: Web Speech API with built-in 1.2-second silence detection and barge-in speech interruption.
  - **3D Canvas Audio Orb (`CanvasAudioOrb.tsx`)**: Interactive Web Audio API `AnalyserNode` frequency orb visualizer.
  - **Audio Equalizer (`AudioVisualizer.tsx`)**: Dynamic glowing frequency wave bars.

- 🔒 **Security & Safe Execution**:
  - Integrated permission scoping framework (`backend/core/permissions.py`) requiring user confirmation modals for high-risk commands (e.g., shutdown, process kill, batch deletion).

- 🧪 **Comprehensive Automated Test Suite**:
  - Full Pytest test coverage across all tools, application discovery, command routing, vision, permissions, and memory modules.

---

## 🏗️ Architecture Overview

```text
┌───────────────────────────────────────┐                                          ┌───────────────────────────────────────┐
│          Next.js 16 Frontend          │                                          │           FastAPI Backend             │
│  • React 19 Glassmorphic Dashboard    │  ── REST Commands (<50ms) ─────────────► │  • Uvicorn ASGI Server (Port 8000)    │
│  • 3D Canvas Audio Orb & Equalizer    │  ── SSE Token Stream (/chat/stream) ───► │  • Fast Command Router Engine         │
│  • Speech-to-Text & Edge Neural TTS   │  ── WebSockets Stream (/ws/events) ────► │  • Tool Registry & Function Engine    │
│  • Computer Control & System Gauges   │                                          │  • SQLite Memory Engine & Telemetry   │
└───────────────────────────────────────┘                                          └───────────────────┬───────────────────┘
                                                                                                       │
                                                                       ┌───────────────────────────────┼───────────────────────────────┐
                                                                       ▼                               ▼                               ▼
                                                          ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
                                                          │     OpenRouter API     │      │   App Discovery & OS   │      │   SQLite Memory DB     │
                                                          │  LLaMA 3.3 70B Model   │      │   System Automation    │      │  (phoenix_memory.db)   │
                                                          └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

---

## 🛠️ Technology Stack

### **Backend Technologies**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI Web Server)
- **AI SDKs**: `openai` (OpenRouter API compatible client) & `google-genai`
- **Voice Synthesis**: `edge-tts` (Microsoft Edge Neural Voice Streaming)
- **Database**: SQLite3 (`phoenix_memory.db`)
- **System & Automation**: `psutil`, `screen-brightness-control`, `pycaw` (Windows audio control), `Pillow`, `pytesseract`
- **Testing**: `pytest`, `pytest-asyncio`

### **Frontend Technologies**
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: React 19 & TypeScript
- **Styling**: Tailwind CSS v4 (Glassmorphic Dark Mode Design)
- **Animations & Icons**: Framer Motion & Lucide React
- **Audio & Speech**: Web Audio API (`AnalyserNode`) & Web Speech API (`SpeechRecognition`)

---

## 📁 Repository Structure

```text
Voice Agent/
├── .agents/                        # Agent specifications & Phoenix master skill blueprint
├── backend/                        # FastAPI Python backend application
│   ├── ai/                         # LLM Tool calling & function execution dispatcher
│   │   ├── __init__.py
│   │   └── tool_calling.py         # Function schema builder & LLM tool response handler
│   ├── core/                       # Core system routing, permissions & telemetry latency
│   │   ├── command_router.py       # Fast-path intent classifier (<50ms local execution)
│   │   ├── context.py              # Conversation context window manager
│   │   ├── latency.py              # Request performance & latency tracker
│   │   ├── logging_service.py      # Structured JSON logging service
│   │   └── permissions.py          # Command security & user confirmation permissions
│   ├── memory/                     # Persistent memory management
│   │   ├── memory_manager.py       # SQLite database store (Search, Insert, Edit, Delete)
│   │   └── phoenix_memory.db       # Persistent SQLite database file
│   ├── tools/                      # System integration & hardware automation tools
│   │   ├── applications/           # Smart application discovery engine
│   │   │   ├── discovery.py        # System registry & Start Menu application indexer
│   │   │   ├── launcher.py         # Subprocess launcher & process manager
│   │   │   └── resolver.py         # Fuzzy application name resolver & alias matcher
│   │   ├── browser_automation.py   # Web search & webpage scraping/summarizer
│   │   ├── system_control.py       # Volume, brightness, power state & hardware telemetry
│   │   ├── tool_registry.py        # Master tool registry & executor
│   │   └── vision.py               # Screenshot capture, OCR & visual analysis
│   ├── tests/                      # Automated Pytest test suite
│   │   ├── test_application_discovery.py
│   │   ├── test_application_resolver.py
│   │   ├── test_browser_automation.py
│   │   ├── test_command_router.py
│   │   ├── test_memory.py
│   │   ├── test_permissions.py
│   │   ├── test_system_control.py
│   │   ├── test_tool_calling.py
│   │   └── test_vision.py
│   ├── config.py                   # Central environment settings & validator
│   ├── llm_service.py              # OpenRouter & Gemini AI streaming client
│   ├── main.py                     # FastAPI application entrypoint & middleware setup
│   ├── router.py                   # REST endpoints (/commands, /voice/tts), SSE & WebSockets
│   ├── tts_service.py              # Edge-TTS voice generation module
│   ├── websocket_manager.py        # Connection manager handling WebSocket clients
│   ├── test_websocket.py           # CLI WebSocket testing script
│   └── .env.example                # Backend environment template
│
├── frontend/                       # Next.js 16 TypeScript frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Phoenix Voice Studio dashboard component
│   │   │   ├── layout.tsx          # Root layout & Google Inter font loader
│   │   │   └── globals.css         # Tailwind CSS & glassmorphism utilities
│   │   ├── components/
│   │   │   ├── AudioVisualizer.tsx  # Wave bar equalizer visualizer component
│   │   │   ├── CanvasAudioOrb.tsx  # Interactive 3D Canvas audio orb visualizer
│   │   │   ├── ComputerControlPanel.tsx # System controls (Volume, Brightness, Apps, Power)
│   │   │   ├── ConversationHistory.tsx  # Interactive chat history with barge-in support
│   │   │   ├── QuickPrompts.tsx    # One-click command shortcut chips
│   │   │   └── TelemetryWidget.tsx # Hardware gauge visualizer (CPU, RAM, Disk)
│   │   ├── hooks/
│   │   │   ├── useSpeech.ts        # STT, streaming TTS, auto-listen & silence detector
│   │   │   └── useWebSocket.ts     # Reconnecting WebSocket stream management hook
│   │   └── services/
│   │       ├── apiService.ts       # REST client for commands & TTS audio fetcher
│   │       └── communicationManager.ts # SSE & WebSocket event manager
│   ├── .env.local                  # Client-side backend URL configurations
│   ├── package.json                # Frontend Node.js dependencies
│   └── tailwind.config.ts          # Custom color palette & Tailwind extensions
│
└── README.md                       # Main project documentation
```

---

## ⚡ Step-by-Step Build & Setup Guide

### **Prerequisites**
- **Python**: v3.11 or higher
- **Node.js**: v18.0.0 or higher
- **Browser**: Google Chrome or Microsoft Edge (for Web Speech API support)

---

### **1. Backend Setup**

Navigate to the `backend/` directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
# On Windows PowerShell:
python -m venv venv
.\venv\Scripts\activate

# On Linux/macOS:
python3 -m venv venv
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install fastapi uvicorn pydantic-settings python-dotenv openai google-genai psutil screen-brightness-control edge-tts pytest pytest-asyncio pillow pytesseract
```

Configure environment variables inside `backend/.env` (refer to `.env.example`):

```env
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

Start the FastAPI backend server:

```bash
uvicorn main:app --reload --port 8000
```

---

### **2. Frontend Setup**

Navigate to the `frontend/` directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Ensure environment configuration inside `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws/events
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in **Google Chrome** or **Microsoft Edge**.

---

## 🔌 API Endpoints Summary

| Endpoint | Protocol | Description |
| :--- | :--- | :--- |
| `GET /api/v1/health` | REST (GET) | Server health check & active AI provider status |
| `GET /api/v1/system/telemetry` | REST (GET) | Detailed CPU, RAM, Disk & uptime hardware metrics |
| `POST /api/v1/commands` | REST (POST) | Fast-path system command execution (`<50ms` latency) |
| `POST /api/v1/system/action` | REST (POST) | Direct system action executor with permission check |
| `POST /api/v1/voice/tts` | REST (POST) | Neural Edge-TTS MP3 audio generation endpoint |
| `POST /api/v1/chat/stream` | SSE (POST) | Server-Sent Events progressive token-by-token streaming |
| `WS /api/v1/ws/events` | WebSocket | Real-time bi-directional events, chat stream & notifications |

---

## 🧪 Automated Testing Guide

Run the full Pytest automated test suite for the backend:

```bash
# Navigate to backend directory with virtual environment activated
cd backend

# Run all backend unit & integration tests
pytest
```

To run a specific component test:

```bash
pytest tests/test_application_discovery.py
pytest tests/test_command_router.py
pytest tests/test_system_control.py
pytest tests/test_memory.py
```

Test the WebSocket connection via CLI:

```bash
python test_websocket.py
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

