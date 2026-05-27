"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mic, MicOff, ChevronDown, Clock3, PhoneOff, AlertOctagon,
  VideoOff, CheckCircle2,
} from "lucide-react";
import { ROLE_DATA } from "../../data";

type Phase = "setup" | "active" | "done";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function InterviewSessionPage() {
  const params  = useParams();
  const router  = useRouter();
  const slug    = Array.isArray(params.role) ? params.role[0] : (params.role ?? "");
  const data    = ROLE_DATA[slug];

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase,       setPhase]       = useState<Phase>("setup");
  const [currentQ,    setCurrentQ]    = useState(0);
  const [micOn,       setMicOn]       = useState(true);
  const [camOn,       setCamOn]       = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed,     setElapsed]     = useState(0);
  const [answered,    setAnswered]    = useState<Set<number>>(new Set());
  const [camError,    setCamError]    = useState(false);
  const [aiSpeaking,  setAiSpeaking]  = useState(false);
  const [showText,    setShowText]    = useState(false);

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // AI speaking animation on question change
  useEffect(() => {
    if (phase !== "active") return;
    setShowText(false);
    setAiSpeaking(true);
    const t1 = setTimeout(() => setAiSpeaking(false), 1800);
    const t2 = setTimeout(() => setShowText(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [currentQ, phase]);

  // Cleanup
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
    } catch { setCamError(true); }
    setPhase("active");
  };

  const toggleMic = () => { streamRef.current?.getAudioTracks().forEach(t => (t.enabled = !micOn)); setMicOn(m => !m); };
  const toggleCam = () => { streamRef.current?.getVideoTracks().forEach(t => (t.enabled = !camOn)); setCamOn(c => !c); };

  const submitAnswer = () => {
    setAnswered(prev => new Set([...prev, currentQ]));
    setIsRecording(false);
    if (!data) return;
    if (currentQ < data.questions.length - 1) { setCurrentQ(q => q + 1); }
    else { streamRef.current?.getTracks().forEach(t => t.stop()); setPhase("done"); }
  };

  const endInterview = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    router.push(`/dashboard/ai-interview/${slug}`);
  };

  if (!data) return null;

  // ── SETUP ────────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-[#060816] text-white overflow-hidden relative flex flex-col items-center justify-center">
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_center,#7c3aed_0%,transparent_60%)]" />
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full px-6">
        <h1 className="text-5xl font-black tracking-tight leading-none mb-10">
          DevPrep<span className="text-[#7C6CFF]">.</span>
        </h1>

        {/* Mini orb */}
        <div className="relative flex items-center justify-center mb-8">
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute w-[160px] h-[160px] rounded-full bg-[#7C6CFF]/30 blur-3xl" />
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            className="relative w-[100px] h-[100px] rounded-full bg-gradient-to-b from-white to-[#d8d7ff] shadow-[0_0_60px_rgba(124,108,255,0.6)] flex items-center justify-center border border-white/50">
            <div className="absolute inset-3 rounded-full bg-white/70 blur-xl" />
            <h2 className="relative z-10 text-4xl font-black text-black">D<span className="text-[#7C6CFF]">.</span></h2>
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">Ready for your interview?</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          Starting a <span className="text-white font-semibold">{data.title}</span> practice interview —{" "}
          {data.questions.length} questions, ~{data.duration} mins.
        </p>

        <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-left space-y-3 mb-8">
          {[
            "Your camera & microphone will be used",
            "Speak your answers naturally — take your time",
            'Click "Submit & Next" to move to the next question',
            "You can end the interview at any time",
          ].map(tip => (
            <div key={tip} className="flex items-start gap-2.5 text-xs text-zinc-400">
              <CheckCircle2 size={13} className="text-[#7C6CFF] mt-0.5 flex-shrink-0" />
              {tip}
            </div>
          ))}
        </div>

        <button onClick={startSession}
          className="w-full py-4 rounded-2xl bg-[#7C6CFF] text-white font-bold text-base hover:bg-[#6a5de8] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(124,108,255,0.4)]">
          <Mic size={16} />Start Interview
        </button>
        <button onClick={() => router.push(`/dashboard/ai-interview/${slug}`)}
          className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          Go back
        </button>
      </div>
    </div>
  );

  // ── DONE ─────────────────────────────────────────────────────────────────────
  if (phase === "done") return (
    <div className="min-h-screen bg-[#060816] text-white overflow-hidden relative flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,#22c55e_0%,transparent_60%)]" />
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        <h1 className="text-5xl font-black tracking-tight mb-8">DevPrep<span className="text-[#7C6CFF]">.</span></h1>
        <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mb-6">
          <CheckCircle2 size={28} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold">Interview Complete!</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {answered.size} of {data.questions.length} questions answered in <span className="text-white">{formatTime(elapsed)}</span>.
        </p>
        <div className="mt-8 w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">Questions covered</p>
          <div className="space-y-2">
            {data.questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-500">
                <CheckCircle2 size={12} className={`mt-0.5 flex-shrink-0 ${answered.has(i) ? "text-green-400" : "text-zinc-700"}`} />
                <span className="line-clamp-1">{q}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex gap-3 w-full">
          <button onClick={() => router.push("/dashboard/ai-interview")}
            className="flex-1 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-zinc-400 hover:text-white hover:border-white/30 transition-all">
            Back to roles
          </button>
          <button onClick={() => { setPhase("setup"); setCurrentQ(0); setAnswered(new Set()); setElapsed(0); setIsRecording(false); }}
            className="flex-1 py-3 rounded-2xl bg-[#7C6CFF] text-white text-sm font-bold hover:bg-[#6a5de8] active:scale-95 transition-all">
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  // ── ACTIVE INTERVIEW ──────────────────────────────────────────────────────────
  const topicTabs = data.skills.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#060816] text-white overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_center,#7c3aed_0%,transparent_60%)]" />

      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between px-10 pt-8 relative z-10">
        {/* Logo */}
        <div>
          <h1 className="text-5xl font-black tracking-tight leading-none">
            DevPrep<span className="text-[#7C6CFF]">.</span>
          </h1>
          <div className="flex items-center gap-2 mt-6 text-lg">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-zinc-300">{data.title}</span>
          </div>
        </div>

        {/* Progress tabs */}
        <div className="flex gap-8">
          {topicTabs.map((item, i) => (
            <div key={i}>
              <p className="text-sm text-zinc-300 mb-2 truncate max-w-[140px]">{item}</p>
              <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
                {i < currentQ && <div className="w-full h-full bg-[#7C6CFF]/70" />}
                {i === Math.min(currentQ, topicTabs.length - 1) && (
                  <motion.div className="h-full bg-[#7C6CFF]"
                    initial={{ width: "0%" }} animate={{ width: isRecording ? "70%" : "25%" }}
                    transition={{ duration: 0.6 }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timer */}
        <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl px-6 py-5 flex items-center gap-3 shadow-[0_0_40px_rgba(124,108,255,0.15)]">
          <Clock3 className="text-[#7C6CFF]" />
          <span className="text-4xl font-medium">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* ── MAIN 2-COL ── */}
      <div className="grid grid-cols-2 gap-16 px-10 mt-16 relative z-10 pb-32">

        {/* LEFT – camera */}
        <div>
          {/* Mic bar */}
          <div className="border border-white/10 rounded-3xl bg-white/[0.03] backdrop-blur-xl px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Mic className={micOn ? "text-[#7C6CFF]" : "text-red-400"} />
              <p className="text-xl text-zinc-200">{micOn ? "Mic: Active" : "Mic: Muted"}</p>
            </div>
            <div className="flex items-center gap-5">
              <button onClick={toggleMic}>
                {micOn ? <Mic className="w-5 h-5 text-zinc-400" /> : <MicOff className="w-5 h-5 text-red-400" />}
              </button>
              {micOn && (
                <div className="flex gap-[5px] items-end h-6">
                  {[8, 16, 10, 18, 12, 15].map((h, i) => (
                    <motion.div key={i} animate={{ height: [h, h + 8, h] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                      className="w-[4px] rounded-full bg-[#7C6CFF]" style={{ height: h }} />
                  ))}
                </div>
              )}
              <button onClick={toggleCam}><ChevronDown className="text-zinc-400" /></button>
            </div>
          </div>

          {/* Camera feed */}
          <div className="mt-5 rounded-[34px] border border-white/10 p-4 bg-white/[0.03] backdrop-blur-xl">
            <div className="rounded-[28px] overflow-hidden bg-black aspect-video relative">
              <video ref={videoRef} autoPlay muted playsInline
                className={`w-full h-full object-cover ${camOn ? "opacity-90" : "opacity-0"}`} />
              {(!camOn || camError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
                  <VideoOff size={32} /><span className="text-sm">Camera off</span>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 mt-5">
            <div className={`w-3 h-3 rounded-full ${camError ? "bg-amber-400" : "bg-green-500"}`} />
            <p className="text-zinc-300 text-lg">
              {camError ? "Camera denied — audio only" : "Camera and microphone are working properly"}
            </p>
          </div>
        </div>

        {/* RIGHT – AI + question */}
        <div className="flex flex-col items-center justify-center relative">
          {/* AI Orb */}
          <div className="relative flex items-center justify-center mb-14">
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute w-[230px] h-[230px] rounded-full bg-[#7C6CFF]/30 blur-3xl" />
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute w-[180px] h-[180px] rounded-full border border-[#8b7cff]/40" />
            <motion.div
              animate={{ scale: aiSpeaking ? [1, 1.1, 0.98, 1] : [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: aiSpeaking ? 0.5 : 2, ease: "easeInOut" }}
              className="relative w-[140px] h-[140px] rounded-full bg-gradient-to-b from-white to-[#d8d7ff] shadow-[0_0_80px_rgba(124,108,255,0.6)] flex items-center justify-center border border-white/50">
              <div className="absolute inset-3 rounded-full bg-white/70 blur-xl" />
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="relative z-10">
                <h2 className="text-6xl font-black text-black">D<span className="text-[#7C6CFF]">.</span></h2>
              </motion.div>
            </motion.div>
          </div>

          {/* Question text */}
          <div className="max-w-xl w-full">
            <motion.p key={currentQ} initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 8 }}
              transition={{ duration: 0.4 }}
              className="text-2xl leading-relaxed text-zinc-100">
              {currentQ === 0 && !answered.has(0)
                ? <>Hi, I&apos;m Zara, your AI interviewer at DevPrep.<br /><br />{data.questions[0]}</>
                : data.questions[currentQ]}
            </motion.p>
          </div>

          {/* Recording / Start button */}
          {isRecording ? (
            <motion.div
              animate={{ boxShadow: ["0 0 0px rgba(255,0,0,0)", "0 0 30px rgba(255,0,0,0.15)", "0 0 0px rgba(255,0,0,0)"] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-10 w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-8 py-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-3xl text-zinc-100">Recording...</span>
              </div>
              <button onClick={submitAnswer}
                className="px-6 py-3 rounded-2xl bg-[#7C6CFF] text-white font-bold text-sm hover:bg-[#6a5de8] active:scale-95 transition-all whitespace-nowrap">
                {currentQ < data.questions.length - 1 ? "Submit & Next →" : "Finish Interview"}
              </button>
            </motion.div>
          ) : (
            <button onClick={() => setIsRecording(true)} disabled={!showText}
              className="mt-10 w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-8 py-7 flex items-center justify-center gap-4 hover:bg-[#7C6CFF]/10 hover:border-[#7C6CFF]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <Mic className="text-[#7C6CFF] w-6 h-6" />
              <span className="text-3xl text-zinc-100">Start Answering</span>
            </button>
          )}

          <p className="mt-4 text-sm text-zinc-600 font-mono">
            Question {currentQ + 1} of {data.questions.length}
          </p>
        </div>
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="fixed bottom-8 right-10 flex gap-5 z-20">
        <button onClick={endInterview}
          className="px-8 py-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl flex items-center gap-3 hover:bg-red-500/10 hover:border-red-500/30 transition-all">
          <PhoneOff className="text-red-500" />
          <span className="text-xl">End Interview</span>
        </button>
        <button className="px-8 py-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl flex items-center gap-3 hover:bg-white/5 transition-all">
          <AlertOctagon className="text-[#7C6CFF]" />
          <span className="text-xl">Having trouble?</span>
        </button>
      </div>
    </div>
  );
}
