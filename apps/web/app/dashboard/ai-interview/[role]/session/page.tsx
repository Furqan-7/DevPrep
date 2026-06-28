"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mic, MicOff, Clock3, PhoneOff, AlertOctagon,
  VideoOff, CheckCircle2, ChevronDown,
} from "lucide-react";
import { ROLE_DATA } from "../../data";

type Phase = "setup" | "active" | "done";


function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.role) ? params.role[0] : (params.role ?? "");
  const data = ROLE_DATA[slug];


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("setup");
  const [currentQ, setCurrentQ] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [camError, setCamError] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showText, setShowText] = useState(false);

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

  // ── Auto-acquire mic on page load so the browser indicator is always on ───────
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
      })
      .catch(() => setError("Microphone access denied. Check browser permissions."));
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ── Start recording the current question's answer ────────────────────────────
  const startQuestionRecording = () => {
    if (!streamRef.current) { setError("Microphone not available."); return; }
    setTranscript(null);
    setError(null);
    chunksRef.current = [];

    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      setIsTranscribing(true);
      try {
        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Transcription failed."); return; }
        setTranscript(json.transcript);
      } catch {
        setError("Network error during transcription.");
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();
    setIsRecording(true);
  };

  const toggleMic = () => { streamRef.current?.getAudioTracks().forEach(t => (t.enabled = !micOn)); setMicOn(m => !m); };
  const toggleCam = () => { streamRef.current?.getVideoTracks().forEach(t => (t.enabled = !camOn)); setCamOn(c => !c); };

  // ── Stop current recording, transcribe, advance to next question ──────────────
  const submitAnswer = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop(); // triggers onstop → transcription
    }
    setAnswered(prev => new Set([...prev, currentQ]));
    setIsRecording(false);
    setTranscript(null);
    if (!data) return;
    if (currentQ < data.questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      setPhase("done");
    }
  };

  // ── End interview — kill recorder silently (no transcription) + release mic ───
  const endInterview = () => {
    // Null out handlers BEFORE stop() so no transcription fires after navigation
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    router.push(`/dashboard/ai-interview/${slug}`);
  };

  if (!data) return null;

  // ── SETUP ────────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-brand-bg text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-white/[0.03] blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-1.5 font-display text-base font-bold tracking-tighter mb-10">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-sm" />
          </div>
          DevPrep
        </div>

        {/* Mini orb */}
        <div className="relative flex items-center justify-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute w-[120px] h-[120px] rounded-full bg-white/10 blur-2xl"
          />
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-b from-white to-[#e0e0ff] shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center border border-white/30"
          >
            <div className="absolute inset-2 rounded-full bg-white/40 blur-lg" />
            <span className="relative z-10 text-xl font-black text-black">D<span className="text-[#7C6CFF]">.</span></span>
          </motion.div>
        </div>

        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Ready for your interview?</h1>
        <p className="text-brand-muted text-sm leading-relaxed mb-8">
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
            <div key={tip} className="flex items-start gap-2.5 text-xs text-brand-muted">
              <CheckCircle2 size={13} className="text-white/50 mt-0.5 flex-shrink-0" />
              {tip}
            </div>
          ))}
        </div>

        <button
          onClick={() => setPhase("active")}
          className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          <Mic size={14} /> Start Interview
        </button>
        <button
          onClick={() => router.push(`/dashboard/ai-interview/${slug}`)}
          className="mt-4 text-xs text-brand-muted hover:text-white transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  );

  // ── DONE ─────────────────────────────────────────────────────────────────────
  if (phase === "done") return (
    <div className="min-h-screen bg-brand-bg text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-green-500/5 blur-[120px]" />
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Logo */}
        <div className="flex items-center gap-1.5 font-display text-base font-bold tracking-tighter mb-10">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-sm" />
          </div>
          DevPrep
        </div>

        <div className="w-12 h-12 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mb-5">
          <CheckCircle2 size={22} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-display font-bold tracking-tight mb-1">Interview Complete!</h2>
        <p className="text-sm text-brand-muted">
          {answered.size} of {data.questions.length} questions answered in{" "}
          <span className="text-white">{formatTime(elapsed)}</span>.
        </p>

        <div className="mt-8 w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-left">
          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold mb-3">Questions covered</p>
          <div className="space-y-2">
            {data.questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-brand-muted">
                <CheckCircle2 size={12} className={`mt-0.5 flex-shrink-0 ${answered.has(i) ? "text-green-400" : "text-white/20"}`} />
                <span className="line-clamp-1">{q}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3 w-full">
          <button
            onClick={() => router.push("/dashboard/ai-interview")}
            className="flex-1 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-xs font-semibold text-brand-muted hover:text-white hover:border-white/30 transition-all"
          >
            Back to roles
          </button>
          <button
            onClick={() => { setPhase("setup"); setCurrentQ(0); setAnswered(new Set()); setElapsed(0); setIsRecording(false); }}
            className="flex-1 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  // ── ACTIVE INTERVIEW ──────────────────────────────────────────────────────────
  const topicTabs = data.skills.slice(0, 3);

  return (
    <div className="min-h-screen bg-brand-bg text-white overflow-hidden relative flex flex-col">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-white/[0.025] blur-[160px]" />

      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between px-10 pt-5 pb-4 border-b border-white/[0.06] relative z-10 flex-shrink-0">
        {/* Logo + role */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-tighter">
            <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-black rounded-sm" />
            </div>
            DevPrep
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-brand-muted">{data.title}</span>
          </div>
        </div>

        {/* Progress tabs */}
        <div className="hidden md:flex gap-6">
          {topicTabs.map((item, i) => (
            <div key={i}>
              <p className="text-xs text-brand-muted mb-1.5 truncate max-w-[120px]">{item}</p>
              <div className="w-28 h-1 rounded-full bg-white/10 overflow-hidden">
                {i < currentQ && <div className="w-full h-full bg-white/50" />}
                {i === Math.min(currentQ, topicTabs.length - 1) && (
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: isRecording ? "70%" : "25%" }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timer */}
        <div className="border border-white/10 bg-white/[0.04] backdrop-blur-xl rounded-xl px-4 py-2 flex items-center gap-2">
          <Clock3 size={13} className="text-brand-muted" />
          <span className="text-sm font-mono font-medium">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* ── MAIN 2-COL ── */}
      <div className="grid grid-cols-2 gap-8 px-10 pt-6 pb-24 relative z-10 flex-1 min-h-0">

        {/* LEFT – camera */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Mic bar */}
          <div className="border border-white/[0.08] rounded-xl bg-white/[0.02] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Mic size={14} className={micOn ? "text-white/60" : "text-red-400"} />
              <p className="text-xs text-brand-muted">{micOn ? "Mic: Active" : "Mic: Muted"}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleMic}>
                {micOn ? <Mic size={13} className="text-brand-muted" /> : <MicOff size={13} className="text-red-400" />}
              </button>
              {micOn && (
                <div className="flex gap-[3px] items-end h-4">
                  {[6, 12, 8, 14, 10, 12].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [h, h + 6, h] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                      className="w-[3px] rounded-full bg-white/40"
                      style={{ height: h }}
                    />
                  ))}
                </div>
              )}
              <button onClick={toggleCam}><ChevronDown size={13} className="text-brand-muted" /></button>
            </div>
          </div>

          {/* Camera feed */}
          <div className="flex-1 rounded-2xl border border-white/[0.08] overflow-hidden bg-black relative min-h-0">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${camOn ? "opacity-90" : "opacity-0"}`}
            />
            {(!camOn || camError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-brand-muted">
                <VideoOff size={24} />
                <span className="text-xs">Camera off</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${camError ? "bg-amber-400" : "bg-green-500"}`} />
            <p className="text-brand-muted text-xs">
              {camError ? "Camera denied — audio only" : "Camera and microphone active"}
            </p>
          </div>
        </div>

        {/* RIGHT – AI + question */}
        <div className="flex flex-col items-center justify-center relative">
          {/* AI Orb */}
          <div className="relative flex items-center justify-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute w-[160px] h-[160px] rounded-full bg-white/10 blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute w-[120px] h-[120px] rounded-full border border-white/10"
            />
            <motion.div
              animate={{ scale: aiSpeaking ? [1, 1.1, 0.98, 1] : [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: aiSpeaking ? 0.5 : 2, ease: "easeInOut" }}
              className="relative w-[90px] h-[90px] rounded-full bg-gradient-to-b from-white to-[#e0e0ff] shadow-[0_0_50px_rgba(255,255,255,0.15)] flex items-center justify-center border border-white/30"
            >
              <div className="absolute inset-2 rounded-full bg-white/40 blur-lg" />
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="relative z-10"
              >
                <span className="text-2xl font-black text-black">D<span className="text-[#7C6CFF]">.</span></span>
              </motion.div>
            </motion.div>
          </div>

          {/* Question text */}
          <div className="max-w-lg w-full mb-6">
            <motion.p
              key={currentQ}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 6 }}
              transition={{ duration: 0.4 }}
              className="text-base leading-relaxed text-white"
            >
              {currentQ === 0 && !answered.has(0)
                ? <>Hi, I&apos;m Zara, your AI interviewer at DevPrep.<br /><br />{data.questions[0]}</>
                : data.questions[currentQ]}
            </motion.p>
          </div>

          {/* Recording / Start button */}
          {isRecording ? (
            <motion.div
              animate={{ boxShadow: ["0 0 0px rgba(255,0,0,0)", "0 0 20px rgba(255,0,0,0.1)", "0 0 0px rgba(255,0,0,0)"] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2.5 h-2.5 rounded-full bg-red-500"
                />
                <span className="text-sm text-white/80">Recording...</span>
              </div>
              <button
                onClick={submitAnswer}
                className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition-all whitespace-nowrap"
              >
                {currentQ < data.questions.length - 1 ? "Submit & Next →" : "Finish Interview"}
              </button>
            </motion.div>
          ) : (
            <button
              onClick={startQuestionRecording}
              disabled={!showText}
              className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 flex items-center justify-center gap-3 hover:bg-white/[0.06] hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Mic size={14} className="text-white/60" />
              <span className="text-sm text-white">Start Answering</span>
            </button>
          )}

          {/* Transcript display */}
          {isTranscribing && (
            <div className="w-full max-w-lg mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/70 flex-shrink-0"
              />
              <span className="text-xs text-brand-muted">Transcribing your answer…</span>
            </div>
          )}
          {!isTranscribing && transcript && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-lg mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4"
            >
              <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold mb-2">Your answer</p>
              <p className="text-sm text-white/80 leading-relaxed">{transcript}</p>
            </motion.div>
          )}
          {!isTranscribing && error && (
            <div className="w-full max-w-lg mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-5 py-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <p className="mt-3 text-xs text-brand-muted font-mono">
            Question {currentQ + 1} of {data.questions.length}
          </p>
        </div>
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="fixed bottom-6 right-8 flex gap-3 z-20">
        <button
          onClick={endInterview}
          className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-brand-bg/80 backdrop-blur-xl flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-xs"
        >
          <PhoneOff size={13} className="text-red-500" />
          <span>End Interview</span>
        </button>
        <button className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-brand-bg/80 backdrop-blur-xl flex items-center gap-2 hover:bg-white/[0.04] transition-all text-xs">
          <AlertOctagon size={13} className="text-brand-muted" />
          <span className="text-brand-muted">Having trouble?</span>
        </button>
      </div>
    </div>
  );
}
