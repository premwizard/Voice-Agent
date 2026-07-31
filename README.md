# 🎙️ Voice Agent

A production-ready, real-time AI Voice Agent built with high-throughput streaming architecture supporting multiple LLM providers, full-duplex WebSocket communication, and responsive modern web UI.

---

## 🌟 Key Features

- ⚡ **Real-Time Streaming Speech & AI**: Ultra-low latency voice processing using WebSockets.
- 🔀 **Multi-Provider AI Support**: Seamlessly switch between **Gemini**, **Groq**, and **OpenRouter** models.
- 🎨 **Modern Next.js Frontend**: Next.js 15 App Router UI with Zustand state management and Tailwind CSS styling.
- 🛠️ **Background Workers & Metrics**: Celery integration for async tasks, Prometheus metrics, and Grafana monitoring stacks.
- 🐳 **Docker & Production Ready**: Docker Compose configurations for instant dev and production deployment.

---

## 🏗️ Architecture Overview

```text
┌────────────────────────────────┐       WebSocket / HTTP       ┌────────────────────────────────┐
│      Next.js 15 Frontend       │ ◄──────────────────────────► │       FastAPI Backend          │
│   (Web Speech STT / TTS)       │                              │  (Python 3.12, Async WebSockets)│
└────────────────────────────────┘                              └───────────────┬────────────────┘
                                                                                │
                                           ┌────────────────────────────────────┼────────────────────────────────────┐
                                           ▼                                    ▼                                    ▼
                                  ┌────────────────┐                   ┌────────────────┐                   ┌────────────────┐
                                  │   Google AI    │                   │   Groq Cloud   │                   │   OpenRouter   │
                                  └────────────────┘                   └────────────────┘                   └────────────────┘
```

---

## 📁 Repository Structure

```text
Voice Agent/
├── backend/                  # FastAPI Python backend application
├── frontend/                 # Next.js 15 TypeScript frontend application
├── infrastructure/           # Monitoring configurations (Prometheus, Grafana)
├── scripts/                  # Utilities and load testing scripts
├── docker-compose.yml        # Development Docker setup
├── docker-compose.prod.yml   # Production Docker setup with Postgres/Redis/Celery
└── Makefile                  # Command-line automation tasks
```

---

## ⚡ Quick Start Guide

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: v3.12 or higher
- **Docker & Docker Compose** *(Optional, for containerized run)*

---

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env # or create backend/.env manually
```

Add your environment variables and API keys:

```env
AI_PROVIDER=gemini       # Options: gemini | groq | openrouter
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

---

### 2. Manual Local Setup

#### Backend Setup

```bash
cd backend
python -m venv venv
# On Linux/macOS:
source venv/bin/activate
# On Windows PowerShell:
.\venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 3. Running with Docker Compose

#### Development Mode

```bash
make docker-up
```

#### Production Mode (with Redis, Postgres & Grafana)

```bash
make docker-prod-up
```

---

## 🛠️ Makefile Commands

| Command | Description |
| :--- | :--- |
| `make setup` | Install all backend and frontend dependencies |
| `make dev-backend` | Launch FastAPI backend with live reload (Port 8000) |
| `make dev-frontend` | Launch Next.js dev server (Port 3000) |
| `make worker` | Run Celery background worker |
| `make lint` | Run ESLint and code checks |
| `make docker-up` | Spin up development containers |
| `make docker-prod-up`| Spin up production containers (Redis, Postgres, Celery, Monitoring) |
| `make load-test` | Run WebSocket load test script |
| `make clean` | Clean build artifacts and cached files |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

