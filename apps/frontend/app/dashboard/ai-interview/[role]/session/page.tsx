"use client";

import { useState, useEffect, useRef, useCallback, type MutableRefObject } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Camera, CameraOff, Check, ChevronDown, CircleAlert, Clock3, Mic, MicOff, RotateCcw } from "lucide-react";
import type { RoleData } from "../../data";
import { useRealtimeVoice, type TurnData } from "@/hooks/useRealtimeVoice";
import Link from "next/link";
import { serif } from "@/lib/fonts";
import { levelLabel } from "@/lib/interview/report";
import { SpaceBackdrop } from "@/components/interviews/SpaceBackdrop";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [stage, setStage] = useState<{ zoom: number; height: number; pad: number } | null>(null);

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

  // Fit the desktop layout to the window (see STAGE_W). null on narrow screens = fluid layout.
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 1024) return setStage(null);
      const zoom = Math.min(w / STAGE_W, h / STAGE_H, 1.6);
      // keep the buttons just above the horizon, which SpaceBackdrop sizes from the real window
      const horizon = Math.min(h * 0.145, 130);
      setStage({ zoom, height: h / zoom, pad: horizon / zoom + 10 });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

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

  const mono = { fontFamily: "var(--font-jbmono), ui-monospace, monospace" } as const;
  const levelText = data?.level ? levelLabel(data.level) : null;
  const rolePage = `/dashboard/ai-interview/${slug}`;

  if (!data) {
    return (
      <div className="relative isolate flex min-h-dvh items-center justify-center font-sans text-[#f0f0f0]">
        <SpaceBackdrop />
        <div className="flex flex-col items-center gap-4 px-6 text-center" role="status">
          <ZaraAvatar speaking />
          <p className="m-0 text-[15px] font-medium">Zara is preparing your first question…</p>
        </div>
      </div>
    );
  }

  // -- SETUP (READY SCREEN) --------------------------------------------------
  if (phase === "setup") {
    const count = data.totalQuestions ?? totalQuestions;
    const micReady = microphonePermission === "done";
    const completed = [microphonePermission, cameraPermission].filter((s) => s === "done").length;
    const hint = micReady ? "Say something to check the level, then start" : microphonePermission === "blocked" ? "Fix microphone access to continue" : "Allow your microphone to continue";
    const cameraLiveSetup = cameraPermission === "done" && camOn && !camError;
    const segments = 28;
    const lit = Math.round(micLevel * segments);

    const row = (kind: PermissionKind, step: string, label: string, note: string) => {
      const state = kind === "camera" ? cameraPermission : microphonePermission;
      const message = permissionMessage[kind];
      return (
        <li className="grid grid-cols-[36px_1fr_auto] items-center gap-y-2 border-b border-white/[0.08] py-4">
          <span className="text-[12px] tabular-nums text-white/30">{step}</span>
          <div>
            <p className="m-0 text-[15px] font-medium tracking-[-0.02em]">{label}</p>
            <p className="m-0 mt-0.5 text-[12.5px] text-white/45">{note}</p>
          </div>
          {state === "done" ? (
            <span className="flex items-center gap-1.5 text-[13px] text-[#9fe0b7]">
              <Check size={14} aria-hidden="true" /> Allowed
            </span>
          ) : (
            <button
              type="button"
              onClick={() => requestPermission(kind)}
              className="h-[34px] cursor-pointer rounded-[9px] px-3.5 text-[13px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a27ce9]"
            >
              {state === "blocked" ? "Try again" : `Allow ${kind}`}
            </button>
          )}
          {state === "blocked" && message ? (
            <p role="alert" className="col-start-2 col-end-4 m-0 text-[12.5px] text-[#ffb4b4]">
              {message}
            </p>
          ) : null}
        </li>
      );
    };

    return (
      <div className="relative isolate min-h-dvh font-sans text-[#f0f0f0] antialiased selection:bg-[#a27ce9]/30">
        <SpaceBackdrop fixed={false} />
        <header className="mx-auto flex max-w-[1444px] items-center justify-between px-5 pt-7 sm:px-8">
          <Logo />
          <Link href={rolePage} className="text-[13.5px] text-white/55 transition-colors hover:text-[#f0f0f0]">
            ← Back to role
          </Link>
        </header>
        <main className="mx-auto grid max-w-[1444px] gap-10 px-5 pb-[200px] pt-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pt-14">
          <section>
            <p className="m-0 flex flex-wrap gap-x-3.5 text-[12.5px] text-white/45">
              <span>{data.title}</span>
              <span>Intro + {count} questions</span>
              <span>~{data.duration} min</span>
              {levelText && <span>{levelText}</span>}
            </p>
            <h1 className="m-0 mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[46px]">
              Ready for your
              <br />
              <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>
                interview?
              </em>
            </h1>
            <p className="m-0 mt-4 max-w-[440px] text-[15.5px] leading-[1.55] text-white/56">Check your microphone first. The camera is optional and only shown to you.</p>
            <div className="mt-9">
              <div className="flex justify-between border-b border-white/[0.08] pb-2.5 text-[12.5px] text-white/45">
                <span>Before you start</span>
                <span className="tabular-nums">{completed} of 2 ready</span>
              </div>
              <ul className="m-0 list-none p-0">
                {row("microphone", "01", "Microphone", "Required. Zara listens and replies by voice.")}
                {row("camera", "02", "Camera", "Optional. Never recorded or sent.")}
              </ul>
            </div>
            <button
              type="button"
              disabled={!micReady}
              onClick={handleStartInterview}
              className="mt-6 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f0f0f0] text-[14px] font-bold uppercase tracking-[0.04em] text-[#0a0a0a] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a27ce9] disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/35"
              style={mono}
            >
              <Mic size={16} aria-hidden="true" /> Start interview
            </button>
            <p aria-live="polite" className="m-0 mt-2.5 text-center text-[12.5px] text-white/45">
              {hint}
            </p>
          </section>

          <aside>
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[16px] bg-[#0d0c11]/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <ViewfinderCorners />
              {cameraPermission === "done" && (
                <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${cameraLiveSetup ? "opacity-100" : "opacity-0"}`} />
              )}
              {!cameraLiveSetup && (
                <div className="text-center text-[13.5px] text-white/45">
                  <Camera size={30} strokeWidth={1.5} className="mx-auto mb-2.5 text-white/35" aria-hidden="true" />
                  {cameraPermission === "blocked" ? "Camera blocked" : "Camera is off"}
                </div>
              )}
              <span className="absolute bottom-3.5 left-3.5 flex h-8 items-center gap-2 rounded-full bg-[#0d0c11]/80 px-3 text-[12.5px] text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur-sm">
                <span className={`h-2 w-2 rounded-full ${cameraLiveSetup ? "bg-[#22e06b]" : "bg-white/30"}`} />
                Camera preview
              </span>
            </div>
            <div className="mt-3.5 rounded-[14px] bg-[#0d0c11]/80 px-4 py-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <div className="mb-2.5 flex justify-between text-[12.5px] text-white/45">
                <span>Mic level</span>
                <span>{micReady ? "Say hello" : "Off"}</span>
              </div>
              <div
                className="grid h-4 grid-cols-[repeat(28,minmax(0,1fr))] gap-[3px]"
                role="meter"
                aria-label="Microphone level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(micLevel * 100)}
              >
                {Array.from({ length: segments }, (_, i) => (
                  <span key={i} className={`rounded-[2px] ${micReady && i < lit ? "bg-[#a27ce9]" : "bg-white/[0.08]"}`} />
                ))}
              </div>
            </div>
            <p className="m-0 mt-3.5 text-[12.5px] text-white/42">Find a quiet space. Headphones stop Zara&rsquo;s voice from reaching your mic.</p>
          </aside>
        </main>
      </div>
    );
  }

  // ── DONE SCREEN ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    const asked = data.questions.length;
    return (
      <div className="relative isolate min-h-dvh font-sans text-[#f0f0f0] antialiased selection:bg-[#a27ce9]/30">
        <SpaceBackdrop fixed={false} />
        <header className="mx-auto flex max-w-[1444px] items-center justify-between px-5 pt-7 sm:px-8">
          <Logo />
          <Link href="/dashboard/ai-interview" className="text-[13.5px] text-white/55 transition-colors hover:text-[#f0f0f0]">
            Back to roles
          </Link>
        </header>
        <main className="mx-auto max-w-[720px] px-5 pb-[220px] pt-14 sm:px-8 sm:pt-20">
          <p className="m-0 flex flex-wrap gap-x-3.5 text-[12.5px] text-white/45">
            <span>{data.title}</span>
            {levelText && <span>{levelText}</span>}
            <span>Today</span>
          </p>
          <h1 className="m-0 mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[48px]">
            Interview{" "}
            <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>
              complete.
            </em>
          </h1>
          <p className="m-0 mt-4 max-w-[520px] text-[15.5px] leading-[1.55] text-white/56">Open your report for a score on every answer, what was missing, and a stronger version you can retry.</p>
          <dl className="m-0 mt-9 grid grid-cols-3 border-y border-white/[0.08]">
            {[
              [`${answered.size} / ${asked}`, "questions answered"],
              [formatTime(elapsed), "time"],
              [levelText ?? "—", "level"],
            ].map(([v, l], i) => (
              <div key={l} className={`flex flex-col-reverse py-4 ${i ? "border-l border-white/[0.08] pl-5" : ""}`}>
                <dt className="text-[12.5px] text-white/45">{l}</dt>
                <dd className="m-0 text-[24px] font-medium tracking-[-0.04em] tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-9">
            <h2 className="m-0 border-b border-white/[0.08] pb-2.5 text-[12.5px] font-normal text-white/45">Questions covered</h2>
            <ol className="m-0 list-none p-0">
              {data.questions.map((q, i) => (
                <li key={i} className="grid grid-cols-[36px_1fr_auto] items-start border-b border-white/[0.08] py-3 text-[14.5px] text-white/80">
                  <span className="pt-0.5 text-[12px] tabular-nums text-white/30">{i ? String(i).padStart(2, "0") : "In"}</span>
                  <span>{q}</span>
                  {answered.has(i) ? <Check size={14} className="mt-1 text-[#9fe0b7]" aria-label="Answered" /> : <span className="text-[12px] text-white/30">Skipped</span>}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <Link
              href={data.sessionId ? `/dashboard/reports/${data.sessionId}` : "/dashboard/reports"}
              className="inline-flex h-12 items-center rounded-full bg-[#f0f0f0] px-6 text-[14px] font-bold uppercase tracking-[0.04em] text-[#0a0a0a] transition-colors hover:bg-white"
              style={mono}
            >
              View your report →
            </Link>
            <Link
              href={rolePage}
              className="inline-flex h-12 items-center rounded-full px-6 text-[14px] font-bold uppercase tracking-[0.04em] text-[#f0f0f0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
              style={mono}
            >
              Start a new interview
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── ACTIVE INTERVIEW ──────────────────────────────────────────────────────────
  // The interview covers these skills; the underline marks them, it is not a progress meter.
  const topicTabs = data.skills.slice(0, 3);
  const currentQuestionText = data.questions[currentQ] ?? data.firstQuestion ?? "Can you walk me through your technical background and a recent project you built?";
  const isThinking = vadState === "processing";
  const statusText = aiSpeaking ? "Speaking to you…" : isThinking ? "Thinking…" : userIsSpeaking ? "Listening to you…" : "Your turn — go ahead";
  const cameraLive = camOn && !camError && !camLoading && cameraPermission === "done";
  // Five ascending bars light up with your voice level (one stays lit while idle).
  const level = isMuted ? 0 : userIsSpeaking ? Math.max(0.4, speechEnergy) : 0.2;
  const litBars = Math.max(isMuted ? 0 : 1, Math.ceil(level * 5));
  const cameraNote = cameraPermission !== "done" ? "Camera preview will appear here" : camError ? "Camera unavailable, audio only" : camLoading ? "Starting camera…" : "Camera is off";
  const switchCamera = () => {
    if (cameraPermission === "done") toggleCam();
    else void requestPermission("camera");
  };

  // Menus render in a portal outside the zoomed stage, so they get the same zoom.
  const portalZoom = stage ? { zoom: stage.zoom } : undefined;

  return (
    <TooltipProvider>
      <div className="relative isolate h-[100dvh] overflow-hidden font-sans text-[#f0f0f0] antialiased selection:bg-[#a27ce9]/30" data-theme="dark">
        <SpaceBackdrop />

        {/* The desktop layout is drawn at the reference size (1855×848) and zoomed to fit the window,
          so it keeps the same proportions on every screen. Below lg it falls back to a fluid layout. */}
        <div className="mx-auto flex h-full flex-col" style={stage ? { zoom: stage.zoom, width: STAGE_W, height: stage.height } : undefined}>
          {/* ── TOP BAR ── */}
          <header className="mx-auto w-full max-w-[1444px] flex-shrink-0 px-5 pt-5 sm:px-8 lg:pt-7">
            <Logo />
            <div className="mt-5 flex items-center justify-between gap-6 lg:mt-9">
              <div className="flex min-w-0 items-center gap-3 lg:w-[280px] lg:shrink-0 lg:justify-between">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#22e06b]" />
                  <span className="truncate text-[15px]">{data.title}</span>
                </span>
                <span aria-hidden="true" className="hidden h-5 w-px bg-white/20 lg:block" />
              </div>
              <nav aria-label="Skills covered" className="hidden flex-1 justify-center gap-[66px] lg:flex">
                {topicTabs.map((item) => (
                  <div key={item} className="w-[166px] text-center">
                    <p className="m-0 truncate text-[15px] text-[#f0f0f0]">{item}</p>
                    <span aria-hidden="true" className="mt-2.5 block h-[5px] rounded-full bg-[#a27ce9]" />
                  </div>
                ))}
              </nav>
              <div className="flex shrink-0 items-center justify-between lg:w-[254px] lg:pr-[22px]">
                <span aria-hidden="true" className="hidden h-5 w-px bg-white/20 lg:block" />
                <div className="flex h-12 shrink-0 items-center gap-3 rounded-full bg-[#16151a] px-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" role="timer" aria-label="Elapsed time">
                  <Clock3 size={20} aria-hidden="true" />
                  <span className="text-[18px] font-semibold tabular-nums tracking-[0.02em]">{formatTime(elapsed)}</span>
                </div>
              </div>
            </div>
            <nav aria-label="Skills covered" className="mt-4 flex gap-5 overflow-x-auto [scrollbar-width:none] lg:hidden">
              {topicTabs.map((item) => (
                <div key={item} className="shrink-0">
                  <p className="m-0 whitespace-nowrap text-[13px] text-white/85">{item}</p>
                  <span aria-hidden="true" className="mt-1.5 block h-1 rounded-full bg-[#a27ce9]" />
                </div>
              ))}
            </nav>
          </header>

          {/* ── MAIN ── */}
          <main className="mx-auto grid min-h-0 w-full max-w-[1444px] flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 px-5 pt-5 sm:px-8 lg:grid-cols-[590px_minmax(0,1fr)] lg:grid-rows-1 lg:gap-[104px] lg:pt-12">
            {/* LEFT – mic + camera */}
            <section aria-label="Your microphone and camera" className="flex min-h-0 flex-col">
              <div className="flex items-center gap-3">
                {isMuted ? <MicOff size={20} className="text-[#da4228]" aria-hidden="true" /> : <Mic size={20} className="text-[#da4228]" aria-hidden="true" />}
                <p className="m-0 text-[15px]">{isMuted ? "Mic muted" : "Mic active"}</p>
                <div className="ml-auto flex items-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                        className="rounded-full hover:bg-white/[0.06] [&_svg:not([class*='size-'])]:size-[19px]"
                      >
                        {isMuted ? <MicOff /> : <Mic />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent data-theme="dark" style={portalZoom}>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                  </Tooltip>
                  <div className="flex h-[22px] items-end gap-[3px]" aria-hidden="true">
                    {[9, 12, 15, 18, 22].map((h, i) => (
                      <span key={i} style={{ height: h }} className={`w-[5px] rounded-full transition-colors duration-150 ${i < litBars ? "bg-[#a27ce9]" : "bg-[#a27ce9]/20"}`} />
                    ))}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Camera options"
                        className="group rounded-full hover:bg-white/[0.06] data-[state=open]:bg-white/[0.06] [&_svg:not([class*='size-'])]:size-[19px]"
                      >
                        <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent data-theme="dark" style={portalZoom} align="end" className="w-[200px] border-white/10 font-sans">
                      <DropdownMenuItem onSelect={switchCamera}>
                        {cameraLive ? <CameraOff /> : <Camera />}
                        {cameraLive ? "Turn camera off" : "Turn camera on"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <span className="mt-5 hidden w-fit items-center gap-2.5 rounded-full bg-[#0d0c11] px-4 py-2 text-[15px] shadow-[inset_0_0_0_1px_#29282b] lg:mt-7 lg:flex">
                <span className={`h-2.5 w-2.5 rounded-full ${cameraLive ? "bg-[#22e06b]" : "bg-white/30"}`} />
                Camera preview
              </span>

              <div className="relative mt-3 flex h-[150px] items-center justify-center overflow-hidden rounded-[16px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:h-[200px] lg:mt-4 lg:aspect-video lg:h-auto lg:shadow-none">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`absolute inset-0 h-full w-full scale-x-[-1] rounded-[16px] object-cover transition-opacity duration-300 ${cameraLive ? "opacity-100" : "opacity-0"}`}
                />
                {!cameraLive && (
                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <Camera size={52} strokeWidth={1.4} className="text-[#f0f0f0]/90" aria-hidden="true" />
                    <p className="m-0 text-[15px] text-[#f0f0f0]/90 lg:text-[19px]">{cameraNote}</p>
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT – conversation */}
            <section aria-label="Conversation with Zara" className="flex min-h-0 flex-col">
              <div className="flex flex-shrink-0 items-center gap-4 pb-3">
                <ZaraAvatar speaking={aiSpeaking} />
                <div>
                  <p className="m-0 text-[15.5px] font-semibold">DevPrep Interviewer</p>
                  <p aria-live="polite" className="m-0 text-[14.5px] text-[#b597f0]">
                    {statusText}
                  </p>
                </div>
              </div>

              <div
                ref={chatScrollRef}
                onScroll={handleChatScroll}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-5 pt-3 [mask-image:linear-gradient(to_bottom,transparent,#000_16px,#000_92%,transparent)] lg:pl-[28px]"
                style={{ scrollbarWidth: "none" }}
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
                    <div className="flex items-center gap-1.5 rounded-[16px] bg-[#5934d3] px-5 py-4" aria-label="You are speaking">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
                          transition={{ repeat: Infinity, duration: 0.9, delay: dot * 0.15 }}
                          className="h-1.5 w-1.5 rounded-full bg-white"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {isThinking && (
                  <div className="flex items-center gap-1.5 py-2" aria-label="Zara is thinking">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: dot * 0.15 }}
                        className="h-1.5 w-1.5 rounded-full bg-[#b597f0]"
                      />
                    ))}
                  </div>
                )}
              </div>

              {(error || realtimeError) && (
                <Alert variant="destructive" className="mb-3 flex-shrink-0 rounded-[12px] border-[rgba(255,120,120,0.25)] bg-[rgba(255,90,90,0.08)] py-3 text-[13px]">
                  <CircleAlert />
                  <AlertDescription className="text-[#ffb4b4]">{error || realtimeError}</AlertDescription>
                </Alert>
              )}

              {/* ── CONTROLS ── */}
              <div className="flex flex-shrink-0 justify-end gap-3.5 pb-6 pt-2 sm:gap-4" style={stage ? { paddingBottom: stage.pad } : undefined}>
                <Button onClick={endInterview} className={`${PILL} bg-[#fcfbfc] text-black hover:bg-white active:scale-[0.97]`} style={mono}>
                  End interview
                </Button>
                <Popover open={helpOpen} onOpenChange={setHelpOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={`${PILL} border-white/[0.22] bg-[#09090d]/60 text-[#f0f0f0] hover:border-white/40 hover:bg-[#09090d]/60`} style={mono}>
                      Having problem
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent data-theme="dark" style={portalZoom} side="top" align="end" className="w-[340px] rounded-[16px] border-white/10 bg-[#16151a] p-5 font-sans">
                    <p className="m-0 mb-3 text-[13px] font-medium">Troubleshooting</p>
                    <ul className="m-0 list-disc space-y-2 pl-4 text-[13px] leading-relaxed text-white/80">
                      <li>Allow microphone access from the lock icon in your address bar.</li>
                      <li>Pause for about a second when you finish. Zara replies once you stop speaking.</li>
                      <li>Use headphones if Zara&apos;s voice is being picked up by your mic.</li>
                    </ul>
                    <Button variant="link" size="sm" className="mt-4 h-auto p-0 text-[13px] text-[#b597f0] has-[>svg]:px-0" onClick={() => window.location.reload()}>
                      <RotateCcw className="size-[13px]" /> Reload session
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </section>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

/** Reference frame the desktop interview layout is designed at. */
const STAGE_W = 1855;
const STAGE_H = 848;
const PILL = "h-12 flex-1 rounded-full px-7 text-[13px] font-bold uppercase tracking-[0.04em] sm:flex-none sm:text-[14px]";

const LOGO_PATH =
  "M440 142H814A338.5 338.5 0 0 1 814 819H632Q597 819 597 784V672H814A190.5 190.5 0 0 0 814 291H452Q415 291 415 254V167Q415 142 440 142ZM440 502H557Q597 502 597 542V672H452Q415 672 415 635V527Q415 502 440 502Z";

function Logo() {
  return (
    <Link href="/dashboard/ai-interview" aria-label="DevPrep interviews" className="inline-flex items-center gap-2.5 text-[22px] font-semibold tracking-[-0.04em] text-[#f0f0f0]">
      <svg viewBox="415 142 738 677" aria-hidden="true" className="h-[21px] w-[23px]" fill="currentColor">
        <path d={LOGO_PATH} />
      </svg>
      DevPrep
    </Link>
  );
}

function ZaraAvatar({ speaking = false }: { speaking?: boolean }) {
  return (
    <motion.div
      animate={speaking ? { boxShadow: ["0 0 0 0 rgba(162,124,233,0)", "0 0 0 6px rgba(162,124,233,0.22)", "0 0 0 0 rgba(162,124,233,0)"] } : { boxShadow: "0 0 0 0 rgba(162,124,233,0)" }}
      transition={{ repeat: speaking ? Infinity : 0, duration: 1.6 }}
      className="shrink-0 rounded-full motion-reduce:!shadow-none"
    >
      <Avatar className="size-[52px]">
        <AvatarFallback className="bg-[#26262a] text-[22px] font-bold leading-none text-[#f0f0f0]">
          D<span className="text-[#a968e4]">.</span>
        </AvatarFallback>
      </Avatar>
    </motion.div>
  );
}

function ViewfinderCorners() {
  const c = "absolute h-[18px] w-[18px] border-white/35";
  return (
    <span aria-hidden="true">
      <span className={`${c} left-3.5 top-3.5 border-l border-t`} />
      <span className={`${c} right-3.5 top-3.5 border-r border-t`} />
      <span className={`${c} bottom-3.5 left-3.5 border-b border-l`} />
      <span className={`${c} bottom-3.5 right-3.5 border-b border-r`} />
    </span>
  );
}

function AiMessage({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="max-w-[92%] lg:max-w-[480px]">
      <p className="m-0 text-[15px] leading-[1.36] text-[#ededed]">{text}</p>
      <p className="m-0 mt-1.5 text-[13px] text-white/80">{timestamp}</p>
    </div>
  );
}

function UserMessage({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-[16px] bg-[#5934d3] px-[18px] py-3 text-white">
        <p className="m-0 text-[14px] leading-[1.45]">{text}</p>
        <p className="m-0 mt-1 text-[13px] text-white/85">{timestamp}</p>
      </div>
    </div>
  );
}
