---
name: phoenix_assistant
description: Master architectural blueprint and feature guide for Phoenix AI Personal Assistant (Jarvis-style system).
---

# Phoenix AI Personal Assistant - Master Specification & Skill Guide

Phoenix is a Jarvis-style voice & text personal AI assistant built with real-time WebSockets, Web Audio API frequency visualizer, multi-provider LLM streaming (OpenRouter / Gemini / Llama), computer control, long-term memory, file management, developer assistance, and local automation capabilities.

---

## 🎯 26-Module Master Feature Matrix

### 1. Core AI
- **Natural & Voice & Text Conversation**: Real-time bi-directional streaming over WebSockets.
- **Wake Word ("Phoenix")**: Local speech trigger detection.
- **Interruption & Context-Aware Multi-Turn**: Barge-in speech handling and full conversation context memory.
- **Multi-Model Routing**: Llama 3.3 70B, DeepSeek V3, Claude 3.5 Haiku, GPT-4o Mini with automatic/manual switching.
- **Persona & Emotion Customization**: Adjustable system prompts (Natural Assistant, Tech Expert, Quick & Crisp, Warm Companion).

### 2. Voice System
- Wake word detection ("Phoenix")
- Speech-to-Text (STT) & Text-to-Speech (TTS) streaming
- Web Audio API AnalyserNode frequency volume visualization
- Push-to-talk & Hands-free auto-listen modes
- Interruptible speech synthesis playback

### 3. Memory Engine
- **Short-Term Memory**: Active conversation session history & active task context.
- **Long-Term Memory**: Persistent SQLite/JSON storage (`phoenix_memory.db`) for user preferences, coding style, daily schedule, and facts.
- **Smart Memory Tools**: Search, edit, timeline, and delete memories via voice or text.

### 4. Computer Control
- Application launcher & process manager (open/close/restart local apps).
- System volume & brightness control.
- Workstation state management (Lock PC, Sleep, Shutdown, Restart confirmation).
- Live telemetry monitoring (CPU, RAM, Disk, Network uptime).

### 5. File Management
- File & folder operations (create, delete, rename, move, copy, compress ZIP, extract).
- Download directory auto-organizer & duplicate file finder.
- Fast local filename & content search.

### 6. Browser Automation
- Web browsing, web search (Google / Bing / DuckDuckGo).
- Webpage text reader, summarizer, and form fill capabilities.

### 7. Vision & Multimodal
- Screenshot capture & visual analysis.
- Image text extraction (OCR), UI element detection, PDF document reading.

### 8. Developer Assistant
- Code generation, explanation, debugging, refactoring, unit test generation.
- Git workflow assistant (commit messages, pull request summaries).
- Terminal & command execution assistant.

### 9. Learning Assistant
- Concept explainer, quiz generator, flashcard manager, research summarizer.

### 10. Productivity Suite
- To-do list, Reminders, Calendar integration, Pomodoro focus timer, Habit tracker.

### 11. Dashboard & System Telemetry
- Live glassmorphic system status UI: CPU/RAM/Disk metrics, active tasks, memory browser, plugin status.

### 12. Communication
- Email drafting, email summarization, notifications.

### 13. Entertainment
- Music playback controls, YouTube search, news summaries.

### 14. Search Intelligence
- Unified multi-domain search (files, code, memories, documentation, web).

### 15. Automation Workflows
- Scheduled timers, daily routines, folder watch notifications, automated backups.

### 16. Plugin System
- Modular plugin architecture (VS Code, GitHub, Spotify, Discord, Notion).

### 17. Multi-Agent Orchestration
- Specialized sub-agents: Coding Agent, Research Agent, Vision Agent, Memory Agent, Planner Agent.

### 18. Internet Intelligence
- Live weather, tech news, documentation lookup, package search.

### 19. Project Management
- Project tracking, task boards, deadlines, version history.

### 20. Data Analysis
- CSV/Excel file parsing, charts, SQL queries, report generation.

### 21. Security & Permissions
- Local authentication, safe command confirmation, audit logging, permission scoping.

### 22. Settings & Customization
- Theme customization, hotkey bindings, accessibility, memory controls.

### 23. Cross-Platform
- Windows, macOS, Linux desktop agent & Web Dashboard.

### 24. API & Protocol Integrations
- REST API, WebSocket API, MCP (Model Context Protocol).

### 25. Smart Home (Optional)
- Local device hooks (MQTT, ESP32, Smart plugs).

### 26. Advanced Orchestration & RAG
- Tool calling dispatch, RAG document retrieval, context compression.

---

## 🚀 Execution Roadmap (Phases)

1. **Phase 1**: Identity, Branding ("Phoenix"), Wake Word, & Core Tool Framework
2. **Phase 2**: Computer Control & System Monitoring (Apps, Volume, Brightness, Telemetry)
3. **Phase 3**: File Management & Local Search Engine
4. **Phase 4**: Long-Term Memory Engine (SQLite/JSON Memory Store)
5. **Phase 5**: Browser Automation & Vision Tools
6. **Phase 6**: Developer Suite, Productivity & System Dashboard
