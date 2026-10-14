import { useEffect, useRef, useState, useCallback } from "react";
import type { MicVAD } from "@ricky0123/vad-web";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export interface TtsMetrics {
  timeToFirstAudioMs?: number;
  totalTtsLatencyMs?: number;
  totalBytes?: number;
  audioDurationSec?: number;
  sampleRate?: number;
  model?: string;
  groqLatencyMs?: number;
  firstTokenLatencyMs?: number;
  firstTextToDeepgramLatencyMs?: number;
  userStopToFirstAudioMs?: number;
  totalTurnDurationMs?: number;
}

export type VadState =
  | "idle"              // Not started yet
  | "listening"         // Continuous mic monitoring, waiting for candidate speech
  | "speaking"          // Candidate is speaking (VAD active, streaming audio)
  | "silence_detecting" // Candidate paused, countdown toward ~800ms silence
  | "processing"        // Groq STT and Authoritative Gemini processing
  | "ai_speaking";      // Deepgram Aura-2 TTS playing

export interface TurnData {
  turnNumber: number;
  nextQuestion?: string | null;
  questionNum?: number;
  totalQuestions?: number;
  score?: number;
  isComplete?: boolean;
}

export interface StartInterviewConfig {
  sessionId?: number;
  token?: string;
  role?: string;
  difficulty?: string;
  firstQuestion?: string;
}

export interface UseRealtimeVoiceOptions {
  wsUrl?: string;
  silenceThresholdMs?: number;
  minSpeechDurationMs?: number;
  preRollMs?: number;
  speechThreshold?: number;
  onTranscript?: (text: string) => void;
  onAiChunk?: (chunk: string) => void;
  onAiEnd?: (result: { fullText: string; firstTokenLatencyMs?: number; totalLatencyMs?: number; model?: string }) => void;
  onTtsStart?: (data: unknown) => void;
  onTtsEnd?: (data: TtsMetrics) => void;
  onError?: (error: string) => void;
  onSpeechStarted?: () => void;
  onSpeechEnded?: () => void;
  onProcessingStarted?: () => void;
  onTurnComplete?: (data: TurnData) => void;
}

/**
 * High-performance browser Web Audio API stream player for raw PCM 16-bit audio chunks.
 * Seamlessly schedules incoming audio chunks on the AudioContext timeline for gapless playback.
 */
class PcmStreamPlayer {
  private audioCtx: AudioContext | null = null;
  private sampleRate: number = 24000;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private pendingBuffers: AudioBuffer[] = [];
  private pendingDuration = 0;
  private isPrimed = false;
  private readonly initialBufferSeconds = 0.12;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  public init(sampleRate?: number) {
    if (sampleRate) this.sampleRate = sampleRate;
    if (typeof window === "undefined") return;

    try {
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtxClass({ sampleRate: this.sampleRate });
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
    } catch (err) {
      console.error("[PcmStreamPlayer] Failed to initialize AudioContext:", err);
    }
  }

