# Voice Agent

A production-quality real-time AI Voice Agent.

## Architecture

- **Frontend**: Next.js 15, Tailwind CSS, Zustand, Web Speech API (STT), SpeechSynthesis (TTS).
- **Backend**: FastAPI, Python 3.12, WebSockets, google-genai, groq, openai.

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (or `.\venv\Scripts\activate` on Windows)
4. `pip install -r requirements.txt`
5. Create `.env` file in `backend/` and add your API keys:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_key_here
   GROQ_API_KEY=your_key_here
   OPENROUTER_API_KEY=your_key_here
   ```
6. Run the backend:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Run the frontend:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`

## Providers

You can switch the AI provider by changing `AI_PROVIDER` in `backend/.env` to `gemini`, `groq`, or `openrouter`.

## License
MIT
