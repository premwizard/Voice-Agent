# 🎙️ Real-Time AI Voice Agent Studio

A production-ready, full-stack, real-time AI Voice Agent application built with a high-throughput streaming architecture supporting **OpenRouter AI (LLaMA 3.3 70B)**, full-duplex **WebSockets communication**, hands-free **Speech-to-Text (STT)** with automatic silence detection, sentence-level streaming **Text-to-Speech (TTS)** voice synthesis, and a modern glassmorphic web dashboard.

---

## 🌟 Key Features

- ⚡ **Real-Time WebSocket Streaming**: Bi-directional token-by-token streaming communication between client and server.
- 🤖 **OpenRouter AI Integration**: Powered by OpenRouter using `meta-llama/llama-3.3-70b-instruct` (with seamless fallback to Google Gemini).
- 🎙️ **Hands-Free Auto-Send Voice Input**: Uses Web Speech API with built-in 1.2-second silence detection to automatically transmit spoken prompts without clicking "Send".
- 🔊 **Sentence-Level Streaming Voice Synthesis**: Instant audio playback as sentence chunks stream in over WebSockets, minimizing voice latency.
- 🎨 **Modern Next.js 15 UI**: Built with React 19, Tailwind CSS, TypeScript, and dynamic glassmorphic audio equalizer visualizers.
- 🛠️ **Full Documentation & Line-by-Line Comments**: Every backend and frontend file contains top-of-file structural descriptions and inline line-by-line comments.

---

## 🏗️ Architecture Overview

```text
┌───────────────────────────────────────┐                  WebSocket / REST                  ┌───────────────────────────────────────┐
│           Next.js 15 Frontend         │ ◄────────────────────────────────────────────────► │           FastAPI Backend             │
│  • React 19 Client Components         │      ws://localhost:8000/api/v1/ws/stream          │  • Python 3.11+, Uvicorn ASGI Server  │
│  • Web Speech STT (Mic Recognition)   │      http://localhost:8000/api/v1/chat              │  • ConnectionManager Socket Engine    │
│  • Real-Time Sentence TTS Voice       │                                                    │  • LLM Service (OpenRouter Client)    │
└───────────────────────────────────────┘                                                    └───────────────────┬───────────────────┘
                                                                                                                 │
                                                                                                                 ▼
                                                                                                    ┌────────────────────────┐
                                                                                                    │     OpenRouter API     │
                                                                                                    │  LLaMA 3.3 70B Model   │
                                                                                                    └────────────────────────┘
```

---

## 🛠️ Technology Stack

### **Backend Technologies**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI Web Server)
- **WebSockets**: Native FastAPI WebSocket Manager
- **AI SDKs**: `openai` (OpenRouter API compatible client) & `google-genai`
- **Config & Validation**: `pydantic-settings` & `python-dotenv`

### **Frontend Technologies**
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: React 19 & TypeScript
- **Styling**: Tailwind CSS (Glassmorphic Dark Mode Design)
- **Voice Capabilities**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

---

## 📁 Repository Structure

```text
Voice Agent/
├── backend/                        # FastAPI Python backend application
│   ├── config.py                   # Central environment variables & settings validator
│   ├── llm_service.py              # OpenRouter & Gemini AI token streaming service
│   ├── main.py                     # FastAPI application entrypoint & CORS setup
│   ├── router.py                   # REST endpoints (/health, /chat) & WebSocket (/ws/stream)
│   ├── websocket_manager.py        # Connection manager handling active client sockets
│   ├── test_websocket.py           # Terminal async WebSocket testing script
│   ├── .env                        # Local environment keys
│   └── requirements.txt            # Python backend dependencies
│
├── frontend/                       # Next.js 15 TypeScript frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Main Voice Studio dashboard component
│   │   │   └── layout.tsx          # App Router root layout
│   │   ├── components/
│   │   │   └── AudioVisualizer.tsx # Dynamic glowing equalizer wave bars
│   │   ├── hooks/
│   │   │   ├── useSpeech.ts        # STT, streaming TTS, and auto-silence hook
│   │   │   └── useWebSocket.ts     # WebSocket connection hook with retry queue
│   │   └── services/
│   │       └── apiService.ts       # REST client fetch module
│   ├── .env.local                  # Client-side backend URL configurations
│   ├── package.json                # Node.js frontend dependencies
│   └── tailwind.config.ts          # Tailwind CSS styling configuration
│
└── README.md                       # Project documentation
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
pip install -r requirements.txt
```

Configure environment variables inside `backend/.env`:

```env
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
```

Start the FastAPI server:

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
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws/stream
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in **Google Chrome** or **Microsoft Edge**.

---

## 🧪 Testing Backend Endpoints

### **REST API Endpoint (`POST /api/v1/chat`)**

```bash
# Using PowerShell:
Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/chat' -Method Post -ContentType 'application/json' -Body '{"prompt": "What is a voice agent?"}'

# Using CMD / Terminal:
curl -X POST http://localhost:8000/api/v1/chat -H "Content-Type: application/json" -d "{\"prompt\": \"What is a voice agent?\"}"
```

### **WebSocket Streaming Endpoint (`ws://localhost:8000/api/v1/ws/stream`)**

```bash
# Using npx wscat:
npx wscat -c ws://localhost:8000/api/v1/ws/stream

# Using included Python test script:
.\venv\Scripts\python.exe test_websocket.py
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
