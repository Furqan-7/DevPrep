"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mic, MicOff, Clock3, PhoneOff, AlertOctagon,
  VideoOff, CheckCircle2, ChevronDown, Volume2,
} from "lucide-react";
import type { RoleData } from "../../data";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import api from "@/lib/api";
import Image from "next/image";

type SessionData = RoleData & {
  sessionId?: number;
  firstQuestion?: string;
  totalQuestions?: number;
};

type Phase = "setup" | "active" | "done";


function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Ordered list of preferred high-quality English voices. */
const PRIORITY_VOICES = [
  "Google US English",
  "Microsoft Zira",
  "Microsoft Aria Online (Natural)",
  "Microsoft Jenny Online (Natural)",
  "Microsoft Aria",
  "Samantha",
];

/**
 * Picks the best available TTS voice from `voices`.
 * Tries each PRIORITY_VOICES entry (exact, case-insensitive) in order,
 * then falls back to the first en-US voice, then any English voice.
 * Returns null only if the voices list is empty.
 */
function pickBestInterviewVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  for (const name of PRIORITY_VOICES) {
    const found = voices.find((v) => v.name.toLowerCase() === name.toLowerCase());
    if (found) return found;
  }
  const enUS = voices.find((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith("en-us")
  );
  if (enUS) return enUS;
  return voices.find((v) => v.lang.toLowerCase().startsWith("en")) ?? null;
}

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.role) ? params.role[0] : (params.role ?? "");

  const [data, setData] = useState<SessionData | null>(null);

  // Hydrate session data that was written by the role page after the backend
  // POST /api/interview/generate call.
  useEffect(() => {
    const raw = sessionStorage.getItem(`interview_session_${slug}`);
    if (!raw) {
      // No session data — redirect back to role setup page
      router.replace(`/dashboard/ai-interview/${slug}`);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SessionData;
      // If the backend returned a firstQuestion, inject it as questions[0]
      if (parsed.firstQuestion && (!parsed.questions || parsed.questions.length === 0)) {
        parsed.questions = [parsed.firstQuestion];
      }
      // Guard: if session has no valid question or sessionId, go back
      if (!parsed.sessionId || !parsed.questions?.length) {
        sessionStorage.removeItem(`interview_session_${slug}`);
        router.replace(`/dashboard/ai-interview/${slug}`);
        return;
      }
      if (parsed.totalQuestions) setTotalQuestions(parsed.totalQuestions);
      setData(parsed);
    } catch {
      // malformed — redirect back
      sessionStorage.removeItem(`interview_session_${slug}`);
      router.replace(`/dashboard/ai-interview/${slug}`);
    }
  }, [slug]);


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // Track previous isSpeaking to detect the falling edge (Zara finished → auto-record)
  const prevIsSpeakingRef = useRef(false);
  // When interviewerMessage is spoken (it already contains the next question),
  // skip the duplicate speak() that useEffect([currentQ]) would otherwise fire.
  const skipNextSpeakRef = useRef(false);
  // Silence detection — Web Audio API
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceRafRef = useRef<number | null>(null);
  // Adaptive noise-floor calibration
  const noiseFloorRef = useRef<number | null>(null);
  const calibrationSamples = useRef<number[]>([]);
  const recordingStartTime = useRef<number>(0);
  const silenceStartTime = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(10);

  // ── Speech Synthesis ─────────────────────────────────────────────────────────
  const { isSupported: ttsSupported, cancel: cancelSpeech } = useSpeechSynthesis();

  // displayedText drives both the on-screen text AND the aiSpeaking animation.
  // It is populated word-by-word via onboundary and cleared on onend.
  const [displayedText, setDisplayedText] = useState("");

  const [phase, setPhase] = useState<Phase>("setup");
  const [currentQ, setCurrentQ] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [camError, setCamError] = useState(false);
  // aiSpeaking: true while displayedText is non-empty (Zara is speaking)
  const aiSpeaking = displayedText !== "";
  const [showText, setShowText] = useState(false);

  // ── Word-by-word speak via onboundary ────────────────────────────────────────
  // Cache voices so we can pick the best one. Chrome loads them async.
  const ttsVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!ttsSupported || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    const load = () => {
      const v = synth.getVoices();
      if (v.length > 0) ttsVoicesRef.current = v;
    };
    load();
    synth.addEventListener("voiceschanged", load);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      // Cancel any active speech + reveal timer when the component unmounts.
      synth.cancel();
    };
  }, [ttsSupported]);

  // Ref that holds the active timed-reveal interval so we can cancel it from
  // any of the utterance callbacks. Declared outside speakWithBoundary so it
  // persists across re-renders (not reset on every call).
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Cancel any running timed word-reveal. */
  const clearRevealTimer = () => {
    if (revealTimerRef.current !== null) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  /**
   * speakWithBoundary — plays `text` via SpeechSynthesis and progressively
   * reveals it word-by-word in the UI.
   *
   * Strategy (dual-mode):
   *   1. onstart  → start a timed word-reveal at estimated WPM (immediate
   *                 fallback that works for every voice/browser combination).
   *   2. onboundary (name==="word") → if Chrome fires these, switch to the
   *                 more-accurate charIndex slice and cancel the timer.
   *   3. onend    → show the full text (catches the last word/punctuation),
   *                 cancel timer, call onDone.
   *   4. onerror  → "interrupted" is benign (fired when cancel() hits the
   *                 previous utterance) — ignore it. All other errors clear
   *                 state and call onDone so the pipeline never gets stuck.
   */
  const speakWithBoundary = (text: string, onDone?: () => void) => {
    if (!ttsSupported || typeof window === "undefined") { onDone?.(); return; }

    // Log mic permission state for Chrome diagnosis (non-blocking).
    if (navigator?.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName })
        .then(s => console.log("[TTS] Mic permission state:", s.state))
        .catch(e => console.warn("[TTS] Could not query mic permission:", e));
    }

    const synth = window.speechSynthesis;

    // Cancel previous utterance. This fires onerror("interrupted") on the OLD
    // utterance — that's expected and harmless (handled below).
    clearRevealTimer();
    synth.cancel();
    setDisplayedText("");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang   = "en-US";
    utterance.rate   = 1;
    utterance.pitch  = 1;
    utterance.volume = 1;

    // Voice selection — untouched, uses PRIORITY_VOICES order.
    const bestVoice = pickBestInterviewVoice(ttsVoicesRef.current);
    if (bestVoice) utterance.voice = bestVoice;
    console.log("[TTS] speak() → voice:", bestVoice?.name ?? "(browser default)", "| chars:", text.length);

    // Pre-split words once so both reveal modes share the same array.
    const words = text.split(/\s+/).filter(Boolean);
    // Track whether onboundary has fired at least once for this utterance.
    // If it does, the timer is no longer needed and is cancelled.
    let boundaryFired = false;

    // ── onstart: begin timed word-reveal immediately ──────────────────────────
    // Estimated rate: 150 WPM → 400 ms per word. We reveal one word at a time
    // via accumulation so the displayed string grows left-to-right.
    utterance.onstart = () => {
      console.log("[TTS] onstart fired | words:", words.length);
      setDisplayedText("");   // start empty; first word appears after ~400 ms

      let wordIndex = 0;
      // Build a running prefix so we don't re-join the array every tick.
      let revealed = "";

      revealTimerRef.current = setInterval(() => {
        if (wordIndex >= words.length) { clearRevealTimer(); return; }
        revealed = wordIndex === 0 ? words[0] : revealed + " " + words[wordIndex];
        wordIndex++;
        setDisplayedText(revealed);
      }, 400); // ~150 WPM
    };

    // ── onboundary: fired by Chrome for "Google US English" and some others ──
    // charIndex points to the start of the upcoming word inside `text`.
    // We slice *up to* charIndex (what has already been spoken) and add the
    // upcoming word so the user sees it just as it's being said.
    utterance.onboundary = (event) => {
      console.log(`[TTS] onboundary: name=${event.name} charIndex=${event.charIndex} charLength=${event.charLength ?? "?"}`);

      if (event.name !== "word") return;

      // First boundary event — cancel the fallback timer; boundary is reliable.
      if (!boundaryFired) {
        boundaryFired = true;
        clearRevealTimer();
        console.log("[TTS] onboundary active — timer cancelled, switching to charIndex mode");
      }

      // Show text up to and including the current word.
      const upToWord = text.slice(0, event.charIndex + (event.charLength ?? 1));
      setDisplayedText(upToWord);
    };

    // ── onend: always show the full text (catches the last word) ─────────────
    utterance.onend = () => {
      console.log("[TTS] onend fired");
      clearRevealTimer();
      setDisplayedText(text);   // ensure the last word is always visible
      // Brief pause so the user can read the final word, then clear + continue.
      setTimeout(() => {
        setDisplayedText("");
        onDone?.();
      }, 300);
    };

    // ── onerror: "interrupted" is benign — it fires on the OLD utterance ─────
    // when synth.cancel() is called above. All other errors are real failures.
    utterance.onerror = (event) => {
      if (event.error === "interrupted") {
        // Expected: fired on the utterance we just cancelled. Ignore.
        console.log("[TTS] onerror: interrupted (old utterance cancelled — expected, ignoring)");
        return;
      }
      console.error("[TTS] onerror:", event.error, event);
      clearRevealTimer();
      setDisplayedText("");
      onDone?.();
    };

    // Defer speak() by one macrotask so Chrome's engine has time to settle
    // after cancel() before the new utterance is queued.
    setTimeout(() => {
      console.log("[TTS] synth.speak() | speaking:", synth.speaking, "pending:", synth.pending);
      synth.speak(utterance);
    }, 0);
  };


  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ── Speak the current question whenever it changes (or phase becomes active) ──
  useEffect(() => {
    if (phase !== "active" || !data) return;

    // If interviewerMessage already voiced the next question, skip (don't double-speak).
    if (skipNextSpeakRef.current) {
      skipNextSpeakRef.current = false;
      return;
    }

    // Build the text to speak for this question.
    const questionText =
      currentQ === 0 && !answered.has(0)
        ? `Hi, I'm Zara, your AI interviewer at DevPrep. ${data.questions[currentQ]}`
        : data.questions[currentQ];

    speakWithBoundary(questionText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setIsTranscribing(true);
      let userAnswer = "";
      try {
        // Step 1: transcribe audio
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        const transRes = await fetch("/api/transcribe", { method: "POST", body: formData });
        const transJson = await transRes.json();
        if (!transRes.ok) { setError(transJson.error ?? "Transcription failed."); return; }
        userAnswer = transJson.transcript ?? "";
        setTranscript(userAnswer);
      } catch {
        setError("Network error during transcription.");
        return;
      } finally {
        setIsTranscribing(false);
      }

      // Step 2: send answer to backend → get next question
      setIsSubmitting(true);
      try {
        const sessionId = String(data?.sessionId ?? "");
        if (!sessionId) { setError("Session ID missing."); return; }
        const { data: result } = await api.post<{
          isComplete: boolean;
          interviewerMessage?: string;  // Zara's spoken reply + transition
          question?: string;
          questionNum?: number;
          totalQuestions?: number;
        }>("/api/interview/answer", { sessionId, answer: userAnswer });

        if (result.isComplete) {
          streamRef.current?.getTracks().forEach(t => t.stop());
          if (result.interviewerMessage) {
            speakWithBoundary(result.interviewerMessage, () => setPhase("done"));
          } else {
            setPhase("done");
          }
          return;
        }

        // Append next question to the local array
        if (result.question) {
          setData(prev => prev ? { ...prev, questions: [...prev.questions, result.question!] } : prev);
        }
        if (result.totalQuestions) setTotalQuestions(result.totalQuestions);
        setAnswered(prev => new Set([...prev, currentQ]));

        // Speak Zara's reply + transition (which already contains the next question).
        // Set the skip flag so useEffect([currentQ]) doesn't double-speak.
        if (result.interviewerMessage && ttsSupported) {
          skipNextSpeakRef.current = true;
          speakWithBoundary(result.interviewerMessage);
        }
        setCurrentQ(q => q + 1);
      } catch (e: any) {
        setError(e?.response?.data?.error ?? "Failed to submit answer. Please try again.");
      } finally {
        setIsSubmitting(false);
      }

    };

    recorder.start();
    setIsRecording(true);
    // Start silence detection — auto-submits after 2 s of quiet
    startSilenceDetection(streamRef.current);
  };

  // ── Auto-start recording the moment Zara finishes speaking ───────────────────
  // Watches the falling edge of aiSpeaking (displayedText: non-empty → empty)
  // and fires startQuestionRecording.
  useEffect(() => {
    const wasSpeak = prevIsSpeakingRef.current;
    prevIsSpeakingRef.current = aiSpeaking;
    console.log(`[REC] aiSpeaking changed: wasSpeak=${wasSpeak} aiSpeaking=${aiSpeaking} phase=${phase} isRecording=${isRecording} isSubmitting=${isSubmitting}`);
    if (wasSpeak && !aiSpeaking && phase === "active" && !isRecording && !isSubmitting) {
      console.log("[REC] Falling edge detected → startQuestionRecording()");
      startQuestionRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiSpeaking]);


  const toggleMic = () => { streamRef.current?.getAudioTracks().forEach(t => (t.enabled = !micOn)); setMicOn(m => !m); };
  const toggleCam = () => { streamRef.current?.getVideoTracks().forEach(t => (t.enabled = !camOn)); setCamOn(c => !c); };

  // ── Silence detection — adaptive threshold ──────────────────────────────────
  // Calibrates noise floor during first 1000 ms, then sets threshold at
  // 1.5× ambient level. Auto-submits after 10 s silence (<60 s recording)
  // or 5 s silence (≥60 s recording).

  const stopSilenceDetection = () => {
    if (silenceRafRef.current !== null) { cancelAnimationFrame(silenceRafRef.current); silenceRafRef.current = null; }
    if (silenceTimerRef.current !== null) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
  };

  const startSilenceDetection = (stream: MediaStream) => {
    stopSilenceDetection();
    // Reset calibration state for this recording session
    noiseFloorRef.current = null;
    calibrationSamples.current = [];
    silenceStartTime.current = null;
    recordingStartTime.current = Date.now();

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;

        const totalRecording = Date.now() - recordingStartTime.current;

        // CALIBRATION PHASE — first 1000 ms, just observe
        if (totalRecording < 1000) {
          calibrationSamples.current.push(avg);
          silenceRafRef.current = requestAnimationFrame(tick);
          return;
        }

        // SET NOISE FLOOR — once, right after calibration ends
        if (noiseFloorRef.current === null) {
          const samples = calibrationSamples.current;
          const measured = samples.reduce((a, b) => a + b, 0) / samples.length;
          noiseFloorRef.current = measured * 1.5; // 50% headroom above ambient noise
        }

        const threshold = noiseFloorRef.current;

        // SILENCE DETECTION — adaptive threshold
        if (avg > threshold) {
          silenceStartTime.current = null;
        } else {
          if (silenceStartTime.current === null) {
            silenceStartTime.current = Date.now();
          }
          const silenceDuration = Date.now() - silenceStartTime.current;

          if (totalRecording < 60000 && silenceDuration >= 10000) stopAndSubmit();
          if (totalRecording >= 60000 && silenceDuration >= 5000) stopAndSubmit();
        }

        silenceRafRef.current = requestAnimationFrame(tick);
      };

      silenceRafRef.current = requestAnimationFrame(tick);
    } catch {
      // AudioContext unavailable — silence detection skipped gracefully
    }
  };

  // ── Stop recording → triggers onstop → transcribe → submit to backend ─────────
  const stopAndSubmit = () => {
    stopSilenceDetection();
    // Reset adaptive calibration state
    noiseFloorRef.current = null;
    calibrationSamples.current = [];
    silenceStartTime.current = null;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };


  // ── End interview — kill recorder silently (no transcription) + release mic ───
  const endInterview = () => {
    // Stop any TTS that may be playing.
    cancelSpeech();
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

  if (!data) {
    return (
      <div className="min-h-screen bg-brand-bg text-white flex items-center justify-center">
        <p className="text-brand-muted text-sm">Loading session…</p>
      </div>
    );
  }

  // ── SETUP ────────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-brand-bg text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-white/[0.03] blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-1.5 font-display text-base font-bold tracking-tighter mb-10">
          <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} className="rounded-sm" style={{ mixBlendMode: "lighten" }} />
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
            "Your microphone will be used to capture your answers",
            "Zara will speak each question — just respond naturally",
            "When you\'re done answering, click \'Done →\' to submit",
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
          <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} className="rounded-sm" style={{ mixBlendMode: "lighten" }} />
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

      {/* ── TTS not-supported banner (shown once, non-blocking) ── */}
      {!ttsSupported && (
        <div className="relative z-20 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-400">
          <Volume2 size={12} />
          Your browser doesn&apos;t support text-to-speech — questions will appear as text only.
        </div>
      )}

      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between px-10 pt-5 pb-4 border-b border-white/[0.06] relative z-10 flex-shrink-0">
        {/* Logo + role */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-tighter">
            <Image src="/devprep-logo.png" alt="DevPrep logo" width={22} height={22} className="rounded-sm" style={{ mixBlendMode: "lighten" }} />
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

          {/* Camera feed — compact fixed size matching reference */}
          <div className="w-full h-[280px] rounded-2xl border border-white/[0.08] overflow-hidden bg-black relative flex-shrink-0">
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

          {/* Question text — word-by-word via onboundary */}
          {displayedText && (
            <div className="max-w-lg w-full mb-6">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {currentQ === 0 && !answered.has(0) && (
                  <p className="text-[11px] font-mono tracking-widest text-white/40 uppercase mb-3">
                    Zara · AI Interviewer
                  </p>
                )}
                <p
                  className="text-[13px] leading-[1.8] tracking-wide"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: "rgba(255,255,255,0.82)" }}
                >
                  {displayedText}
                </p>
              </motion.div>
            </div>
          )}

          {/* Recording status — auto-starts when Zara finishes; auto-submits on silence */}
          {isSubmitting ? (
            <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-3.5 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white/70 flex-shrink-0"
              />
              <span
                className="text-[13px] tracking-wide"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: "rgba(255,255,255,0.5)" }}
              >
                Evaluating your answer…
              </span>
            </div>
          ) : isRecording ? (
            <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3.5 flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
              />
              <span
                className="text-[13px] tracking-wide"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: "rgba(255,255,255,0.82)" }}
              >
                Recording…
              </span>
            </div>
          ) : (
            <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-white/[0.01] px-5 py-3.5 flex items-center gap-3">
              {aiSpeaking ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"
                  />
                  <span
                    className="text-[13px] tracking-wide"
                    style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: "rgba(255,255,255,0.4)" }}
                  >
                    Zara is speaking…
                  </span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="w-2 h-2 rounded-full bg-white/30 flex-shrink-0"
                  />
                  <span
                    className="text-[13px] tracking-wide"
                    style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: "rgba(255,255,255,0.4)" }}
                  >
                    Waiting for microphone…
                  </span>
                </>
              )}
            </div>
          )}


          {!isTranscribing && error && (
            <div className="w-full max-w-lg mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-5 py-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <p className="mt-3 text-xs text-brand-muted font-mono">
            Question {currentQ + 1} of {totalQuestions}
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
