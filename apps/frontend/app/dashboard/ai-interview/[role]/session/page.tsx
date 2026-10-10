"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mic, MicOff, Clock3, PhoneOff, AlertOctagon,
  UserRound, CheckCircle2, ChevronDown,
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

  const videoRef = useRef<HTMLVideoElement>(null);
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

  // Camera preview setup
  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStream = stream;
          setCamLoading(false);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCamError(false);
        })
        .catch((err) => {
          console.warn("[InterviewSession] Camera permission blocked or unavailable:", err?.message || err);
          setCamLoading(false);
          setCamError(true);
        });
    } else {
      setCamLoading(false);
      setCamError(true);
    }

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
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

  // ── SETUP (READY SCREEN) ──────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] flex flex-col items-center justify-center relative overflow-hidden antialiased font-sans">
        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full px-6 py-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex items-center gap-2 font-bold tracking-tight mb-8"
          >
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
          </motion.div>

          {/* Zara Avatar Orb */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
            className="relative flex items-center justify-center mb-6"
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="relative w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#E5E5E5]"
            >
              <span className="relative z-10 text-2xl font-extrabold text-[#1A1A1A]">
                D<span className="text-[#EB3A14]">.</span>
              </span>
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
            className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[#1A1A1A] mb-2.5"
          >
            Ready for your interview?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
            className="text-[#666666] text-sm sm:text-base leading-relaxed mb-8 max-w-sm"
          >
            Starting a{" "}
            <span className="text-[#1A1A1A] font-semibold">{data.title}</span> practice interview —{" "}
            {data.questions.length} questions, ~{data.duration} mins.
          </motion.p>

          {/* Checklist Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
            className="w-full bg-white border border-[#E5E5E5] rounded-2xl p-6 text-left space-y-4 mb-8 shadow-sm"
          >
            {[
              "Your microphone will be used for continuous hands-free voice interaction",
              "Zara will speak each question — just respond naturally",
              "Voice Activity Detection (VAD) automatically senses when you finish speaking",
              "You can end the interview at any time",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-3.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-[#F5F5F7] border border-[#E5E5E5] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={12} className="text-[#1A1A1A]" />
                </div>
                <span className="text-[#1A1A1A] text-[13px] font-medium leading-normal pt-0.5">
                  {tip}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Primary CTA */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: EASE }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartInterview}
            className="w-full py-4 rounded-full bg-[#1A1A1A] hover:bg-black text-white font-semibold text-[15px] tracking-tight transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
          >
            <Mic size={16} /> Start interview
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
            onClick={() => router.push(`/dashboard/ai-interview/${slug}`)}
            className="mt-4 text-[13px] font-medium text-[#666666] hover:text-[#1A1A1A] transition-colors cursor-pointer border-0 bg-transparent p-0"
          >
            Go back
          </motion.button>
        </div>
      </div>
    );
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
