"use client";

import { useState, useEffect, useRef, useCallback, type MutableRefObject } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mic, MicOff, Clock3, Camera, CameraOff, CheckCircle2, ArrowLeft, RotateCcw, X,
} from "lucide-react";
import type { RoleData } from "../../data";
import { useRealtimeVoice, type TurnData } from "@/hooks/useRealtimeVoice";
import DevPrepMark from "@/components/shared/DevPrepMark";

type SessionData = RoleData & {
  sessionId?: number;
  firstQuestion?: string;
  totalQuestions?: number;
  candidateName?: string | null;
};

type Phase = "setup" | "active" | "done";
type PermissionState = "todo" | "done" | "blocked";
type PermissionKind = "microphone" | "camera";
type ChatMessage = {
  id: string;
  role: "interviewer" | "user";
  text: string;
  timestamp: string;
};

const EASE = [0.25, 0.8, 0.25, 1] as const;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const slug = rawRole ?? "";

  const [data, setData] = useState<SessionData | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentQ, setCurrentQ] = useState(0);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [camError, setCamError] = useState(false);
  const [camLoading, setCamLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState>("todo");
  const [cameraPermission, setCameraPermission] = useState<PermissionState>("todo");
  const [permissionMessage, setPermissionMessage] = useState<{
    microphone?: string;
    camera?: string;
  }>({});
  const [micLevel, setMicLevel] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const permissionStatusRefs = useRef<Partial<Record<PermissionKind, PermissionStatus>>>({});
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const endRealtimeInterviewRef = useRef<() => void>(() => {});

  const handleTranscript = useCallback((userText: string) => {
    console.log(`[InterviewSession] Candidate transcript: "${userText}"`);
  }, []);

  const handleAiEnd = useCallback((result: unknown) => {
    console.log(`[InterviewSession] Zara speech generation complete:`, result);
  }, []);

  const handleTurnComplete = useCallback((turnData: TurnData) => {
    console.log(`[InterviewSession] Authoritative turn complete:`, turnData);
    if (turnData?.nextQuestion) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: [...prev.questions, turnData.nextQuestion!],
        };
      });
    }
    setCurrentQ((q) => {
      const nextQ = q + 1;
      setAnswered((prev) => new Set([...prev, q]));
      if (turnData?.isComplete || nextQ >= totalQuestions) {
        endRealtimeInterviewRef.current();
        setPhase("done");
      }
      return nextQ;
    });
  }, [totalQuestions]);

  const handleError = useCallback((err: string) => {
    console.error("[InterviewSession] Voice pipeline error:", err);
    setError(err);
  }, []);

  // ── Realtime Voice Pipeline Hook ─────────────────────────────────────────────
  const {
    vadState,
    speechEnergy,
    isAiResponding,
    isTtsSpeaking,
    transcript,
    aiResponse,
    error: realtimeError,
    startInterview: startRealtimeInterview,
    endInterview: endRealtimeInterview,
    isMuted,
    toggleMute,
  } = useRealtimeVoice({
    onTranscript: handleTranscript,
    onAiEnd: handleAiEnd,
    onTurnComplete: handleTurnComplete,
    onError: handleError,
  });

  useEffect(() => {
    endRealtimeInterviewRef.current = endRealtimeInterview;
  }, [endRealtimeInterview]);

  // aiSpeaking drives the avatar pulsing animation
  const aiSpeaking = isAiResponding || isTtsSpeaking;
  const userIsSpeaking = vadState === "speaking" || vadState === "silence_detecting";

  const getTimestamp = () =>
    new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());

  useEffect(() => {
    if (!aiResponse) return;
    setChatMessages((previous) => {
      const last = previous[previous.length - 1];
      if (last?.role === "interviewer") {
        return [...previous.slice(0, -1), { ...last, text: aiResponse }];
      }
      return [...previous, { id: `ai-${Date.now()}`, role: "interviewer", text: aiResponse, timestamp: getTimestamp() }];
    });
  }, [aiResponse]);

  useEffect(() => {
    if (!transcript) return;
    setChatMessages((previous) => {
      const last = previous[previous.length - 1];
      if (last?.role === "user") {
        return [...previous.slice(0, -1), { ...last, text: transcript }];
      }
      return [...previous, { id: `user-${Date.now()}`, role: "user", text: transcript, timestamp: getTimestamp() }];
    });
  }, [transcript]);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [chatMessages, transcript, userIsSpeaking, aiSpeaking]);

  // Hydrate session data that was written by the role page after POST /api/interview/generate
  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(`interview_session_${slug}`) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SessionData;
        // firstQuestion is now "Tell me about yourself." — keep it as questions[0]
        // so the questions list on the done screen starts with the intro turn.
        if (parsed.firstQuestion && (!parsed.questions || parsed.questions.length === 0)) {
          parsed.questions = [parsed.firstQuestion];
        }
        if (parsed.totalQuestions) setTotalQuestions(parsed.totalQuestions);
        setData(parsed);
        return;
      } catch (err) {
        console.warn("[InterviewSession] Failed to parse sessionStorage data:", err);
      }
    }
    // Graceful fallback for direct visits or refreshed pages
    const roleTitle = slug
      ? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : "Technical Interview";
    setData({
      title: roleTitle || "Technical Interview",
      duration: 20,
      skills: ["System Design", "Problem Solving", "Core Architecture"],
      questions: ["Tell me about yourself."],
      firstQuestion: "Tell me about yourself.",
      totalQuestions: 10,
    });
  }, [slug]);

  // Session elapsed timer
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const isStartingInterviewRef = useRef<boolean>(false);

  // Primary user gesture starter: guarantees AudioContext runs in "running" state
  const handleStartInterview = async () => {
    if (isStartingInterviewRef.current) return;
    isStartingInterviewRef.current = true;
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setHelpOpen(false);
    setPhase("active");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await startRealtimeInterview({
        sessionId: data?.sessionId,
        token: token || undefined,
        role: slug,
        difficulty: "medium",
        firstQuestion: data?.firstQuestion,
      });
    } catch (err: unknown) {
      console.error("[InterviewSession] Failed to start voice session:", err);
      setError("Failed to initialize microphone or WebSocket server. Ensure ws-server is running.");
    } finally {
      isStartingInterviewRef.current = false;
    }
  };

  const stopPreviewStream = (streamRef: MutableRefObject<MediaStream | null>) => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const showPermissionError = (kind: PermissionKind, error: unknown) => {
    const errorName = error instanceof DOMException ? error.name : "";
    const label = kind === "camera" ? "camera" : "microphone";
    const message =
      errorName === "NotFoundError"
        ? `No ${label} found`
        : "Click the lock icon in your address bar, set " +
          `${kind === "camera" ? "Camera" : "Microphone"} to Allow, then press Try again.`;
    if (kind === "camera") {
      setCameraPermission("blocked");
      setCamError(true);
      setCamLoading(false);
    } else {
      setMicrophonePermission("blocked");
    }
    setPermissionMessage((previous) => ({ ...previous, [kind]: message }));
  };

  const startMicMeter = (stream: MediaStream) => {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    const audioContext = new AudioContextConstructor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const updateLevel = () => {
      analyser.getByteTimeDomainData(data);
      const average = data.reduce((sum, value) => sum + Math.abs(value - 128), 0) / data.length;
      setMicLevel(Math.min(1, average / 32));
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();
  };

  const requestPermission = async (kind: PermissionKind) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showPermissionError(kind, new Error("Media devices are unavailable"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "camera" ? { video: true } : { audio: true }
      );
      if (kind === "camera") {
        stopPreviewStream(cameraStreamRef);
        cameraStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamOn(true);
        setCamError(false);
        setCamLoading(false);
        setCameraPermission("done");
      } else {
        stopPreviewStream(microphoneStreamRef);
        microphoneStreamRef.current = stream;
        setMicrophonePermission("done");
        if (audioContextRef.current) await audioContextRef.current.close();
        startMicMeter(stream);
      }
      setPermissionMessage((previous) => ({ ...previous, [kind]: undefined }));
    } catch (error) {
      showPermissionError(kind, error);
    }
  };

  // Setup preview and permission state. The camera stream is handed to the active view.
  useEffect(() => {
    let active = true;
    const permissionKinds: PermissionKind[] = ["microphone", "camera"];

    const checkPermission = async (kind: PermissionKind) => {
      try {
        const status = await navigator.permissions.query({ name: kind as PermissionName });
        if (!active) return;
        permissionStatusRefs.current[kind] = status;
        status.onchange = () => {
          if (!active) return;
          if (status.state === "granted") {
            void requestPermission(kind);
          } else if (status.state === "denied") {
            showPermissionError(kind, new DOMException("Permission denied", "NotAllowedError"));
          } else {
            if (kind === "camera") {
              setCameraPermission("todo");
            } else {
              setMicrophonePermission("todo");
            }
          }
        };
        if (status.state === "granted") {
          await requestPermission(kind);
        } else if (status.state === "denied") {
          showPermissionError(kind, new DOMException("Permission denied", "NotAllowedError"));
        }
      } catch {
        // Permission queries are not implemented consistently across browsers.
      }
    };

    if (typeof navigator !== "undefined") {
      permissionKinds.forEach((kind) => void checkPermission(kind));
    }

    const statuses = permissionStatusRefs.current;
    return () => {
      active = false;
      permissionKinds.forEach((kind) => {
        if (statuses[kind]) {
          statuses[kind]!.onchange = null;
        }
      });
      stopPreviewStream(cameraStreamRef);
      stopPreviewStream(microphoneStreamRef);
      if (audioContextRef.current) void audioContextRef.current.close();
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The preview <video> element is re-mounted between setup and active phases,
  // so re-attach the camera stream whenever the element or permission changes.
  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
    }
  }, [phase, cameraPermission, camOn]);

  const toggleCam = () => {
    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    }
    setCamOn((c) => !c);
  };

  // End interview and clean up resources
  const endInterview = () => {
    endRealtimeInterview();
    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    router.push(`/dashboard/ai-interview/${slug}`);
  };

  if (!data) {
    return (
      <div className="dp min-h-screen bg-dp-bg text-dp-ink flex flex-col items-center justify-center font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4 text-center px-6"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-dp-pill flex items-center justify-center border border-dp-ln"
          >
            <span className="text-xl font-extrabold text-dp-ink">
              D<span className="text-dp-ac">.</span>
            </span>
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-dp-ink tracking-[-0.01em]">
              Zara is preparing your first question...
            </h3>
            <p className="text-xs text-dp-mu mt-1 font-medium">
              Initializing AI interview session
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
  // -- SETUP (READY SCREEN) --------------------------------------------------
  if (phase === "setup") {
    const count = data.totalQuestions ?? totalQuestions;
    const ready = microphonePermission === "done" && cameraPermission === "done";
    const completed = [microphonePermission, cameraPermission].filter((s) => s === "done").length;
    const hint = ready ? "All set · you can start" : cameraPermission === "blocked" ? "Fix camera access to continue" : "Allow microphone and camera to continue";
    const row = (kind: PermissionKind, step: string, label: string) => {
      const state = kind === "camera" ? cameraPermission : microphonePermission;
      const message = permissionMessage[kind];
      return <div className="border-b border-dp-ln last:border-b-0"><div className="flex items-center gap-3 px-5 py-5"><div aria-label={`${label}: ${state}`} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border-2 font-bold ${state === "done" ? "border-[#22C55E] bg-[#22C55E] text-white" : state === "blocked" ? "border-[#EB3A14] bg-[#EB3A14] text-white" : "border-dp-ink bg-dp-sf text-transparent"}`}>{state === "done" ? "\u2713" : state === "blocked" ? "!" : "·"}</div><div className="min-w-0 flex-1"><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-dp-mu">Step {step} · Required</p><p className="mt-1 text-[15px] font-semibold">{label}</p>{state === "done" && <p className="mt-1 text-[13px] text-dp-ok">Allowed</p>}{state === "blocked" && <p className="mt-1 text-[13px] text-[#B32A0A]">Blocked</p>}</div>{state !== "done" && <button type="button" onClick={() => void requestPermission(kind)} className={`min-h-11 shrink-0 rounded-full px-4 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3A14] ${state === "blocked" ? "border border-[#EB3A14] text-[#EB3A14] hover:bg-[#EB3A14] hover:text-white" : "bg-[#EB3A14] text-white hover:opacity-90"}`}>{state === "blocked" ? "Try again" : `Allow ${kind === "camera" ? "camera" : "microphone"}`}</button>}</div>{state === "blocked" && message && <div className="mx-5 mb-5 rounded-[4px] bg-dp-bg px-4 py-3 text-[13px] text-[#B32A0A]">{message}</div>}</div>;
    };
    return <div className="relative min-h-screen overflow-hidden dp bg-dp-bg text-dp-ink antialiased font-sans"><div className="dp-ember dp-ember--soft" aria-hidden="true" /><header className="relative z-10 mx-auto flex max-w-[1120px] items-center justify-between px-6 py-6 lg:px-8"><div className="flex items-center gap-2"><DevPrepMark size={24} /><span className="text-[15px] font-bold">DevPrep</span></div><button type="button" onClick={() => router.push(`/dashboard/ai-interview/${slug}`)} className="min-h-11 rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-dp-mu"><ArrowLeft size={14} className="mr-2 inline" aria-hidden="true" /> Go back</button></header><main className="relative z-10 mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 pb-14 pt-8 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-14"><section><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#EB3A14]">{data.title} · {count} {count === 1 ? "question" : "questions"} · ~{data.duration} min</p><h1 className="mt-6 max-w-[520px] text-[42px] font-bold leading-[1] tracking-[-0.04em] sm:text-[52px]">Ready for your interview?</h1><p className="mt-5 max-w-[480px] text-[16px] leading-7 text-dp-mu">Check your microphone and camera before you begin. You can focus on the conversation once everything is ready.</p><div className="mt-10 flex items-end justify-between"><div><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-dp-mu">Before you start</p><div className="mt-3 flex gap-2">{[microphonePermission, cameraPermission].map((s, i) => <span key={i} className={`h-1.5 w-24 rounded-full ${s === "done" ? "bg-[#EB3A14]" : "bg-dp-ln"}`} />)}</div></div><span className="font-mono text-[11px] tracking-[0.1em] text-dp-mu">{String(completed).padStart(2, "0")} / 02</span></div><div className="mt-5 overflow-hidden rounded-[12px] border border-dp-ln bg-dp-sf">{row("microphone", "01", "Microphone access")}{row("camera", "02", "Camera access")}</div><button type="button" disabled={!ready} onClick={handleStartInterview} className="dp-mono mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full dp-btn-ember px-5 text-[13px] font-bold uppercase tracking-[0.1em] disabled:cursor-not-allowed disabled:bg-none disabled:bg-dp-ln disabled:text-dp-mu disabled:shadow-none"><Mic size={16} aria-hidden="true" /> Start interview</button><p aria-live="polite" className={`mt-3 text-center text-[13px] ${ready ? "text-dp-ok" : "text-dp-mu"}`}>{hint}</p></section><aside className="space-y-5"><div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#111113]">{cameraPermission === "done" && <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" />}{cameraPermission !== "done" && <div className="absolute inset-0 flex flex-col items-center justify-center"><p className="text-5xl font-extrabold text-white">D<span className="text-[#EB3A14]">.</span></p><p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white/70">{cameraPermission === "blocked" ? "Camera blocked" : "Camera is off"}</p></div>}<div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-dp-sf px-3 py-2 text-[12px] font-semibold text-dp-ink"><span className={`h-2 w-2 rounded-full ${cameraPermission === "done" ? "bg-[#22C55E]" : cameraPermission === "blocked" ? "bg-[#EB3A14]" : "bg-[#666666]"}`} />Camera preview</div></div><div className="rounded-[12px] border border-dp-ln bg-dp-sf p-5"><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-dp-mu">Mic level · {microphonePermission === "done" ? "say hello" : "off"}</p><div className="mt-5 flex h-10 items-end gap-1">{Array.from({ length: 12 }, (_, i) => <span key={i} className={`flex-1 rounded-sm ${microphonePermission === "done" && micLevel > i / 12 ? "bg-[#EB3A14]" : "bg-dp-ln"}`} style={{ height: `${35 + (i % 4) * 15}%` }} />)}</div></div><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-dp-mu">Tip · Find a quiet space and keep your face well lit.</p></aside></main></div>;
  }
  // ── DONE SCREEN ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="dp min-h-screen bg-dp-bg text-dp-ink flex flex-col items-center justify-center px-6 relative overflow-hidden antialiased font-sans">
        <div className="dp-ember" aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full py-12 pb-40">
          <div className="flex items-center gap-2 font-bold tracking-tight mb-8">
            <DevPrepMark size={24} />
            <span className="text-[17px] font-bold">DevPrep</span>
          </div>

          <div className="w-14 h-14 rounded-full bg-dp-ok/10 border border-dp-ok/30 flex items-center justify-center mb-5">
            <CheckCircle2 size={24} className="text-dp-ok" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] mb-2">
            Interview complete
          </h2>
          <p className="text-sm text-dp-mu">
            {answered.size} of {data.questions.length} questions answered in{" "}
            <span className="text-dp-ink font-semibold">{formatTime(elapsed)}</span>.
          </p>

          <div className="mt-8 w-full bg-dp-sf2 border border-dp-ln rounded-2xl p-5 text-left">
            <p className="dp-mono text-[11px] text-dp-mu uppercase tracking-[0.1em] mb-3">
              Questions covered
            </p>
            <div className="space-y-2.5">
              {data.questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px]">
                  <CheckCircle2
                    size={14}
                    className={`mt-0.5 flex-shrink-0 ${answered.has(i) ? "text-dp-ok" : "text-dp-mu/40"}`}
                  />
                  <span className="line-clamp-1">{q}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => router.push("/dashboard/ai-interview/feedback")}
              className="dp-mono dp-btn-ember flex-1 h-12 rounded-full text-[12px] font-bold uppercase tracking-[0.1em] cursor-pointer"
            >
              View feedback
            </button>
            <button
              onClick={() => {
                setPhase("setup");
                setCurrentQ(0);
                setAnswered(new Set());
                setElapsed(0);
                setChatMessages([]);
              }}
              className="dp-mono flex-1 h-12 rounded-full border border-dp-ln bg-dp-sf/70 backdrop-blur text-[12px] font-bold uppercase tracking-[0.1em] cursor-pointer hover:border-dp-ink transition-colors"
            >
              Try again
            </button>
          </div>
          <button
            onClick={() => router.push("/dashboard/ai-interview")}
            className="dp-mono mt-4 text-[11px] uppercase tracking-[0.1em] text-dp-mu hover:text-dp-ink cursor-pointer"
          >
            Back to roles
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE INTERVIEW ──────────────────────────────────────────────────────────
  const topicTabs = data.skills.slice(0, 3);
  const shortTopic = (topic: string) => topic.replace(/\s+(proficiency|expertise|fundamentals)$/i, "");
  const currentQuestionText =
    data.questions[currentQ] ??
    data.firstQuestion ??
    "Can you walk me through your technical background and a recent project you built?";
  const isThinking = vadState === "processing";
  const statusText = aiSpeaking
    ? "Speaking to you…"
    : isThinking
      ? "Thinking…"
      : userIsSpeaking
        ? "Listening to you…"
        : "Your turn — go ahead";
  // Topics reached so far are highlighted; the rest stay dimmed
  const perTopic = totalQuestions / Math.max(1, topicTabs.length);
  const topicActive = (i: number) => i <= Math.floor(answered.size / perTopic);
  const cameraLive = camOn && !camError && !camLoading && cameraPermission === "done";
  const energyBars = [0.45, 0.8, 0.6, 1, 0.7, 0.9];

  return (
    <div className="dp relative h-[100dvh] overflow-hidden bg-dp-bg text-dp-ink flex flex-col antialiased font-sans">
      <div className="dp-ember" aria-hidden="true" />

      {/* ── TOP BAR ── */}
      <header className="relative z-10 flex-shrink-0 mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-12 pt-4 lg:pt-5 2xl:pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <DevPrepMark size={20} className="lg:w-6 lg:h-6" />
              <span className="text-[15px] lg:text-[17px] 2xl:text-[19px] font-bold tracking-[-0.01em]">DevPrep</span>
            </div>
            <span className="h-5 lg:h-6 w-px bg-dp-ln shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-dp-ok shrink-0" />
              <span className="text-[12px] lg:text-[13px] 2xl:text-[14px] text-dp-ink/80 truncate">{data.title}</span>
            </div>
          </div>

          <nav aria-label="Interview topics" className="hidden lg:flex gap-8 2xl:gap-10">
            {topicTabs.map((item, i) => (
              <div key={item} className={`transition-opacity ${topicActive(i) ? "opacity-100" : "opacity-60"}`}>
                <p className="text-[13px] 2xl:text-[14px] text-dp-ink mb-2 whitespace-nowrap">{item}</p>
                <div className="h-1 rounded-full bg-dp-ac" />
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:gap-2.5 rounded-full border border-dp-ln bg-dp-pill px-3 lg:px-5 h-8 lg:h-11 2xl:h-12 shrink-0">
            <Clock3 size={14} className="text-dp-ink lg:w-[18px] lg:h-[18px]" />
            <span className="text-[13px] lg:text-[16px] 2xl:text-[18px] font-semibold tabular-nums tracking-[0.02em]">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Mobile topic tabs */}
        <nav aria-label="Interview topics" className="lg:hidden mt-4 grid grid-cols-3 gap-4">
          {topicTabs.map((item, i) => (
            <div key={item} className={`min-w-0 transition-opacity ${topicActive(i) ? "opacity-100" : "opacity-60"}`}>
              <p className="text-[12px] text-dp-ink mb-1.5 truncate">{shortTopic(item)}</p>
              <div className="h-1 rounded-full bg-dp-ac" />
            </div>
          ))}
        </nav>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 flex-1 min-h-0 mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-12 pt-3 lg:pt-8 2xl:pt-10 grid grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] gap-4 lg:gap-14 2xl:gap-20">
        {/* LEFT – mic + camera */}
        <section aria-label="Your audio and video" className="flex flex-col gap-3 lg:gap-6 min-h-0">
          <div className="flex items-center gap-3 lg:justify-between">
            <div className="flex items-center gap-2.5">
              {isMuted ? <MicOff size={16} className="text-dp-ac lg:w-[18px] lg:h-[18px]" /> : <Mic size={16} className="text-dp-ac lg:w-[18px] lg:h-[18px]" />}
              <p className="text-[12px] lg:text-[14px] 2xl:text-[15px] font-medium whitespace-nowrap">{isMuted ? "Mic muted" : "Mic active"}</p>
            </div>
            <div className="flex items-center gap-3 lg:gap-5 ml-auto lg:ml-0">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full text-dp-ink/80 hover:bg-dp-ink/5 cursor-pointer"
              >
                {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
              <div className="flex gap-[3px] items-end h-5" aria-hidden="true">
                {energyBars.map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{
                      height: isMuted
                        ? 4
                        : userIsSpeaking
                          ? [6 * h, Math.max(6, 20 * h * (0.4 + speechEnergy)), 6 * h]
                          : aiSpeaking
                            ? [8 * h, 16 * h, 8 * h]
                            : 10 * h + 4,
                    }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.08 }}
                    className={`w-[3px] rounded-full ${isMuted ? "bg-dp-ln" : "bg-dp-ac"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={toggleCam}
                aria-label={camOn ? "Turn camera off" : "Turn camera on"}
                className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full text-dp-ink/80 hover:bg-dp-ink/5 cursor-pointer"
              >
                {camOn ? <Camera size={17} /> : <CameraOff size={17} />}
              </button>
              <span className="lg:hidden flex items-center gap-2 rounded-full border border-dp-ln px-3 h-7 text-[11px] font-medium whitespace-nowrap">
                <span className={`h-2 w-2 rounded-full ${cameraLive ? "bg-dp-ok" : "bg-dp-mu/60"}`} />
                <span className="hidden min-[380px]:inline">Camera preview</span>
                <span className="min-[380px]:hidden">Camera</span>
              </span>
            </div>
          </div>

          <span className="hidden lg:flex w-fit items-center gap-2.5 rounded-full border border-dp-ln px-4 h-9 2xl:h-10 text-[13px] 2xl:text-[14px] font-medium">
            <span className={`h-2 w-2 rounded-full ${cameraLive ? "bg-dp-ok" : "bg-dp-mu/60"}`} />
            Camera preview
          </span>

          <div className="relative h-[150px] sm:h-[200px] lg:h-auto lg:flex-1 lg:max-h-[440px] lg:-mt-6 rounded-2xl border border-transparent dark:border-dp-ln lg:dark:border-transparent overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-cover scale-x-[-1] rounded-2xl ${cameraLive ? "opacity-100" : "opacity-0 absolute"}`}
            />
            {!cameraLive && (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Camera size={30} strokeWidth={1.5} className="text-dp-mu dark:text-dp-ink/80 lg:w-11 lg:h-11" />
                <p className="text-[12px] lg:text-[16px] 2xl:text-[18px] max-w-[130px] lg:max-w-none text-dp-mu dark:text-dp-ink/85">
                  {camLoading ? "Starting camera…" : camError ? "Camera unavailable — audio interview mode" : "Camera preview will appear here"}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT – conversation */}
        <section aria-label="Conversation with Zara" className="flex flex-col min-h-0">
          <div className="flex items-center gap-4 flex-shrink-0 pb-3">
            <motion.div
              animate={aiSpeaking ? { boxShadow: ["0 0 0 0 rgba(235,58,20,0)", "0 0 0 6px rgba(235,58,20,0.18)", "0 0 0 0 rgba(235,58,20,0)"] } : { boxShadow: "0 0 0 0 rgba(235,58,20,0)" }}
              transition={{ repeat: aiSpeaking ? Infinity : 0, duration: 1.6 }}
              className="w-10 h-10 lg:w-12 lg:h-12 2xl:w-14 2xl:h-14 rounded-full bg-dp-pill border border-dp-ln flex items-center justify-center shrink-0"
            >
              <span className="text-[16px] lg:text-[20px] font-extrabold">
                D<span className="text-dp-ac">.</span>
              </span>
            </motion.div>
            <div>
              <p className="text-[13px] lg:text-[14px] 2xl:text-[15px] font-semibold">DevPrep Interviewer</p>
              <p aria-live="polite" className={`text-[12px] lg:text-[13px] 2xl:text-[14px] ${isThinking ? "text-dp-mu" : "text-dp-ok"}`}>{statusText}</p>
            </div>
          </div>

          <div
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            className="dp-fade-y flex-1 min-h-0 overflow-y-auto pt-2 pb-16 space-y-3 lg:space-y-5 pl-12 lg:pl-8 pr-1"
            style={{ scrollbarWidth: "none" }}
          >
            {chatMessages.length === 0 && (
              <AiMessage text={currentQuestionText} timestamp={getTimestamp()} />
            )}

            {chatMessages.map((message) =>
              message.role === "user" ? (
                <UserMessage key={message.id} text={message.text} timestamp={message.timestamp} />
              ) : (
                <AiMessage key={message.id} text={message.text} timestamp={message.timestamp} />
              ),
            )}

            {userIsSpeaking && !transcript && (
              <div className="flex justify-end">
                <div className="rounded-[18px] dp-btn-ember px-5 py-4 flex gap-1.5 items-center" aria-label="You are speaking">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: dot * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-white"
                    />
                  ))}
                </div>
              </div>
            )}

            {isThinking && (
              <div className="flex justify-start">
                <div className="rounded-[18px] bg-dp-sf2 border border-dp-ln lg:bg-transparent lg:border-0 px-5 py-4 lg:px-0 flex gap-1.5 items-center" aria-label="Zara is thinking">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: dot * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-dp-mu"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {(error || realtimeError) && (
            <div role="alert" className="flex-shrink-0 mt-2 rounded-xl border border-dp-ln border-l-[3px] border-l-dp-ac bg-dp-bg/85 backdrop-blur-md px-4 py-3 text-[12px] lg:text-[13px] text-dp-ink">
              {error || realtimeError}
            </div>
          )}
        </section>
      </main>

      {/* ── CONTROLS ── */}
      <footer className="relative z-20 flex-shrink-0 w-full px-4 sm:px-6 lg:px-14 pt-2 pb-7 lg:pb-[72px]">
        <div className="flex items-center justify-center lg:justify-end gap-3">
          <div className="relative flex items-center gap-2.5 sm:gap-6">
            <button
              type="button"
              onClick={endInterview}
              className="dp-mono dp-btn-ember h-10 lg:h-12 2xl:h-14 px-6 lg:px-7 2xl:px-9 rounded-full text-[11px] lg:text-[13px] 2xl:text-[16px] font-bold uppercase tracking-[0.04em] cursor-pointer transition-transform active:scale-95"
            >
              End interview
            </button>
            <button
              type="button"
              onClick={() => setHelpOpen((open) => !open)}
              aria-expanded={helpOpen}
              className="dp-mono h-10 lg:h-12 2xl:h-14 px-6 lg:px-7 2xl:px-9 rounded-full border border-dp-ln bg-dp-sf/70 backdrop-blur-md text-[11px] lg:text-[13px] 2xl:text-[16px] font-bold uppercase tracking-[0.04em] cursor-pointer transition-colors hover:border-dp-ink active:scale-95"
            >
              Having problem
            </button>

            {helpOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                role="dialog"
                aria-label="Troubleshooting"
                className="absolute bottom-[calc(100%+12px)] right-0 left-0 sm:left-auto sm:w-[340px] rounded-2xl border border-dp-ln bg-dp-sf p-5 text-left shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="dp-mono text-[11px] uppercase tracking-[0.1em] text-dp-mu">Troubleshooting</p>
                  <button type="button" onClick={() => setHelpOpen(false)} aria-label="Close" className="text-dp-mu hover:text-dp-ink cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <ul className="space-y-2 text-[13px] leading-relaxed text-dp-ink/90 list-disc pl-4">
                  <li>Allow microphone access from the lock icon in your address bar.</li>
                  <li>Pause for about a second when you finish — Zara replies once you stop speaking.</li>
                  <li>Use headphones if Zara&apos;s voice is being picked up by your mic.</li>
                </ul>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="dp-mono mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-dp-ac cursor-pointer"
                >
                  <RotateCcw size={13} /> Reload session
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function AiMessage({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[86%] lg:max-w-[540px]">
        <div className="rounded-[14px] bg-dp-sf2 border border-dp-ln px-3.5 py-2.5 lg:bg-transparent lg:border-0 lg:p-0 text-[12.5px] lg:text-[15px] 2xl:text-[17px] leading-[1.5]">
          {text}
        </div>
        <p className="mt-1.5 lg:mt-2 px-1 lg:px-0 text-[11px] lg:text-[13px] 2xl:text-[14px] text-dp-mu">{timestamp}</p>
      </div>
    </div>
  );
}

function UserMessage({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] lg:max-w-[85%] rounded-[12px] lg:rounded-[16px] bg-gradient-to-b from-[#ff4a1c] to-[#f2380f] px-3.5 py-2.5 lg:px-5 lg:py-3.5 text-white">
        <p className="text-[12.5px] lg:text-[15px] 2xl:text-[16px] leading-[1.5]">{text}</p>
        <p className="mt-1 lg:mt-1.5 text-[11px] lg:text-[13px] text-white/75">{timestamp}</p>
      </div>
    </div>
  );
}