  public resetTurnTimeline() {
    this.pendingBuffers = [];
    this.pendingDuration = 0;
    this.isPrimed = false;
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.nextStartTime = this.audioCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }
  }

  public feed(arrayBuffer: ArrayBuffer) {
    if (typeof window === "undefined") return;
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      this.init(this.sampleRate);
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    if (!this.audioCtx) return;

    const int16 = new Int16Array(arrayBuffer);
    if (int16.length === 0) return;

    // Convert 16-bit PCM (signed int16) to normalized Float32 (-1.0 to 1.0)
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = (int16[i] ?? 0) / 32768.0;
    }

    const audioBuffer = this.audioCtx.createBuffer(1, float32.length, this.sampleRate);
    audioBuffer.copyToChannel(float32, 0);
    this.pendingBuffers.push(audioBuffer);
    this.pendingDuration += audioBuffer.duration;

    this.schedulePendingBuffers();
  }

  public flush() {
    this.schedulePendingBuffers(true);
  }

  private schedulePendingBuffers(force = false) {
    if (!this.audioCtx || this.audioCtx.state === "closed") return;
    if (!force && !this.isPrimed && this.pendingDuration < this.initialBufferSeconds) return;

    this.isPrimed = true;
    const currentTime = this.audioCtx.currentTime;
    let startTime = Math.max(currentTime, this.nextStartTime);

    while (this.pendingBuffers.length > 0) {
      const audioBuffer = this.pendingBuffers.shift();
      if (!audioBuffer) continue;
      this.pendingDuration -= audioBuffer.duration;

      const scheduledSource = this.audioCtx.createBufferSource();
      scheduledSource.buffer = audioBuffer;
      scheduledSource.connect(this.audioCtx.destination);
      scheduledSource.onended = () => {
        const idx = this.activeSources.indexOf(scheduledSource);
        if (idx !== -1) this.activeSources.splice(idx, 1);
      };
      this.activeSources.push(scheduledSource);
      scheduledSource.start(startTime);
      startTime += audioBuffer.duration;
      this.nextStartTime = startTime;
    }
  }

  public getRemainingPlayTime(): number {
    if (!this.audioCtx || this.audioCtx.state === "closed") return 0;
    return Math.max(0, this.nextStartTime - this.audioCtx.currentTime);
  }

  public stop() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.activeSources = [];
    this.pendingBuffers = [];
    this.pendingDuration = 0;
    this.isPrimed = false;

    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch {
        /* ignore */
      }
      this.audioCtx = null;
    }
    this.nextStartTime = 0;
  }
}

/**
 * Fast helper to convert Float32Array audio buffer [-1.0, 1.0] to Int16Array PCM bytes.
 */
