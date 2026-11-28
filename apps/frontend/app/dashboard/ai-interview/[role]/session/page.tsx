"use client";

import { useState, useEffect, useRef, useCallback, type MutableRefObject, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Camera, CameraOff, Check, CircleAlert, CircleHelp, Headphones, Mic, MicOff, PhoneOff, RotateCcw, Timer, Volume2 } from "lucide-react";
import type { RoleData } from "../../data";
import { useRealtimeVoice, type TurnData } from "@/hooks/useRealtimeVoice";
import Link from "next/link";
import { levelLabel } from "@/lib/interview/report";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LogoTile } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SessionData = RoleData & {
  sessionId?: number;
  firstQuestion?: string;
  totalQuestions?: number;
  candidateName?: string | null;
  /** Level chosen on the role page; sent to the voice pipeline as "difficulty". */
  level?: string;
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
  const currentQRef = useRef(0);
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

  const handleTurnComplete = useCallback(
    (turnData: TurnData) => {
      if (turnData?.nextQuestion) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: [...prev.questions, turnData.nextQuestion!],
          };
        });
      }
      // Side effects stay out of the state updater (React may run updaters twice).
      const q = currentQRef.current;
      const nextQ = q + 1;
      currentQRef.current = nextQ;
      setCurrentQ(nextQ);
      setAnswered((prev) => new Set([...prev, q]));
      if (turnData?.isComplete || nextQ >= totalQuestions) {
        endRealtimeInterviewRef.current();
        setPhase("done");
      }
    },
    [totalQuestions],
  );

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
    onTurnComplete: handleTurnComplete,
    onError: handleError,
  });

  useEffect(() => {
    endRealtimeInterviewRef.current = endRealtimeInterview;
  }, [endRealtimeInterview]);

  // aiSpeaking drives the avatar pulsing animation
  const aiSpeaking = isAiResponding || isTtsSpeaking;
  const userIsSpeaking = vadState === "speaking" || vadState === "silence_detecting";

  const getTimestamp = () => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());

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
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
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
      ? slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
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
        difficulty: data?.level ?? "medium",
        firstQuestion: data?.firstQuestion,
      });
    } catch (err: unknown) {
      console.error("[InterviewSession] Failed to start voice session:", err);
      setError("Couldn't start the interview. Check your connection and microphone, then reload the page.");
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
      errorName === "NotFoundError" ? `No ${label} found` : "Click the lock icon in your address bar, set " + `${kind === "camera" ? "Camera" : "Microphone"} to Allow, then press Try again.`;
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
      const stream = await navigator.mediaDevices.getUserMedia(kind === "camera" ? { video: true } : { audio: true });
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
    // Ending early still gets a report for the questions answered so far.
    if (answered.size > 0) setPhase("done");
    else router.push(`/dashboard/ai-interview/${slug}`);
  };


  const levelText = data?.level ? levelLabel(data.level) : null;
  const rolePage = `/dashboard/ai-interview/${slug}`;

  if (!data) {
    return (
      <Room>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center" role="status">
          <ZaraOrb speaking size={96} />
          <p className="m-0 text-[15px] font-medium text-white">Zara is preparing your first question…</p>
        </div>
      </Room>
    );
  }

  // ── SETUP (READY CHECK) ──────────────────────────────────────────────────────
  if (phase === "setup") {
    const count = data.totalQuestions ?? totalQuestions;
    const micReady = microphonePermission === "done";
    const completed = [microphonePermission, cameraPermission].filter((s) => s === "done").length;
    const hint = micReady ? "Say something to check the level, then start" : microphonePermission === "blocked" ? "Fix microphone access to continue" : "Allow your microphone to continue";
    const cameraLiveSetup = cameraPermission === "done" && camOn && !camError;
    const segments = 32;
    const lit = Math.round(micLevel * segments);

    const row = (kind: PermissionKind, label: string, note: string) => {
      const state = kind === "camera" ? cameraPermission : microphonePermission;
      const message = permissionMessage[kind];
      const Icon = kind === "camera" ? Camera : Mic;
      return (
        <li className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
          <div className="flex items-center gap-3">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", state === "done" ? "bg-[#34d399]/12 text-[#6ee7b7]" : state === "blocked" ? "bg-[#f87171]/12 text-[#fca5a5]" : "bg-white/[0.06] text-white/70")}>
              <Icon className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[14px] font-semibold tracking-[-0.015em] text-white">{label}</p>
              <p className="m-0 mt-0.5 text-[12.5px] text-white/45">{note}</p>
            </div>
            {state === "done" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34d399]/10 px-2.5 py-1 text-[12px] font-medium text-[#6ee7b7]">
                <Check className="size-3.5" aria-hidden="true" /> Allowed
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => requestPermission(kind)} className="h-8 border-white/[0.12] bg-white/[0.03] text-[12.5px]">
                {state === "blocked" ? "Try again" : `Allow ${kind}`}
              </Button>
            )}
          </div>
          {state === "blocked" && message ? (
            <p role="alert" className="m-0 mt-3 rounded-lg bg-[#f87171]/[0.07] px-3 py-2 text-[12.5px] text-[#fecaca]">
              {message}
            </p>
          ) : null}
        </li>
      );
    };

    return (
      <Room>
        <RoomHeader>
          <Link href={rolePage} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
            <ArrowLeft className="size-3.5" /> Back to role
          </Link>
        </RoomHeader>
        <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10 lg:pt-14">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <div className="flex flex-wrap gap-1.5">
              {[data.title, levelText, `Intro + ${count} questions`, `~${data.duration} min`].filter(Boolean).map((t) => (
                <span key={t} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[12px] text-white/60">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="m-0 mt-5 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-[44px]">
              Ready for your <span className="fx-accent">interview?</span>
            </h1>
            <p className="m-0 mt-3 max-w-[440px] text-[15px] leading-[1.55] text-white/55">Check your microphone first. The camera is optional and only shown to you.</p>

            <div className="mt-8 flex items-center justify-between text-[12.5px]">
              <span className="font-medium text-white/60">Before you start</span>
              <span className="tabular-nums text-white/40">{completed} of 2 ready</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#4d7cff,#a78bfa)]" animate={{ width: `${(completed / 2) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
            </div>
            <ul className="m-0 mt-4 grid list-none gap-2.5 p-0">
              {row("microphone", "Microphone", "Required. Zara listens and replies by voice.")}
              {row("camera", "Camera", "Optional. Never recorded or sent.")}
            </ul>

            <button
              type="button"
              disabled={!micReady}
              onClick={handleStartInterview}
              className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-[14.5px] font-semibold tracking-[-0.02em] text-black shadow-[0_10px_30px_-12px_rgba(255,255,255,0.5)] transition-[background-color,transform] hover:bg-white/90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/35 disabled:shadow-none"
            >
              <Mic className="size-4" aria-hidden="true" /> Start interview
            </button>
            <p aria-live="polite" className="m-0 mt-2.5 text-center text-[12.5px] text-white/45">
              {hint}
            </p>
          </motion.section>

          <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08, ease: EASE }} className="grid content-start gap-3">
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b0b0e]">
              <ViewfinderCorners />
              {cameraPermission === "done" && (
                <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${cameraLiveSetup ? "opacity-100" : "opacity-0"}`} />
              )}
              {!cameraLiveSetup && (
                <div className="text-center text-[13.5px] text-white/45">
                  <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-white/[0.04]">
                    <Camera className="size-6 text-white/40" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  {cameraPermission === "blocked" ? "Camera blocked" : "Camera is off"}
                </div>
              )}
              <span className="absolute bottom-3.5 left-3.5 flex h-8 items-center gap-2 rounded-full bg-black/60 px-3 text-[12px] text-white/80 backdrop-blur">
                <span className={`size-2 rounded-full ${cameraLiveSetup ? "bg-[#34d399]" : "bg-white/30"}`} />
                Camera preview
              </span>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0e] px-4 py-3.5">
              <div className="mb-2.5 flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-1.5 font-medium text-white/60">
                  <Mic className="size-3.5" /> Mic level
                </span>
                <span className="text-white/40">{micReady ? "Say hello" : "Off"}</span>
              </div>
              <div
                className="grid h-5 grid-cols-[repeat(32,minmax(0,1fr))] gap-[3px]"
                role="meter"
                aria-label="Microphone level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(micLevel * 100)}
              >
                {Array.from({ length: segments }, (_, i) => (
                  <span
                    key={i}
                    className="rounded-[3px] transition-colors duration-75"
                    style={{ background: micReady && i < lit ? (i > segments * 0.8 ? "#fbbf24" : i > segments * 0.5 ? "#a78bfa" : "#4d7cff") : "rgba(255,255,255,0.07)" }}
                  />
                ))}
              </div>
            </div>
            <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
              {[
                { icon: Headphones, text: "Headphones stop Zara's voice reaching your mic." },
                { icon: Timer, text: "Pause for about a second when you finish an answer." },
              ].map((tip) => (
                <li key={tip.text} className="flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-[12.5px] leading-[1.45] text-white/55">
                  <tip.icon className="mt-0.5 size-3.5 shrink-0 text-white/45" />
                  {tip.text}
                </li>
              ))}
            </ul>
          </motion.aside>
        </main>
      </Room>
    );
  }

  // ── DONE SCREEN ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    const asked = data.questions.length;
    return (
      <Room>
        <RoomHeader>
          <Link href="/dashboard/ai-interview" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
            Back to roles
          </Link>
        </RoomHeader>
        <main className="mx-auto w-full max-w-[720px] px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="text-center">
            <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-[#34d399]/12 text-[#6ee7b7] shadow-[0_0_60px_-10px_rgba(52,211,153,0.6)]">
              <Check className="size-7" />
            </span>
            <p className="m-0 mt-6 text-[12.5px] text-white/45">
              {data.title}
              {levelText ? ` · ${levelText}` : ""} · Today
            </p>
            <h1 className="m-0 mt-2 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-[44px]">
              Interview <span className="fx-accent">complete</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[480px] text-[15px] leading-[1.55] text-white/55">Open your report for a score on every answer, what was missing, and a stronger version you can retry.</p>
          </motion.div>

          <motion.dl initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08, ease: EASE }} className="m-0 mt-9 grid grid-cols-3 gap-2.5">
            {[
              [`${answered.size}/${asked}`, "Answered"],
              [formatTime(elapsed), "Time"],
              [levelText ?? "—", "Level"],
            ].map(([v, l]) => (
              <div key={l} className="flex flex-col-reverse rounded-2xl border border-white/[0.07] bg-card px-4 py-3.5">
                <dt className="text-[12px] text-white/45">{l}</dt>
                <dd className="m-0 text-[22px] font-semibold tracking-[-0.04em] tabular-nums text-white">{v}</dd>
              </div>
            ))}
          </motion.dl>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.14, ease: EASE }} className="mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-card">
            <h2 className="m-0 border-b border-white/[0.06] px-5 py-3.5 text-[14px] font-semibold tracking-[-0.015em] text-white">Questions covered</h2>
            <ol className="m-0 list-none divide-y divide-white/[0.05] p-0">
              {data.questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3 text-[13.5px] leading-[1.5] text-white/80">
                  <span className="mt-0.5 grid h-5 min-w-7 place-items-center rounded-md bg-white/[0.05] px-1 text-[11px] font-medium tabular-nums text-white/50">{i ? `Q${i}` : "Intro"}</span>
                  <span className="flex-1">{q}</span>
                  {answered.has(i) ? <Check className="mt-1 size-3.5 shrink-0 text-[#6ee7b7]" aria-label="Answered" /> : <span className="shrink-0 text-[12px] text-white/30">Skipped</span>}
                </li>
              ))}
            </ol>
          </motion.section>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Link
              href={data.sessionId ? `/dashboard/reports/${data.sessionId}` : "/dashboard/reports"}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-semibold text-black transition-colors hover:bg-white/90"
            >
              View your report <ArrowRight className="size-4" />
            </Link>
            <Link href={rolePage} className="inline-flex h-11 items-center rounded-xl border border-white/[0.12] bg-white/[0.03] px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.07]">
              Start a new interview
            </Link>
          </div>
        </main>
      </Room>
    );
  }

  // ── ACTIVE INTERVIEW ──────────────────────────────────────────────────────────
  const currentQuestionText = data.questions[currentQ] ?? data.firstQuestion ?? "Can you walk me through your technical background and a recent project you built?";
  const isThinking = vadState === "processing";
  const status = aiSpeaking
    ? { label: "Zara is speaking", tone: "text-[#c4b5fd]", dot: "bg-[#a78bfa]" }
    : isThinking
      ? { label: "Thinking…", tone: "text-[#fcd34d]", dot: "bg-[#fbbf24]" }
      : userIsSpeaking
        ? { label: "Listening to you", tone: "text-[#6ee7b7]", dot: "bg-[#34d399]" }
        : { label: "Your turn, go ahead", tone: "text-white/70", dot: "bg-white/50" };
  const cameraLive = camOn && !camError && !camLoading && cameraPermission === "done";
  const level = isMuted ? 0 : userIsSpeaking ? Math.max(0.35, speechEnergy) : 0.12;
  const steps = totalQuestions + 1; // intro + questions
  const cameraNote = cameraPermission !== "done" ? "Camera off" : camError ? "Audio only" : camLoading ? "Starting…" : "Camera off";
  const switchCamera = () => {
    if (cameraPermission === "done") toggleCam();
    else void requestPermission("camera");
  };

  return (
    <TooltipProvider>
      <Room className="h-[100dvh] overflow-hidden">
        <div className="flex h-full flex-col">
          {/* ── TOP BAR ── */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-black/20 px-3 backdrop-blur-xl sm:px-5">
            <LogoTile />
            <div className="min-w-0">
              <p className="m-0 truncate text-[13.5px] font-semibold tracking-[-0.015em] text-white">{data.title}</p>
              <p className="m-0 truncate text-[11.5px] text-white/40">{[levelText, "Voice interview"].filter(Boolean).join(" · ")}</p>
            </div>

            <div className="mx-auto hidden min-w-0 flex-1 flex-col items-center gap-1.5 px-6 md:flex" aria-label="Progress">
              <span className="text-[12px] text-white/55">{currentQ === 0 ? "Introduction" : `Question ${Math.min(currentQ, totalQuestions)} of ${totalQuestions}`}</span>
              <div className="flex w-full max-w-[360px] gap-1">
                {Array.from({ length: steps }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-500",
                      answered.has(i) ? "bg-[#4d7cff]" : i === currentQ ? "bg-white/60" : "bg-white/[0.1]",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <div className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5" role="timer" aria-label="Elapsed time">
                <span className="size-1.5 animate-pulse rounded-full bg-[#f87171]" />
                <span className="text-[13px] font-semibold tabular-nums text-white">{formatTime(elapsed)}</span>
              </div>
              <Popover open={helpOpen} onOpenChange={setHelpOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[12.5px] text-white/65">
                    <CircleHelp /> <span className="hidden sm:inline">Having a problem?</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-[320px] rounded-2xl border-white/10 bg-popover p-4">
                  <p className="m-0 mb-2.5 text-[13.5px] font-semibold text-white">Troubleshooting</p>
                  <ul className="m-0 grid list-none gap-2 p-0 text-[12.5px] leading-[1.5] text-white/70">
                    <li className="flex gap-2">
                      <Mic className="mt-0.5 size-3.5 shrink-0 text-white/40" /> Allow microphone access from the lock icon in your address bar.
                    </li>
                    <li className="flex gap-2">
                      <Timer className="mt-0.5 size-3.5 shrink-0 text-white/40" /> Pause for about a second when you finish. Zara replies once you stop speaking.
                    </li>
                    <li className="flex gap-2">
                      <Headphones className="mt-0.5 size-3.5 shrink-0 text-white/40" /> Use headphones if Zara&apos;s voice is being picked up by your mic.
                    </li>
                  </ul>
                  <Button variant="outline" size="sm" className="mt-3.5 h-8 w-full border-white/10 text-[12.5px]" onClick={() => window.location.reload()}>
                    <RotateCcw className="size-3.5" /> Reload session
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* ── MAIN ── */}
          <main className="grid min-h-0 flex-1 grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)] gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-1">
            {/* STAGE */}
            <section aria-label="Zara" className="fx-grain relative flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-[#09090c]">
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="fx-grid absolute inset-0 opacity-50" />
                <motion.div
                  className="absolute left-1/2 top-[42%] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
                  animate={{ opacity: aiSpeaking ? 0.55 : userIsSpeaking ? 0.35 : 0.22, background: userIsSpeaking ? "#34d399" : "#6b5cff" }}
                  transition={{ duration: 0.8 }}
                />
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 pt-6">
                <ZaraOrb speaking={aiSpeaking} thinking={isThinking} size={136} />
                <div className="flex flex-col items-center gap-2">
                  <p className="m-0 text-[14px] font-semibold text-white">Zara · AI interviewer</p>
                  <span aria-live="polite" className={cn("inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/40 px-3 py-1 text-[12.5px] font-medium backdrop-blur", status.tone)}>
                    <span className={cn("size-1.5 rounded-full", status.dot, (aiSpeaking || userIsSpeaking) && "animate-pulse")} />
                    {status.label}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentQuestionText}
                    initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="m-0 hidden max-w-[640px] text-center text-[18px] font-medium leading-[1.45] tracking-[-0.02em] text-white/90 sm:block lg:text-[21px]"
                  >
                    {currentQuestionText}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* camera + controls */}
              <div className="relative flex items-end justify-between gap-3 p-3 sm:p-4">
                <div className="relative h-[96px] w-[150px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111114] sm:h-[128px] sm:w-[200px]">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover transition-opacity duration-300 ${cameraLive ? "opacity-100" : "opacity-0"}`}
                  />
                  {!cameraLive && (
                    <div className="absolute inset-0 grid place-items-center text-center text-[11.5px] text-white/40">
                      <span>
                        <CameraOff className="mx-auto mb-1.5 size-5" strokeWidth={1.5} />
                        {cameraNote}
                      </span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10.5px] text-white/85 backdrop-blur">
                    You
                    <span className="flex h-2.5 items-end gap-[2px]" aria-hidden>
                      {[0.25, 0.5, 0.75, 1].map((t) => (
                        <span key={t} className={cn("w-[2px] rounded-full", level >= t * 0.9 ? "bg-[#34d399]" : "bg-white/25")} style={{ height: `${t * 100}%` }} />
                      ))}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/50 p-1.5 backdrop-blur-xl">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                        className={cn("size-10 rounded-xl", isMuted ? "bg-[#f87171]/15 text-[#fca5a5] hover:bg-[#f87171]/25" : "bg-white/[0.06] hover:bg-white/[0.12]")}
                      >
                        {isMuted ? <MicOff /> : <Mic />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={switchCamera} aria-label={cameraLive ? "Turn camera off" : "Turn camera on"} className="size-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12]">
                        {cameraLive ? <Camera /> : <CameraOff />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{cameraLive ? "Turn camera off" : "Turn camera on"}</TooltipContent>
                  </Tooltip>
                  <Button onClick={endInterview} className="h-10 rounded-xl bg-[#ef4444] px-4 text-[13px] font-semibold text-white hover:bg-[#dc2626] active:scale-[0.97]">
                    <PhoneOff /> <span className="hidden sm:inline">End interview</span>
                  </Button>
                </div>
                <span className="hidden w-[200px] sm:block" aria-hidden />
              </div>
            </section>

            {/* TRANSCRIPT */}
            <section aria-label="Conversation with Zara" className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-card">
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
                <span className="text-[13.5px] font-semibold tracking-[-0.015em] text-white">Transcript</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f87171]/10 px-2 py-0.5 text-[11px] font-medium text-[#fca5a5]">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#f87171]" /> Live
                </span>
              </div>
              <div
                ref={chatScrollRef}
                onScroll={handleChatScroll}
                className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4 [mask-image:linear-gradient(to_bottom,transparent,#000_12px,#000_94%,transparent)]"
              >
                {chatMessages.length === 0 && <AiMessage text={currentQuestionText} timestamp={getTimestamp()} />}
                {chatMessages.map((message) =>
                  message.role === "user" ? (
                    <UserMessage key={message.id} text={message.text} timestamp={message.timestamp} />
                  ) : (
                    <AiMessage key={message.id} text={message.text} timestamp={message.timestamp} />
                  ),
                )}
                {userIsSpeaking && !transcript && (
                  <div className="flex justify-end">
                    <div className="flex items-center gap-[3px] rounded-2xl rounded-br-md bg-[#4d7cff] px-4 py-3" aria-label="You are speaking">
                      {Array.from({ length: 9 }, (_, i) => (
                        <span key={i} className="w-[3px] origin-center rounded-full bg-white" style={{ height: 14, animation: `fx-wave ${0.6 + (i % 4) * 0.12}s ease-in-out ${-i * 0.08}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                {isThinking && (
                  <div className="flex items-center gap-2 text-[12px] text-white/45" aria-label="Zara is thinking">
                    <ZaraDot />
                    <span className="flex gap-1">
                      {[0, 1, 2].map((dot) => (
                        <motion.span key={dot} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.9, delay: dot * 0.15 }} className="size-1.5 rounded-full bg-[#c4b5fd]" />
                      ))}
                    </span>
                  </div>
                )}
              </div>

              {(error || realtimeError) && (
                <Alert variant="destructive" className="m-3 mt-0 w-auto shrink-0 rounded-xl border-[#f87171]/25 bg-[#f87171]/[0.07] py-2.5 text-[12.5px]">
                  <CircleAlert />
                  <AlertDescription className="text-[#fecaca]">{error || realtimeError}</AlertDescription>
                </Alert>
              )}
              <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[11.5px] text-white/40">
                <Volume2 className="size-3.5" /> Hands-free: Zara replies when you pause for about a second.
              </div>
            </section>
          </main>
        </div>
      </Room>
    </TooltipProvider>
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Full-screen dark canvas with a soft aurora, shared by every phase of the room. */
function Room({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-theme="dark" data-app className={cn("relative isolate min-h-dvh bg-[#050506] font-sans text-foreground antialiased", className)}>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[560px] rounded-full bg-[#4d7cff]/[0.12] blur-[120px]" />
        <div className="absolute -right-40 top-1/3 size-[520px] rounded-full bg-[#a78bfa]/[0.1] blur-[120px]" />
      </div>
      {children}
    </div>
  );
}

function RoomHeader({ children }: { children: ReactNode }) {
  return (
    <header className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-4 sm:px-6">
      <Link href="/dashboard" aria-label="DevPrep overview" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em] text-white">
        <LogoTile /> DevPrep
      </Link>
      {children}
    </header>
  );
}

/** Zara's presence: a glossy orb that pulses while she speaks and spins a ring while thinking. */
function ZaraOrb({ speaking = false, thinking = false, size = 120 }: { speaking?: boolean; thinking?: boolean; size?: number }) {
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {speaking &&
        [0, 1].map((i) => (
          <span key={i} className="absolute inset-0 rounded-full border border-[#a5b4fc]/40" style={{ animation: `fx-pulse-ring 2.2s cubic-bezier(0.16,1,0.3,1) ${i * 1.1}s infinite` }} />
        ))}
      {thinking && (
        <span
          className="absolute inset-[-8px] rounded-full border-2 border-transparent border-t-[#c4b5fd]/70"
          style={{ animation: "fx-spin-slow 1.2s linear infinite" }}
        />
      )}
      <motion.span
        className="relative size-full rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#c9d6ff_14%,#7f8cff_38%,#6a3dd8_68%,#1b0f3a_100%)] shadow-[inset_0_-14px_34px_rgba(10,0,40,0.6),0_24px_70px_-12px_rgba(110,90,255,0.7)]"
        animate={speaking ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={speaking ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
      />
    </div>
  );
}

function ZaraDot() {
  return <span className="size-5 shrink-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff,#c9d6ff_16%,#7f8cff_42%,#6a3dd8_75%)]" />;
}

function ViewfinderCorners() {
  const c = "absolute h-[18px] w-[18px] border-white/30";
  return (
    <span aria-hidden="true">
      <span className={`${c} left-4 top-4 rounded-tl-md border-l border-t`} />
      <span className={`${c} right-4 top-4 rounded-tr-md border-r border-t`} />
      <span className={`${c} bottom-4 left-4 rounded-bl-md border-b border-l`} />
      <span className={`${c} bottom-4 right-4 rounded-br-md border-b border-r`} />
    </span>
  );
}

function AiMessage({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="flex max-w-[92%] gap-2.5">
      <ZaraDot />
      <div className="min-w-0">
        <div className="rounded-2xl rounded-tl-md bg-white/[0.05] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-white/90">{text}</div>
        <p className="m-0 mt-1 pl-1 text-[11px] text-white/35">Zara · {timestamp}</p>
      </div>
    </div>
  );
}

function UserMessage({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[88%] rounded-2xl rounded-br-md bg-[#4d7cff] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-white">{text}</div>
      <p className="m-0 mt-1 pr-1 text-[11px] text-white/35">You · {timestamp}</p>
    </div>
  );
}
