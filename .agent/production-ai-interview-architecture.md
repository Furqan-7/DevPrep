# DevPrep AI Interview Platform: Unified Authoritative Architecture

This document specifies the authoritative, unified real-time voice interview architecture for the production AI interview route (`apps/frontend/app/dashboard/ai-interview/`).

---

## 1. Production Architecture Overview

The previous dual-pipeline architecture (where the WebSocket server independently invented interview questions while the backend generated and stored different questions in PostgreSQL) has been replaced with a **single authoritative interview pipeline**.

### Unified End-to-End Architecture

```text
[ Browser Client ]
  │  ▲  Web Audio (Microphone RMS, VAD, 16-bit PCM)
  │  │  PcmStreamPlayer (24kHz Gapless Audio Playback)
  ▼  │  JSON Control Frames (init_session, speech_ended, ai_text_chunk, turn_complete)
[ WebSocket Voice Server :8080 ] (apps/ws-server)
  │  │  - Groq Whisper STT (Audio Buffer -> Text Transcript)
  │  │  - Deepgram Aura-2 Streaming TTS (Text Sentences -> 24kHz Linear16 PCM)
  │  │  - Realtime TextChunker (Streaming Tokens -> Spoken Sentences)
  │  │
  │  ▼  HTTP Loopback Stream (POST /api/interview/turn-stream)
[ Backend Authoritative Engine :3001 ] (apps/backend)
  │  - Single authoritative Gemini Call (Prompt: History + Current Question + Candidate Answer)
  │  - Streaming Output: [SPOKEN] block streamed immediately to ws-server
  │  - Evaluation & Extraction: [METRICS] parsed upon stream end
  │
  ▼  Atomic Prisma Transaction
[ PostgreSQL Database ]
  - InterviewSession (status, currentQues)
  - InterviewQuestion (order, question, answer, score, feedback)
```

---

## 2. Interview State Machine

Both the client and the server follow a deterministic, linear state machine:

```text
       ┌──────────────┐
       │     IDLE     │
       └──────┬───────┘
              │ User clicks "Start interview"
              ▼
       ┌──────────────┐
       │ INITIALIZING │ (Connects WebSocket, requests mic, inits AudioContext)
       └──────┬───────┘
              │ Sends init_session with firstQuestion
              ▼
       ┌──────────────┐
       │ AI_SPEAKING  │ (Zara delivers Question 1 via Deepgram; mic/VAD disabled)
       └──────┬───────┘
              │ Deepgram finishes & audio buffer plays out (cooldown elapsed)
              ▼
┌─────►┌──────────────┐
│      │  LISTENING   │ (Mic active, adaptive noise floor tracking, VAD armed)
│      └──────┬───────┘
│             │ RMS speech energy > threshold
│             ▼
│      ┌──────────────┐
│      │ USER_SPEAKING│ (Audio frames streaming to ws-server; Deepgram pre-warmed)
│      └──────┬───────┘
│             │ 800ms continuous silence detected
│             ▼
│      ┌──────────────┐
│      │  PROCESSING  │ (Speech turn finalized, mic disabled to prevent echo)
│      └──────┬───────┘
│             │ Groq Whisper running
│             ▼
│      ┌──────────────┐
│      │ TRANSCRIBING │ (Candidate transcript emitted to client)
│      └──────┬───────┘
│             │ Empty speech? ──────► [Return to LISTENING] (no AI trigger)
│             │ Valid transcript
│             ▼
│      ┌──────────────┐
│      │  GENERATING  │ (Authoritative Gemini stream running)
│      └──────┬───────┘
│             │ First text chunk emitted
│             ▼
│      ┌──────────────┐
│      │ AI_SPEAKING  │ (Deepgram streaming audio; tokens streaming live to UI)
│      └──────┬───────┘
│             │
│             ├─ If isComplete: true ──► [ DONE / COMPLETE ]
│             │
└─────────────┴─ If continuing ────────► [ LISTENING ] (Next turn)
```

---

## 3. Question Lifecycle