function float32ToInt16Pcm(float32: Float32Array): ArrayBuffer {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i] ?? 0));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16.buffer;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const {
    wsUrl = WS_URL,
    silenceThresholdMs = 1200,
    minSpeechDurationMs = 300,
    preRollMs = 300,
    speechThreshold = 0.5,
  } = options;

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Public state
  const [vadState, setVadState] = useState<VadState>("idle");
  const [speechEnergy, setSpeechEnergy] = useState<number>(0);
  const [silenceProgress, setSilenceProgress] = useState<number>(0);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [firstTokenLatencyMs, setFirstTokenLatencyMs] = useState<number | null>(null);
  const [totalAiLatencyMs, setTotalAiLatencyMs] = useState<number | null>(null);
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const [ttsMetrics, setTtsMetrics] = useState<TtsMetrics | null>(null);
  const [ttsAudioBytes, setTtsAudioBytes] = useState<number>(0);
  const [chunksSent, setChunksSent] = useState<number>(0);
  const [bytesSent, setBytesSent] = useState<number>(0);
  const [mimeTypeUsed, setMimeTypeUsed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnectingPromiseRef = useRef<Promise<WebSocket> | null>(null);
  const isStartingInterviewRef = useRef<boolean>(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const vadRef = useRef<MicVAD | null>(null);
  const pcmPlayerRef = useRef<PcmStreamPlayer | null>(null);
  const sampleRateRef = useRef<number>(16000);

  // VAD state trackers
  const vadStateRef = useRef<VadState>("idle");
  const candidateSpeakingRef = useRef<boolean>(false);
  const turnRef = useRef({
    preRoll: [] as Float32Array[],
    preRollMs: 0,
    seg: [] as Float32Array[],
    speechMs: 0,
    silenceMs: 0,
    turnMs: 0,
    startCount: 0,
  });
  const transcriptRef = useRef<string | null>(null);
  const aiResponseRef = useRef<string>("");
  const aiResponseWordsRef = useRef<string[]>([]);
  const revealedAiWordsRef = useRef(0);
  const aiRevealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTurnDataRef = useRef<TurnData | null>(null);

  const isInterviewActive = vadState !== "idle";
  const isRecording = vadState === "speaking" || vadState === "silence_detecting";

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  const cleanupMicrophone = useCallback(() => {
    if (aiRevealTimerRef.current) {
      clearInterval(aiRevealTimerRef.current);
      aiRevealTimerRef.current = null;
    }
    if (vadRef.current) {
      try {
        void vadRef.current.destroy();
      } catch {
        /* ignore */
      }
      vadRef.current = null;
    }
    candidateSpeakingRef.current = false;
    turnRef.current.preRoll = [];
    turnRef.current.preRollMs = 0;
    turnRef.current.seg = [];
    turnRef.current.speechMs = 0;
    turnRef.current.silenceMs = 0;
    turnRef.current.turnMs = 0;
    turnRef.current.startCount = 0;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.stop();
    }
    vadStateRef.current = "idle";
    setVadState("idle");
    setSpeechEnergy(0);
    setSilenceProgress(0);
  }, []);

  // Unmount cleanup: guarantees no orphan WebSockets, media streams, or AudioContexts leak
  useEffect(() => {
    return () => {
      cleanupMicrophone();
      if (wsRef.current) {
        try {
          wsRef.current.onopen = null;
          wsRef.current.onmessage = null;
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.close();
        } catch {
          /* ignore */
        }
        wsRef.current = null;
      }
      wsConnectingPromiseRef.current = null;
      if (pcmPlayerRef.current) {
        pcmPlayerRef.current.stop();
        pcmPlayerRef.current = null;
      }
    };
  }, [cleanupMicrophone]);

  const connectWebSocket = useCallback((): Promise<WebSocket> => {
    // 1. If existing WebSocket is already OPEN, reuse it
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return Promise.resolve(wsRef.current);
    }

    // 2. If already CONNECTING, reuse the in-flight connection promise
    if (wsConnectingPromiseRef.current && wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      return wsConnectingPromiseRef.current;
    }

    // 3. Clean up any previous socket if in closing/closed state
    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    }

    setWsStatus("connecting");
    const connPromise = new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[useRealtimeVoice] Single WebSocket connected successfully");
        setWsStatus("connected");
        wsConnectingPromiseRef.current = null;
        resolve(ws);
      };

      ws.onmessage = (event) => {
        // 1. Binary audio frame from server
        if (event.data instanceof ArrayBuffer) {
          const buf = event.data;
          if (!pcmPlayerRef.current) {
            pcmPlayerRef.current = new PcmStreamPlayer(24000);
            pcmPlayerRef.current.init(24000);
          }
          pcmPlayerRef.current.feed(buf);
          setTtsAudioBytes((prev) => prev + buf.byteLength);
          return;
        }

        // 2. JSON control & text messages
        try {
          const data = JSON.parse(event.data.toString());

          if (data.type === "speech_started") {
            transcriptRef.current = null;
            setTranscript(null);
            optionsRef.current.onSpeechStarted?.();
          } else if (data.type === "processing_started") {
            vadStateRef.current = "processing";
            setVadState("processing");
            setIsTranscribing(true);
            optionsRef.current.onProcessingStarted?.();
          } else if (data.type === "transcript") {
            transcriptRef.current = data.text;
            setTranscript(data.text);
            setIsTranscribing(false);
            aiResponseRef.current = "";
            setAiResponse("");
            setIsAiResponding(true);
            optionsRef.current.onTranscript?.(data.text);
          } else if (data.type === "ai_text_chunk") {
            const nextChunk = String(data.text || "").trim();
            if (nextChunk) {
              aiResponseRef.current = aiResponseRef.current
                ? `${aiResponseRef.current} ${nextChunk}`
                : nextChunk;
              aiResponseWordsRef.current = aiResponseRef.current.split(/\s+/);
            }
            setIsAiResponding(true);
            optionsRef.current.onAiChunk?.(data.text);
          } else if (data.type === "ai_text_end") {
            setIsAiResponding(false);
            if (typeof data.firstTokenLatencyMs === "number") setFirstTokenLatencyMs(data.firstTokenLatencyMs);
            if (typeof data.totalLatencyMs === "number") setTotalAiLatencyMs(data.totalLatencyMs);
            if (data.model) setAiModelUsed(data.model);
            optionsRef.current.onAiEnd?.({
              fullText: aiResponseRef.current,
              firstTokenLatencyMs: data.firstTokenLatencyMs,
              totalLatencyMs: data.totalLatencyMs,
              model: data.model,
            });
          } else if (data.type === "tts_start") {
            vadStateRef.current = "ai_speaking";
            setVadState("ai_speaking");
            setIsTtsSpeaking(true);
            setTtsAudioBytes(0);
            const sampleRate = data.sampleRate || 24000;
            if (!pcmPlayerRef.current) {
              pcmPlayerRef.current = new PcmStreamPlayer(sampleRate);
            }
            pcmPlayerRef.current.init(sampleRate);
            pcmPlayerRef.current.resetTurnTimeline();
            aiResponseRef.current = "";
            setAiResponse("");
            aiResponseWordsRef.current = [];
            revealedAiWordsRef.current = 0;
            if (aiRevealTimerRef.current) {
              clearInterval(aiRevealTimerRef.current);
            }
            aiRevealTimerRef.current = setInterval(() => {
              if (revealedAiWordsRef.current >= aiResponseWordsRef.current.length) return;
              revealedAiWordsRef.current += 1;
              setAiResponse(aiResponseWordsRef.current.slice(0, revealedAiWordsRef.current).join(" "));
            }, 140);
            optionsRef.current.onTtsStart?.(data);
          } else if (data.type === "tts_end") {
            pcmPlayerRef.current?.flush();
            if (aiRevealTimerRef.current) {
              clearInterval(aiRevealTimerRef.current);
              aiRevealTimerRef.current = null;
            }
            const remainingWords = aiResponseWordsRef.current.length - revealedAiWordsRef.current;
            if (remainingWords > 0) {
              const remainingPlaybackMs = Math.max(
                0,
                Math.ceil((pcmPlayerRef.current?.getRemainingPlayTime() ?? 0) * 1000),
              );
              setTimeout(() => {
                revealedAiWordsRef.current = aiResponseWordsRef.current.length;
                setAiResponse(aiResponseWordsRef.current.join(" "));
              }, remainingPlaybackMs);
            }
            setTtsMetrics({
              timeToFirstAudioMs: data.timeToFirstAudioMs,
              totalTtsLatencyMs: data.totalTtsLatencyMs,
              totalBytes: data.totalBytes,
              audioDurationSec: data.audioDurationSec,
              sampleRate: data.sampleRate || 24000,
              model: data.model || "flux-hannah-en",
              groqLatencyMs: data.groqLatencyMs,
            });

            // Calculate remaining audio playback time before resuming VAD listening
            const remainingSec = pcmPlayerRef.current?.getRemainingPlayTime() ?? 0;
            const cooldownMs = Math.max(150, Math.ceil(remainingSec * 1000) + 250);

            setTimeout(() => {
              setIsTtsSpeaking(false);
              // Multi-turn automatic resume: Return to listening with mic active
              vadStateRef.current = "listening";
              setVadState("listening");
              candidateSpeakingRef.current = false;
              turnRef.current.silenceMs = 0;
              setSilenceProgress(0);

              setTurnCount((prev) => {
                const nextTurn = prev + 1;
                const turnPayload: TurnData = {
                  turnNumber: nextTurn,
                  nextQuestion: lastTurnDataRef.current?.nextQuestion,
                  questionNum: lastTurnDataRef.current?.questionNum,
                  totalQuestions: lastTurnDataRef.current?.totalQuestions,
                  score: lastTurnDataRef.current?.score,
                  isComplete: lastTurnDataRef.current?.isComplete,
                };
                optionsRef.current.onTurnComplete?.(turnPayload);
                lastTurnDataRef.current = null;
                return nextTurn;
              });
              console.log("[useRealtimeVoice] AI finished speaking. Microphone active and listening for candidate turn.");
            }, cooldownMs);

            optionsRef.current.onTtsEnd?.(data);
          } else if (data.type === "turn_complete") {
            lastTurnDataRef.current = {
              turnNumber: data.questionNum || 1,
              nextQuestion: data.nextQuestion,
              questionNum: data.questionNum,
              totalQuestions: data.totalQuestions,
              score: data.score,
              isComplete: data.isComplete,
            };
          } else if (data.type === "empty_speech") {
            console.log("[useRealtimeVoice] Empty speech detected. Resuming listening safely.");
            setIsTranscribing(false);
            setIsAiResponding(false);
            setIsTtsSpeaking(false);
            candidateSpeakingRef.current = false;
            turnRef.current.silenceMs = 0;
            vadStateRef.current = "listening";
            setVadState("listening");
            setSilenceProgress(0);
          } else if (data.type === "error") {
            console.error("[useRealtimeVoice] Server error:", data.message);
            setError(data.message || "An error occurred during processing");
            setIsTranscribing(false);
            setIsAiResponding(false);
            setIsTtsSpeaking(false);
            candidateSpeakingRef.current = false;
            turnRef.current.silenceMs = 0;
            vadStateRef.current = "listening";
            setVadState("listening");
            optionsRef.current.onError?.(data.message);
          }
        } catch {
          /* ignore non-JSON messages */
        }
      };

      ws.onclose = () => {
        wsConnectingPromiseRef.current = null;
        setWsStatus("disconnected");
        setIsAiResponding(false);
        setIsTtsSpeaking(false);
      };

      ws.onerror = (err) => {
        wsConnectingPromiseRef.current = null;
        console.error("[useRealtimeVoice] Error:", err);
        setError("WebSocket connection failed. Ensure ws-server is running on port 8080.");
        setWsStatus("disconnected");
        setIsTranscribing(false);
        setIsAiResponding(false);
        setIsTtsSpeaking(false);
        reject(err);
      };
    });

    wsConnectingPromiseRef.current = connPromise;
    return connPromise;
  }, [wsUrl]);

  const startInterview = useCallback(async (configOrEvent?: StartInterviewConfig | unknown) => {
    if (isStartingInterviewRef.current) {
      console.warn("[useRealtimeVoice] startInterview called while already initializing; skipping duplicate call.");
      return;
    }
    isStartingInterviewRef.current = true;

    const config: StartInterviewConfig | undefined =
      configOrEvent && typeof configOrEvent === "object" && "sessionId" in configOrEvent
        ? (configOrEvent as StartInterviewConfig)
        : undefined;

    setError(null);
    setTranscript(null);
    setAiResponse("");
    aiResponseWordsRef.current = [];
    revealedAiWordsRef.current = 0;
    if (aiRevealTimerRef.current) {
      clearInterval(aiRevealTimerRef.current);
      aiRevealTimerRef.current = null;
    }
    setFirstTokenLatencyMs(null);
    setTotalAiLatencyMs(null);
    setAiModelUsed(null);
    setTtsMetrics(null);
    setTtsAudioBytes(0);
    setChunksSent(0);
    setBytesSent(0);
    setIsTranscribing(false);
    setIsAiResponding(false);
    setIsTtsSpeaking(false);
    setTurnCount(1);
    setSilenceProgress(0);
    lastTurnDataRef.current = null;

    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.stop();
    }

    try {
      // 1. Connect Single WebSocket
      const ws = await connectWebSocket();

      // If authoritative session config is provided, initialize session on ws-server
      if (config?.sessionId) {
        console.log(`[useRealtimeVoice] Initializing authoritative session #${config.sessionId}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "init_session",
            sessionId: config.sessionId,
            token: config.token,
            role: config.role,
            difficulty: config.difficulty,
            firstQuestion: config.firstQuestion,
          }));
        }

        // If Question 1 is being spoken, set state to ai_speaking to prevent mic feedback
        if (config.firstQuestion) {
          vadStateRef.current = "ai_speaking";
          setVadState("ai_speaking");
          setIsTtsSpeaking(true);
        }
      }

      // 2. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      // 3. Silero emits 16 kHz mono audio
      const vadSampleRate = 16000;
      sampleRateRef.current = vadSampleRate;

      // 4. Tell the server the recording format
      setMimeTypeUsed("audio/wav");
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "start_recording",
          mimeType: "audio/wav",
          sampleRate: vadSampleRate,
        }));
      }

      // 5. Start Silero VAD (client-only, so dynamic import)
      const { MicVAD } = await import("@ricky0123/vad-web");
      const START_FRAMES = 3;
      const startThreshold = Math.min(0.9, speechThreshold + 0.1);
      const MIN_RMS = 0.008;
      const MAX_TURN_MS = 90_000;
      const TAIL_KEEP_MS = 300;

      const resetTurn = () => {
        const turn = turnRef.current;
        turn.preRoll = [];
        turn.preRollMs = 0;
        turn.seg = [];
        turn.speechMs = 0;
        turn.silenceMs = 0;
        turn.turnMs = 0;
        turn.startCount = 0;
        candidateSpeakingRef.current = false;
      };
      resetTurn();

      const finishTurn = (frameMs: number) => {
        const turn = turnRef.current;
        const enoughSpeech = turn.speechMs >= minSpeechDurationMs;
        const dropFrames = Math.max(0, Math.floor((turn.silenceMs - TAIL_KEEP_MS) / frameMs));
        const frames = turn.seg.slice(0, Math.max(0, turn.seg.length - dropFrames));
        resetTurn();
        setSilenceProgress(0);

        const socket = wsRef.current;
        if (!enoughSpeech || !socket || socket.readyState !== WebSocket.OPEN) {
          vadStateRef.current = "listening";
          setVadState("listening");
          return;
        }

        const total = frames.reduce((length, currentFrame) => length + currentFrame.length, 0);
        const audio = new Float32Array(total);
        let offset = 0;
        for (const currentFrame of frames) {
          audio.set(currentFrame, offset);
          offset += currentFrame.length;
        }

        vadStateRef.current = "processing";
        setVadState("processing");
        setIsTranscribing(true);
        optionsRef.current.onSpeechEnded?.();

        const pcm = float32ToInt16Pcm(audio);
        socket.send(JSON.stringify({ type: "speech_started" }));
        socket.send(pcm);
        setChunksSent((prev) => prev + 1);
        setBytesSent((prev) => prev + pcm.byteLength);
        socket.send(JSON.stringify({ type: "speech_ended" }));
      };

      const vad = await MicVAD.new({
        model: "v5",
        baseAssetPath: "/vad/",
        onnxWASMBasePath: "/vad/",
        startOnLoad: false,
        processorType: "auto",
        getStream: async () => stream,
        pauseStream: async () => {},
        resumeStream: async () => stream,
        positiveSpeechThreshold: speechThreshold,
        submitUserSpeechOnPause: false,
        onFrameProcessed: (probs, frame) => {
          let sum = 0;
          for (let i = 0; i < frame.length; i++) {
            const value = frame[i] ?? 0;
            sum += value * value;
          }
          const rms = Math.sqrt(sum / frame.length);
          setSpeechEnergy(Math.min(1, rms * 15));

          const state = vadStateRef.current;
          if (state === "processing" || state === "ai_speaking") {
            const turn = turnRef.current;
            if (candidateSpeakingRef.current || turn.seg.length || turn.preRoll.length) {
              resetTurn();
            }
            return;
          }

          const turn = turnRef.current;
          const frameMs = (frame.length / vadSampleRate) * 1000;
          const threshold = candidateSpeakingRef.current ? speechThreshold : startThreshold;
          const isSpeech = probs.isSpeech >= threshold && rms >= MIN_RMS;
          const copy = new Float32Array(frame);

          if (!candidateSpeakingRef.current) {
            turn.preRoll.push(copy);
            turn.preRollMs += frameMs;
            while (turn.preRoll.length > 1 && turn.preRollMs - frameMs >= preRollMs) {
              turn.preRoll.shift();
              turn.preRollMs -= frameMs;
            }

            turn.startCount = isSpeech ? turn.startCount + 1 : 0;
            if (turn.startCount >= START_FRAMES) {
              candidateSpeakingRef.current = true;
              turn.seg = turn.preRoll;
              turn.preRoll = [];
              turn.preRollMs = 0;
              turn.speechMs = turn.startCount * frameMs;
              turn.silenceMs = 0;
              turn.turnMs = turn.seg.length * frameMs;
              turn.startCount = 0;

              vadStateRef.current = "speaking";
              setVadState("speaking");
              setSilenceProgress(0);
              setTranscript(null);
              transcriptRef.current = null;
              setAiResponse("");
              aiResponseRef.current = "";
              optionsRef.current.onSpeechStarted?.();
            }
            return;
          }

          turn.seg.push(copy);
          turn.turnMs += frameMs;

          if (isSpeech) {
            turn.speechMs += frameMs;
            turn.silenceMs = 0;
            if (vadStateRef.current === "silence_detecting") {
              vadStateRef.current = "speaking";
              setVadState("speaking");
            }
            setSilenceProgress(0);
          } else {
            turn.silenceMs += frameMs;
            if (vadStateRef.current === "speaking") {
              vadStateRef.current = "silence_detecting";
              setVadState("silence_detecting");
            }
            setSilenceProgress(Math.min(1, turn.silenceMs / silenceThresholdMs));
          }

          if (turn.silenceMs >= silenceThresholdMs || turn.turnMs >= MAX_TURN_MS) {
            finishTurn(frameMs);
          }
        },
      });

      vadRef.current = vad;

      if (!config?.firstQuestion) {
        vadStateRef.current = "listening";
        setVadState("listening");
      }
      await vad.start();
    } catch (err: unknown) {
      console.error("[useRealtimeVoice] Failed to start interview:", err);
      cleanupMicrophone();
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === "NotAllowedError" || errorObj?.name === "PermissionDeniedError") {
        setError("Microphone permission denied. Please allow microphone access to proceed.");
      } else {
        setError(errorObj?.message || "Failed to start interview recording.");
      }
    } finally {
      isStartingInterviewRef.current = false;
    }
  }, [
    connectWebSocket,
    cleanupMicrophone,
    silenceThresholdMs,
    minSpeechDurationMs,
    preRollMs,
    speechThreshold,
  ]);

  const endInterview = useCallback(() => {
    console.log("[useRealtimeVoice] User ended interview.");
    cleanupMicrophone();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop_recording" }));
    }
  }, [cleanupMicrophone]);

  const clearTranscript = useCallback(() => {
    setTranscript(null);
  }, []);

  const clearAll = useCallback(() => {
    setTranscript(null);
    setAiResponse("");
    setFirstTokenLatencyMs(null);
    setTotalAiLatencyMs(null);
    setAiModelUsed(null);
    setTtsMetrics(null);
    setTtsAudioBytes(0);
    setSilenceProgress(0);
    setSpeechEnergy(0);
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.stop();
    }
  }, []);

  return {
    isInterviewActive,
    vadState,
    speechEnergy,
    silenceProgress,
    turnCount,
    isRecording,
    isTranscribing,
    isAiResponding,
    isTtsSpeaking,
    wsStatus,
    chunksSent,
    bytesSent,
    mimeTypeUsed,
    transcript,
    aiResponse,
    firstTokenLatencyMs,
    totalAiLatencyMs,
    aiModelUsed,
    ttsMetrics,
    ttsAudioBytes,
    error,
    startInterview,
    endInterview,
    clearTranscript,
    clearAll,
    isMuted,
    toggleMute,
    wsUrl,
  };
}
