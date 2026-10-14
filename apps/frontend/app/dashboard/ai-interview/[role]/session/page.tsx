"use client";

import { useState, useEffect, useRef, useCallback, type MutableRefObject } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mic, MicOff, Clock3, PhoneOff, AlertOctagon,
  UserRound, CheckCircle2, ChevronDown, Video, ArrowLeft,
} from "lucide-react";
import type { RoleData } from "../../data";
import { useRealtimeVoice, type TurnData } from "@/hooks/useRealtimeVoice";
import Image from "next/image";

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
    isRecording,
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
            kind === "camera" ? setCameraPermission("todo") : setMicrophonePermission("todo");
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

    return () => {
      active = false;
      permissionKinds.forEach((kind) => {
        if (permissionStatusRefs.current[kind]) {
          permissionStatusRefs.current[kind]!.onchange = null;
        }
      });
      stopPreviewStream(cameraStreamRef);
      stopPreviewStream(microphoneStreamRef);
      if (audioContextRef.current) void audioContextRef.current.close();
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

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
      <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] flex flex-col items-center justify-center font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4 text-center px-6"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center border border-[#E5E5E5] relative"
          >
            <span className="text-xl font-extrabold text-[#1A1A1A]">
              D<span className="text-[#EB3A14]">.</span>
            </span>
          </motion.div>
          <div>
            <h3 className="text-base font-extrabold text-[#1A1A1A] tracking-[-0.01em]">
              Zara is preparing your first question...
            </h3>
            <p className="text-xs text-[#666666] mt-1 font-medium">
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
    const hint = ready ? "All set \u00b7 you can start" : cameraPermission === "blocked" ? "Fix camera access to continue" : "Allow microphone and camera to continue";
    const row = (kind: PermissionKind, step: string, label: string) => {
      const state = kind === "camera" ? cameraPermission : microphonePermission;
      const message = permissionMessage[kind];
      return <div className="border-b border-[#E5E5E5] last:border-b-0"><div className="flex items-center gap-3 px-5 py-5"><div aria-label={`${label}: ${state}`} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border-2 font-bold ${state === "done" ? "border-[#22C55E] bg-[#22C55E] text-white" : state === "blocked" ? "border-[#EB3A14] bg-[#EB3A14] text-white" : "border-[#1A1A1A] bg-white text-transparent"}`}>{state === "done" ? "\u2713" : state === "blocked" ? "!" : "\u00b7"}</div><div className="min-w-0 flex-1"><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#666666]">Step {step} \u00b7 Required</p><p className="mt-1 text-[15px] font-semibold">{label}</p>{state === "done" && <p className="mt-1 text-[13px] text-[#15803D]">Allowed</p>}{state === "blocked" && <p className="mt-1 text-[13px] text-[#B32A0A]">Blocked</p>}</div>{state !== "done" && <button type="button" onClick={() => void requestPermission(kind)} className={`min-h-11 shrink-0 rounded-full px-4 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3A14] ${state === "blocked" ? "border border-[#EB3A14] text-[#EB3A14] hover:bg-[#EB3A14] hover:text-white" : "bg-[#EB3A14] text-white hover:opacity-90"}`}>{state === "blocked" ? "Try again" : `Allow ${kind === "camera" ? "camera" : "microphone"}`}</button>}</div>{state === "blocked" && message && <div className="mx-5 mb-5 rounded-[4px] bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#B32A0A]">{message}</div>}</div>;
    };
    return <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] antialiased font-sans"><header className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-6 lg:px-8"><div className="flex items-center gap-2"><Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} unoptimized className="rounded-sm" /><span className="text-[15px] font-bold">DevPrep</span></div><button type="button" onClick={() => router.push(`/dashboard/ai-interview/${slug}`)} className="min-h-11 rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#666666]"><ArrowLeft size={14} className="mr-2 inline" aria-hidden="true" /> Go back</button></header><main className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 pb-14 pt-8 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-14"><section><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#EB3A14]">{data.title} \u00b7 {count} {count === 1 ? "question" : "questions"} \u00b7 ~{data.duration} min</p><h1 className="mt-6 max-w-[520px] text-[42px] font-bold leading-[1] tracking-[-0.04em] sm:text-[52px]">Ready for your interview?</h1><p className="mt-5 max-w-[480px] text-[16px] leading-7 text-[#666666]">Check your microphone and camera before you begin. You can focus on the conversation once everything is ready.</p><div className="mt-10 flex items-end justify-between"><div><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#666666]">Before you start</p><div className="mt-3 flex gap-2">{[microphonePermission, cameraPermission].map((s, i) => <span key={i} className={`h-1.5 w-24 rounded-full ${s === "done" ? "bg-[#EB3A14]" : "bg-[#E5E5E5]"}`} />)}</div></div><span className="font-mono text-[11px] tracking-[0.1em] text-[#666666]">{String(completed).padStart(2, "0")} / 02</span></div><div className="mt-5 overflow-hidden rounded-[12px] border border-[#E5E5E5] bg-white">{row("microphone", "01", "Microphone access")}{row("camera", "02", "Camera access")}</div><button type="button" disabled={!ready} onClick={handleStartInterview} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1A1A1A] px-5 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#666666]"><Mic size={16} aria-hidden="true" /> Start interview</button><p aria-live="polite" className={`mt-3 text-center text-[13px] ${ready ? "text-[#15803D]" : "text-[#666666]"}`}>{hint}</p></section><aside className="space-y-5"><div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#1E1E1E]">{cameraPermission === "done" && <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" />}{cameraPermission !== "done" && <div className="absolute inset-0 flex flex-col items-center justify-center"><p className="text-5xl font-extrabold text-white">D<span className="text-[#EB3A14]">.</span></p><p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white/70">{cameraPermission === "blocked" ? "Camera blocked" : "Camera is off"}</p></div>}<div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[12px] font-semibold"><span className={`h-2 w-2 rounded-full ${cameraPermission === "done" ? "bg-[#22C55E]" : cameraPermission === "blocked" ? "bg-[#EB3A14]" : "bg-[#666666]"}`} />Camera preview</div></div><div className="rounded-[12px] border border-[#E5E5E5] bg-white p-5"><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#666666]">Mic level \u00b7 {microphonePermission === "done" ? "say hello" : "off"}</p><div className="mt-5 flex h-10 items-end gap-1">{Array.from({ length: 12 }, (_, i) => <span key={i} className={`flex-1 rounded-sm ${microphonePermission === "done" && micLevel > i / 12 ? "bg-[#EB3A14]" : "bg-[#E5E5E5]"}`} style={{ height: `${35 + (i % 4) * 15}%` }} />)}</div></div><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#666666]">Tip \u00b7 Find a quiet space and keep your face well lit.</p></aside></main></div>;
  }
  // ── DONE SCREEN ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] flex flex-col items-center justify-center px-6 relative overflow-hidden antialiased font-sans">
        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full py-12">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold tracking-tight mb-8">
            <Image
              src="/devprep-logo.png"
              alt="DevPrep logo"
              width={26}
              height={26}
              unoptimized
              className="rounded-sm"
            />
            <span className="text-[15px] font-bold text-[#1A1A1A] tracking-[-0.01em]">
              DevPrep
            </span>
          </div>

          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5 shadow-sm">
            <CheckCircle2 size={24} className="text-[#22C55E]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[#1A1A1A] mb-1.5">
            Interview complete!
          </h2>
          <p className="text-sm text-[#666666]">
            {answered.size} of {data.questions.length} questions answered in{" "}
            <span className="text-[#1A1A1A] font-semibold">{formatTime(elapsed)}</span>.
          </p>

          <div className="mt-7 w-full bg-white border border-[#E5E5E5] rounded-2xl p-5 text-left shadow-sm">
            <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-[0.08em] mb-3">
              Questions covered
            </p>
            <div className="space-y-2.5">
              {data.questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2
                    size={13}
                    className={`mt-0.5 flex-shrink-0 ${
                      answered.has(i) ? "text-[#22C55E]" : "text-[#666666]/30"
                    }`}
                  />
                  <span className="text-[#1A1A1A] font-normal line-clamp-1">{q}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3 w-full">
            <button
              onClick={() => router.push("/dashboard/ai-interview")}
              className="flex-1 py-3.5 rounded-full border border-[#E5E5E5] bg-white text-[14px] font-semibold text-[#666666] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-all cursor-pointer shadow-xs"
            >
              Back to roles
            </button>
            <button
              onClick={() => {
                setPhase("setup");
                setCurrentQ(0);
                setAnswered(new Set());
                setElapsed(0);
              }}
              className="flex-1 py-3.5 rounded-full bg-[#1A1A1A] hover:bg-black text-white text-[14px] font-semibold active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE INTERVIEW ──────────────────────────────────────────────────────────
  const topicTabs = data.skills.slice(0, 3);
  const currentQuestionText =
    data.questions[currentQ] ??
    data.firstQuestion ??
    "Can you walk me through your technical background and a recent project you built?";

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] overflow-hidden relative flex flex-col antialiased font-sans">
      {/* ── TOP NAV (Clean Light Theme) ── */}
      <div className="flex items-center justify-between px-8 pt-4 pb-3.5 border-b border-[#E5E5E5] relative z-10 flex-shrink-0 bg-white shadow-xs">
        {/* Logo + role */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <Image
              src="/devprep-logo.png"
              alt="DevPrep logo"
              width={22}
              height={22}
              unoptimized
              className="rounded-sm"
            />
            <span className="text-sm font-bold text-[#1A1A1A] tracking-[-0.01em]">
              DevPrep
            </span>
          </div>
          <div className="h-4 w-px bg-[#E5E5E5]" />
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span className="text-[#666666] font-medium">{data.title}</span>
          </div>
        </div>

        {/* Progress tabs with #EB3A14 accent color */}
        <div className="hidden md:flex gap-6">
          {topicTabs.map((item, i) => (
            <div key={i}>
              <p className="text-xs text-[#666666] font-medium mb-1.5 truncate max-w-[140px]">
                {item}
              </p>
              <div className="w-28 h-1 rounded-full bg-[#E5E5E5] overflow-hidden">
                {i < currentQ && <div className="w-full h-full bg-[#EB3A14]" />}
                {i === Math.min(currentQ, topicTabs.length - 1) && (
                  <motion.div
                    className="h-full bg-[#EB3A14] rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: isRecording ? "75%" : "30%" }}
                    transition={{ duration: 0.6, ease: EASE }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timer */}
        <div className="border border-[#E5E5E5] bg-[#F5F5F7] rounded-xl px-3.5 py-1.5 flex items-center gap-2">
          <Clock3 size={13} className="text-[#666666]" />
          <span className="text-xs font-semibold text-[#1A1A1A] tracking-wide">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* ── MAIN 2-COL (Light Cards) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 pt-6 pb-6 relative z-10 flex-1 min-h-0 items-start overflow-hidden max-w-6xl mx-auto w-full">
        {/* LEFT – camera */}
        <div className="flex flex-col gap-4 h-full min-h-0 w-full max-w-md mx-auto lg:max-w-none">
          {/* Mic bar matching design system card specs */}
          <div className="border border-[#E5E5E5] rounded-xl bg-white px-4.5 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <Mic size={14} className={!isMuted ? "text-[#EB3A14]" : "text-rose-500"} />
              <p className="text-xs font-semibold text-[#1A1A1A]">
                {!isMuted ? "Mic active" : "Mic muted"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMute}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {!isMuted ? (
                  <Mic size={14} className="text-[#666666]" />
                ) : (
                  <MicOff size={14} className="text-rose-500" />
                )}
              </button>
              {!isMuted && (
                <div className="flex gap-[3px] items-end h-4">
                  {[6, 12, 8, 14, 10, 12].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height:
                          vadState === "speaking"
                            ? [h, Math.min(22, h + 15 * speechEnergy), h]
                            : [h, h + 2, h],
                      }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                      className="w-[3px] rounded-full bg-[#EB3A14]"
                      style={{ height: h }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={toggleCam}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <ChevronDown size={14} className="text-[#666666]" />
              </button>
            </div>
          </div>

          {/* Camera feed / preview placeholder state per design.md tokens */}
          <div className="w-full h-[280px] rounded-2xl border border-[#E5E5E5] overflow-hidden bg-white relative flex-shrink-0 shadow-xs flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${
                camOn && !camError && !camLoading ? "opacity-95" : "opacity-0 absolute"
              }`}
            />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-[#E5E5E5] rounded-full px-3 py-1 flex items-center gap-2 z-10 shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${camOn && !camError && !camLoading ? "bg-[#22C55E]" : "bg-[#666666]/50"}`} />
              <span className="text-[11px] font-semibold text-[#1A1A1A]">
                Camera preview
              </span>
            </div>
            {(!camOn || camError || camLoading) && (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#666666]">
                  <UserRound size={28} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A]">
                    {camLoading ? "Starting camera…" : "Camera is off"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 flex-shrink-0 px-1 mt-auto">
            <div
              className={`w-2 h-2 rounded-full ${camError ? "bg-amber-500" : "bg-[#22C55E]"}`}
            />
            <p className="text-[#666666] text-xs font-medium">
              {camError
                ? "Camera denied — audio interview mode active"
                : "Camera and microphone connected"}
            </p>
          </div>
        </div>

        {/* RIGHT – chat panel */}
        <div className="flex flex-col w-full max-w-md mx-auto lg:max-w-none lg:h-[calc(100dvh-230px)] h-[520px] min-h-[420px]">
          <div className="w-full flex-1 min-h-0 rounded-2xl bg-transparent overflow-hidden flex flex-col">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#EFEFF2] bg-white flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#F5F5F7] border border-[#E5E5E5] flex items-center justify-center">
                <span className="text-sm font-extrabold text-[#1A1A1A]">
                  D<span className="text-[#EB3A14]">.</span>
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">
                  DevPrep Interviewer
                </p>
                <p className="text-[11px] text-[#22C55E] font-medium">
                  {aiSpeaking ? "Speaking to you…" : "Listening to your response…"}
                </p>
              </div>
            </div>

            {/* Message list */}
            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="flex-1 min-h-0 overflow-y-auto px-4 pt-5 pb-4 space-y-3"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#D1D5DB transparent",
              }}
            >
              {/* Initial interviewer question */}
              {chatMessages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white border border-[#E5E5E5] px-3.5 py-2.5 text-xs text-[#1A1A1A]">
                    {currentQuestionText}
                    <span className="block text-[10px] text-[#666666] mt-1">
                      {getTimestamp()}
                    </span>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-[#EB3A14] text-white"
                        : "rounded-tl-sm bg-white border border-[#E5E5E5] text-[#1A1A1A]"
                    }`}
                  >
                    {message.text}
                    <span
                      className={`block text-[10px] mt-1 ${
                        message.role === "user"
                          ? "text-white/75"
                          : "text-[#666666]"
                      }`}
                    >
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator while user is speaking */}
              {userIsSpeaking && !transcript && (
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-[#EB3A14] px-3.5 py-3 flex gap-1 items-center">
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
            </div>
          </div>

          {/* Error message */}
          {(error || realtimeError) && (
            <div className="flex-shrink-0 w-full max-w-lg mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs text-rose-600 font-medium">
                {error || realtimeError}
              </p>
            </div>
          )}

          {/* Question counter */}
          <p className="flex-shrink-0 mt-4 text-xs text-[#666666] font-medium">
            Question {currentQ + 1} of {totalQuestions}
          </p>
        </div>
      </div>

      {/* ── ANCHORED BOTTOM SESSION CONTROLS BAR (Light Theme) ── */}
      <div className="border-t border-[#E5E5E5] bg-white px-8 py-3.5 flex items-center justify-between relative z-20 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <span className="text-xs font-medium text-[#666666]">
            Live session · {data.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              alert(
                "Troubleshooting Tip: Make sure your microphone permission is granted in the browser address bar. If audio stops, you can refresh the page safely."
              )
            }
            className="px-4 py-2 rounded-full border border-[#E5E5E5] bg-white hover:bg-[#F5F5F7] transition-all text-xs font-semibold text-[#666666] hover:text-[#1A1A1A] flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <AlertOctagon size={14} className="text-[#666666]" />
            <span>Having trouble?</span>
          </button>
          <button
            onClick={endInterview}
            className="px-4.5 py-2 rounded-full border border-[#E5E5E5] bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all text-xs font-semibold text-[#1A1A1A] flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <PhoneOff size={14} />
            <span>End interview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