### Question 1 (Deterministic Startup):
1. **Creation**: Selected by the backend from `ROLE_FIRST_QUESTIONS[role]` during `POST /api/interview/generate`.
2. **Storage**: Stored in PostgreSQL `InterviewQuestion` (`order: 1`).
3. **Session Transport**: Returned in JSON to frontend, serialized into `sessionStorage`.
4. **Voice Delivery**: When candidate clicks "Start interview", client passes `firstQuestion` in `init_session` to `ws-server`.
5. **Synthesis**: `ws-server` immediately sends greeting + Question 1 into `DeepgramStreamingTtsSession`.
6. **Playback**: Candidate hears Zara speak Question 1 out loud.
7. **Transition**: When playback completes, VAD transitions to `LISTENING`. Candidate answers Question 1.

### Questions 2+ (Subsequent Turns):
1. **Evaluation & Generation**: Candidate speaks their answer. Backend Authoritative Engine evaluates Candidate Answer against Current Question and generates Next Question within the same streaming turn.
2. **Delivery**: The new question is spoken as the concluding sentence of Zara's response.
3. **Storage**: Next question is saved to PostgreSQL `InterviewQuestion` (`order: currentQues + 1`).
4. **Authoritative State**: `ws-server` and frontend update `currentQuestion = nextQuestion`.
5. **UI Synchronization**: Question bubble and progress tabs update with the new question.
6. **Next Turn Evaluation**: When the candidate speaks again, this exact question is used as the evaluation baseline.

---

## 4. User Speech Lifecycle

1. **Microphone Stream**: Initialized with `echoCancellation: true, noiseSuppression: true, autoGainControl: true`.
2. **RMS Analysis**: `ScriptProcessorNode` / Web Audio node measures RMS energy continuously.
3. **Adaptive Floor**: Dynamically tracks ambient background noise (`noiseFloorRef.current`).
4. **Pre-Roll Rolling Buffer**: Maintains ~500ms of audio history so initial phonemes are never clipped.
5. **Speech Trigger**: When `rms > dynamicThreshold`, state transitions to `speaking`. Pre-roll buffer flushes immediately to `ws-server`.
6. **Silence Countdown**: When speech drops below threshold, `consecutiveSilenceSamples` accumulates toward 800ms.
7. **Turn Finalization**: At 800ms silence, client emits `speech_ended` and locks mic from feedback.

---

## 5. AI Response Lifecycle

1. **Zero-Delay Trigger**: `ws-server` calls backend `POST /api/interview/turn-stream`.
2. **Streaming Delimiters**: Backend instructs Gemini to format output into `[SPOKEN]` ... `[/SPOKEN]` and `[METRICS]`.
3. **Token Stripping**: As tokens arrive, `[SPOKEN]` is stripped. Words stream immediately into `TextChunker`.
4. **Sentence Aggregation**: `TextChunker` batches 2-15 words into natural sentences and passes them to `DeepgramStreamingTtsSession`.
5. **Real-time Synthesis**: Deepgram streams 24kHz PCM audio frames back to `ws-server`, which forwards them as binary WebSocket frames to the browser.
6. **Timeline Scheduling**: Browser `PcmStreamPlayer` queues PCM chunks on the `AudioContext` timeline for gapless speech playback.
7. **Metrics Extraction**: When `[/SPOKEN]` appears, spoken TTS ends. Metrics (`Score`, `NextQuestion`, `IsComplete`) are parsed and persisted in DB.

---

## 6. WebSocket Responsibilities (`apps/ws-server`)

- **Audio Transport**: Accumulates incoming binary PCM/WAV chunks from browser microphone.
- **STT Transport**: Formats audio into complete WAV buffer and transcribes with Groq Whisper.
- **Empty Speech Defense**: Discards silent or noise-only audio turns (`empty_speech`), returning browser safely to `listening`.
- **Pre-warming TTS**: Initializes Deepgram WebSocket session during user speech turn for near-zero TTFA.
- **Authoritative Turn Routing**: Calls backend `/api/interview/turn-stream` and relays live tokens to both UI and Deepgram.
- **Audio Streaming**: Sends binary linear16 PCM audio frames to browser `PcmStreamPlayer`.
- **Question 1 Vocalization**: Synthesizes and delivers Question 1 on `init_session`.

---

## 7. Backend Responsibilities (`apps/backend`)

