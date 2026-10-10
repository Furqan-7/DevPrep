import { useEffect, useRef, useState, useCallback } from "react";

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
  energyThreshold?: number;
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
    silenceThresholdMs = 800,
    minSpeechDurationMs = 250,
    preRollMs = 500,
    energyThreshold: baseEnergyThreshold = 0.02,
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
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const muteGainRef = useRef<GainNode | null>(null);
  const pcmPlayerRef = useRef<PcmStreamPlayer | null>(null);
  const sampleRateRef = useRef<number>(16000);

  // VAD state trackers
  const vadStateRef = useRef<VadState>("idle");
  const preRollQueueRef = useRef<Float32Array[]>([]);
  const preRollSamplesRef = useRef<number>(0);
  const consecutiveSilenceSamplesRef = useRef<number>(0);
  const speechSamplesRef = useRef<number>(0);
  const noiseFloorRef = useRef<number>(0.005);
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
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {
        /* ignore */
      }
      scriptProcessorRef.current = null;
    }
    if (muteGainRef.current) {
      try {
        muteGainRef.current.disconnect();
      } catch {
        /* ignore */
      }
      muteGainRef.current = null;
    }
    if (micAudioCtxRef.current && micAudioCtxRef.current.state !== "closed") {
      try {
        micAudioCtxRef.current.close();
      } catch {
        /* ignore */
      }
      micAudioCtxRef.current = null;
    }
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
              preRollQueueRef.current = [];
              preRollSamplesRef.current = 0;
              consecutiveSilenceSamplesRef.current = 0;
              speechSamplesRef.current = 0;
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
            vadStateRef.current = "listening";
            setVadState("listening");
            setSilenceProgress(0);
          } else if (data.type === "error") {
            console.error("[useRealtimeVoice] Server error:", data.message);
            setError(data.message || "An error occurred during processing");
            setIsTranscribing(false);
            setIsAiResponding(false);
            setIsTtsSpeaking(false);
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

      // 3. Initialize AudioContext for microphone capture and VAD
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const micAudioCtx = new AudioCtxClass();
      if (micAudioCtx.state === "suspended") {
        await micAudioCtx.resume();
      }
      micAudioCtxRef.current = micAudioCtx;
      const sampleRate = micAudioCtx.sampleRate;
      sampleRateRef.current = sampleRate;

      // 4. Calculate limits based on sample rate
      const silenceSamplesLimit = Math.floor((silenceThresholdMs / 1000) * sampleRate);
      const minSpeechSamplesLimit = Math.floor((minSpeechDurationMs / 1000) * sampleRate);
      const preRollSamplesLimit = Math.floor((preRollMs / 1000) * sampleRate);

      // 5. Notify server of recording format
      setMimeTypeUsed("audio/wav");
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "start_recording",
          mimeType: "audio/wav",
          sampleRate: sampleRate,
        }));
      }

      // 6. Set up Web Audio pipeline
      const source = micAudioCtx.createMediaStreamSource(stream);
      const scriptProcessor = micAudioCtx.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      const muteGain = micAudioCtx.createGain();
      muteGain.gain.value = 0;
      muteGainRef.current = muteGain;

      source.connect(scriptProcessor);
      scriptProcessor.connect(muteGain);
      muteGain.connect(micAudioCtx.destination);

      if (!config?.firstQuestion) {
        vadStateRef.current = "listening";
        setVadState("listening");
      }

      preRollQueueRef.current = [];
      preRollSamplesRef.current = 0;
      consecutiveSilenceSamplesRef.current = 0;
      speechSamplesRef.current = 0;
      noiseFloorRef.current = 0.005;

      scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
        const inputData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          const val = inputData[i] ?? 0;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / inputData.length);
        setSpeechEnergy(Math.min(1, rms * 15));

        // Prevent acoustic feedback: Do NOT detect speech when AI is speaking or processing
        if (vadStateRef.current === "processing" || vadStateRef.current === "ai_speaking") {
          return;
        }

        // Adaptive noise floor & dynamic speech threshold
        noiseFloorRef.current = Math.min(noiseFloorRef.current * 0.998 + rms * 0.002, rms);
        const dynamicThreshold = Math.max(baseEnergyThreshold, noiseFloorRef.current * 2.5);
        const isVoice = rms > dynamicThreshold;

        // VAD State Machine:
        if (vadStateRef.current === "listening") {
          const blockCopy = new Float32Array(inputData);
          preRollQueueRef.current.push(blockCopy);
          preRollSamplesRef.current += blockCopy.length;
          while (
            preRollSamplesRef.current - (preRollQueueRef.current[0]?.length ?? 0) >=
            preRollSamplesLimit
          ) {
            const removed = preRollQueueRef.current.shift();
            if (removed) preRollSamplesRef.current -= removed.length;
          }

          if (isVoice) {
            console.log("[VAD] Voice activity detected! Transitioning to SPEECH_ACTIVE.");
            vadStateRef.current = "speaking";
            setVadState("speaking");
            setTranscript(null);
            transcriptRef.current = null;
            setAiResponse("");
            aiResponseRef.current = "";
            optionsRef.current.onSpeechStarted?.();

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "speech_started" }));

              for (const block of preRollQueueRef.current) {
                const pcm = float32ToInt16Pcm(block);
                wsRef.current.send(pcm);
                setChunksSent((prev) => prev + 1);
                setBytesSent((prev) => prev + pcm.byteLength);
              }
            }
            preRollQueueRef.current = [];
            preRollSamplesRef.current = 0;
            speechSamplesRef.current = 0;
            consecutiveSilenceSamplesRef.current = 0;
            setSilenceProgress(0);
          }
        } else if (vadStateRef.current === "speaking") {
          speechSamplesRef.current += inputData.length;

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const pcm = float32ToInt16Pcm(inputData);
            wsRef.current.send(pcm);
            setChunksSent((prev) => prev + 1);
            setBytesSent((prev) => prev + pcm.byteLength);
          }

          if (!isVoice) {
            vadStateRef.current = "silence_detecting";
            setVadState("silence_detecting");
            consecutiveSilenceSamplesRef.current = inputData.length;
            setSilenceProgress(consecutiveSilenceSamplesRef.current / silenceSamplesLimit);
          } else {
            consecutiveSilenceSamplesRef.current = 0;
            setSilenceProgress(0);
          }
        } else if (vadStateRef.current === "silence_detecting") {
          speechSamplesRef.current += inputData.length;

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const pcm = float32ToInt16Pcm(inputData);
            wsRef.current.send(pcm);
            setChunksSent((prev) => prev + 1);
            setBytesSent((prev) => prev + pcm.byteLength);
          }

          if (isVoice) {
            vadStateRef.current = "speaking";
            setVadState("speaking");
            consecutiveSilenceSamplesRef.current = 0;
            setSilenceProgress(0);
          } else {
            consecutiveSilenceSamplesRef.current += inputData.length;
            const progress = Math.min(1, consecutiveSilenceSamplesRef.current / silenceSamplesLimit);
            setSilenceProgress(progress);

            if (consecutiveSilenceSamplesRef.current >= silenceSamplesLimit) {
              if (speechSamplesRef.current >= minSpeechSamplesLimit) {
                console.log("[VAD] Finalized speech turn. Sending speech_ended.");
                vadStateRef.current = "processing";
                setVadState("processing");
                setIsTranscribing(true);
                optionsRef.current.onSpeechEnded?.();

                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ type: "speech_ended" }));
                }
              } else {
                console.log("[VAD] Noise burst below minSpeechDuration. Discarding.");
                vadStateRef.current = "listening";
                setVadState("listening");
              }
              consecutiveSilenceSamplesRef.current = 0;
              speechSamplesRef.current = 0;
              setSilenceProgress(0);
            }
          }
        }
      };
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
    baseEnergyThreshold,
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
