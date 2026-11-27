[DevPrep Launch Video.html](https://github.com/user-attachments/files/33755755/DevPrep.Launch.Video.html)# DevPrep

> AI-powered mock interview platform with real-time voice interviews,
> coding challenges, and personalized feedback.

## Demo

DevPrep Demo : 

https://github.com/user-attachments/assets/e849b172-3296-481f-a1bc-5e0ba44fd50e

## Architecture

DevPrep Architecture : 

<img width="1940" height="1162" alt="image" src="https://github.com/user-attachments/assets/7536a851-497e-43cf-8d48-f4a30ce2b51c" />


### How It Works

1. The candidate speaks through the browser.
2. Silero VAD detects the end of the speech.
3. PCM audio is sent to the WebSocket server.
4. Groq Whisper converts speech to text.
5. Gemini generates the AI interviewer's response.
6. Deepgram converts the response into speech.
7. PCM audio is streamed back to the browser.
8. The interview continues in real time.

## Features

- Real-time AI voice interviews
- Context-aware follow-up questions
- Speech-to-text with Groq Whisper
- AI interviewer powered by Gemini
- Streaming TTS with Deepgram
- Browser-side voice activity detection
- Coding interview support
- AI-powered interview feedback
- Interview history and progress tracking

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Real-time | WebSocket, Web Audio API, PCM |
| AI | Groq Whisper, Gemini, Deepgram |
| VAD | Silero VAD, ONNX Runtime |
| Tooling | pnpm, Vercel, Railway |

## Project Structure

```text
apps/
├── frontend/     # Next.js app (landing page, dashboard, interview room)
└── backend/      # Express REST API

packages/
├── database/           # Prisma schema, migrations and client
├── eslint-config/      # Shared ESLint config
└── typescript-config/  # Shared tsconfig presets
```

## Getting Started

```bash
git clone https://github.com/Furqan-7/devprep.git
cd devprep
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm dev
```

Environment variables:

```text
DATABASE_URL=
JWT_TOKEN=
GROQ_API_KEY=
GEMINI_API_KEY=
DEEPGRAM_API_KEY=
NEXT_PUBLIC_API_URL=
```