- **Authoritative Session Authority**: Single owner of `InterviewSession` and `InterviewQuestion` models.
- **Question Pool**: Manages curated question banks (`ROLE_FIRST_QUESTIONS`).
- **Turn Orchestration**: `interview-engine.service.ts` coordinates history retrieval, prompt generation, Gemini streaming, and DB updates.
- **SSE Streaming Endpoint**: Exposes `POST /api/interview/turn-stream` for real-time token delivery to `ws-server`.
- **Race Condition Prevention**: Uses atomic Prisma `upsert` with `sessionId_order` to prevent duplicate question collisions.
- **Model Fallbacks**: Implements automatic multi-model fallback (`gemini-3.1-flash-lite`, `gemini-flash-lite-latest`, `gemini-3.5-flash`) to prevent 503 errors.

---

## 8. Gemini Responsibilities

- **Single Unified Generation**: Evaluates candidate answer, acknowledges candidate naturally, transitions to next question, and scores answer in **one single LLM call**.
- **Structured Output**: Emits spoken conversational text in `[SPOKEN]` and structured evaluation in `[METRICS]`.
- **Context Awareness**: Receives full turn history (`Q1/A1 ... QN/AN`), candidate answer, current question, role, and difficulty.

---

## 9. Deepgram Responsibilities

- **Provider**: Deepgram Aura-2 (`aura-2-thalia-en`).
- **Streaming Audio**: Receives streamed text chunks from `TextChunker` over secure WebSocket.
- **Format**: Produces 24,000 Hz, 1-channel, 16-bit linear PCM audio.
- **Pre-warming**: Connection is established ahead of time to eliminate TLS/handshake latency.

---

## 10. Database Lifecycle

- **Start**: `InterviewSession` created with `currentQues = 1`, `order: 0` (intro), `order: 1` (Question 1).
- **Turn N**:
  - `InterviewQuestion` (`order: N`) updated with `answer`, `score`, and `feedback`.
  - `InterviewQuestion` (`order: N + 1`) upserted with `question: nextQuestion`.
  - `InterviewSession` updated with `currentQues = N + 1`.
- **Completion**: `InterviewSession.status = "completed"`.

---

## 11. Error Handling & Defense Matrix

| Error Scenario | Detection Point | Handling Behavior |
| :--- | :--- | :--- |
| **Empty User Turn / Noise** | Groq Whisper transcript is empty | `ws-server` emits `empty_speech`. Client resets to `listening`. No LLM or TTS triggered. |
| **Gemini 503 / Model Failure** | `streamGeminiContent` catch block | Automatically retries with next model in fallback list (`3.1-flash-lite` -> `flash-lite-latest` -> `3.5-flash`). |
| **Concurrent Turn Race Condition** | `processInterviewTurn` | Prisma `upsert` on compound key `sessionId_order` guarantees duplicate key error cannot occur. |
| **WebSocket Disconnect** | `ws.onclose` / `onerror` | Voice hook sets `wsStatus = "disconnected"` and releases mic/audio resources. |
| **Microphone Permission Denied** | `navigator.mediaDevices.getUserMedia` | Sets explicit error message: "Microphone permission denied. Please allow microphone access to proceed." |
| **Deepgram TTS Failure** | `DeepgramStreamingTtsSession` catch | Logs warning and cleanly closes session without hanging server. |

---

## 12. Module / File Structure

```text
apps/
├── backend/
│   ├── src/
│   │   ├── controllers/interview.controller.ts  (startInterview, streamInterviewTurn, submitAnswer)
│   │   ├── routes/interview.route.ts            (/generate, /turn-stream, /answer, /feedback)
│   │   ├── services/interview-engine.service.ts (Authoritative Interview Engine & DB persistence)
│   │   └── lib/gemini.ts                        (Multi-model streaming Gemini client with fallbacks)
├── ws-server/
│   ├── src/
│   │   ├── index.ts                             (WebSocket server, audio transport, Question 1 TTS)
│   │   ├── services/authoritative-interview.service.ts (Bridge to backend /turn-stream)
│   │   ├── services/llm.service.ts              (Isolated practice sandbox streamer for /practice)
│   │   ├── services/transcription.service.ts    (Groq Whisper STT)
│   │   └── services/tts.service.ts              (Deepgram Aura-2 streaming TTS & TextChunker)
└── frontend/
    ├── app/dashboard/ai-interview/
    │   ├── [role]/session/page.tsx              (Production interview session UI & turn coordination)
    │   └── [role]/page.tsx                      (Role selection & session generation)
    └── hooks/
        └── useRealtimeVoice.ts                  (Web Audio, VAD state machine, AudioContext playback)
```
