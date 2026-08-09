"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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

const sansStyle = {
  fontFamily: "var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif)",
} as const;

const monoStyle = {
  fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
} as const;

const EASE = [0.25, 0.8, 0.25, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

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
  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const slug = rawRole ?? "";

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
        const currentWord = words[wordIndex] ?? "";
        revealed = wordIndex === 0 ? currentWord : `${revealed} ${currentWord}`;
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
    const qText = data.questions[currentQ] ?? "";
    const questionText =
      currentQ === 0 && !answered.has(0)
        ? `Hi, I'm Zara, your AI interviewer at DevPrep. ${qText}`
        : qText;

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
  if (phase === "setup") return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] flex flex-col items-center justify-center relative overflow-hidden antialiased font-sans">
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex items-center gap-2 font-bold tracking-tight mb-8"
        >
          <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} unoptimized className="rounded-sm" />
          <span className="text-[15px] font-bold text-[#1A1A1A] tracking-[-0.01em]">DevPrep</span>
        </motion.div>

        {/* Zara Avatar Orb (Clean Light Surface per design.md) */}
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

        {/* Headline — Sentence Case Inter Font matching design.md */}
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
          Starting a <span className="text-[#1A1A1A] font-semibold">{data.title}</span> practice interview —{" "}
          {data.questions.length} questions, ~{data.duration} mins.
        </motion.p>

        {/* Restyled Checklist Card with Light Surface & Flat Icons per design.md */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
          className="w-full bg-white border border-[#E5E5E5] rounded-2xl p-6 text-left space-y-4 mb-8 shadow-sm"
        >
          {[
            "Your microphone will be used to capture your answers",
            "Zara will speak each question — just respond naturally",
            "When you're done answering, click 'Done →' to submit",
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

        {/* Primary CTA — Sentence Case Inter Font matching role & landing page */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: EASE }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPhase("active")}
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

  // ── DONE SCREEN ──────────────────────────────────────────────────────────────
  if (phase === "done") return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] flex flex-col items-center justify-center px-6 relative overflow-hidden antialiased font-sans">
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full py-12">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold tracking-tight mb-8">
          <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} unoptimized className="rounded-sm" />
          <span className="text-[15px] font-bold text-[#1A1A1A] tracking-[-0.01em]">DevPrep</span>
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
                <CheckCircle2 size={13} className={`mt-0.5 flex-shrink-0 ${answered.has(i) ? "text-[#22C55E]" : "text-[#666666]/30"}`} />
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
            onClick={() => { setPhase("setup"); setCurrentQ(0); setAnswered(new Set()); setElapsed(0); setIsRecording(false); }}
            className="flex-1 py-3.5 rounded-full bg-[#1A1A1A] hover:bg-black text-white text-[14px] font-semibold active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );

  // ── ACTIVE INTERVIEW ──────────────────────────────────────────────────────────
  const topicTabs = data.skills.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] overflow-hidden relative flex flex-col antialiased font-sans">
      {/* ── TTS not-supported banner (shown once, non-blocking) ── */}
      {!ttsSupported && (
        <div className="relative z-20 flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          <Volume2 size={12} />
          <span>Your browser doesn&apos;t support text-to-speech — questions will appear as text only.</span>
        </div>
      )}

      {/* ── TOP NAV (Clean Light Theme) ── */}
      <div className="flex items-center justify-between px-8 pt-4 pb-3.5 border-b border-[#E5E5E5] relative z-10 flex-shrink-0 bg-white shadow-xs">
        {/* Logo + role */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <Image src="/devprep-logo.png" alt="DevPrep logo" width={22} height={22} unoptimized className="rounded-sm" />
            <span className="text-sm font-bold text-[#1A1A1A] tracking-[-0.01em]">DevPrep</span>
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
              <p className="text-xs text-[#666666] font-medium mb-1.5 truncate max-w-[140px]">{item}</p>
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
          <span className="text-xs font-semibold text-[#1A1A1A] tracking-wide">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* ── MAIN 2-COL (Light Cards) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 pt-6 pb-6 relative z-10 flex-1 min-h-0 items-center max-w-6xl mx-auto w-full">

        {/* LEFT – camera */}
        <div className="flex flex-col gap-4 min-h-0 w-full max-w-md mx-auto lg:max-w-none">
          {/* Mic bar matching design system card specs */}
          <div className="border border-[#E5E5E5] rounded-xl bg-white px-4.5 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <Mic size={14} className={micOn ? "text-[#EB3A14]" : "text-rose-500"} />
              <p className="text-xs font-semibold text-[#1A1A1A]">
                {micOn ? "Mic active" : "Mic muted"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleMic} className="cursor-pointer hover:opacity-80 transition-opacity">
                {micOn ? <Mic size={14} className="text-[#666666]" /> : <MicOff size={14} className="text-rose-500" />}
              </button>
              {micOn && (
                <div className="flex gap-[3px] items-end h-4">
                  {[6, 12, 8, 14, 10, 12].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [h, h + 6, h] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                      className="w-[3px] rounded-full bg-[#EB3A14]"
                      style={{ height: h }}
                    />
                  ))}
                </div>
              )}
              <button onClick={toggleCam} className="cursor-pointer hover:opacity-80 transition-opacity">
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
              className={`w-full h-full object-cover ${camOn && !camError ? "opacity-95" : "opacity-0 absolute"}`}
            />
            {camOn && !camError && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-[#E5E5E5] rounded-full px-3 py-1 flex items-center gap-2 z-10 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                <span className="text-[11px] font-semibold text-[#1A1A1A]">
                  Camera preview
                </span>
              </div>
            )}
            {(!camOn || camError) && (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F7] border border-[#E5E5E5] flex items-center justify-center text-[#666666]">
                  <VideoOff size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A]">
                    {camError ? "Camera access blocked" : "Camera preview off"}
                  </p>
                  <p className="text-[11px] text-[#666666] mt-1 max-w-[220px]">
                    {camError ? "Audio interview mode active" : "Toggle controls anytime during the session"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 flex-shrink-0 px-1">
            <div className={`w-2 h-2 rounded-full ${camError ? "bg-amber-500" : "bg-[#22C55E]"}`} />
            <p className="text-[#666666] text-xs font-medium">
              {camError ? "Camera denied — audio interview mode active" : "Camera and microphone connected"}
            </p>
          </div>
        </div>

        {/* RIGHT – AI + Question Area */}
        <div className="flex flex-col items-center justify-center relative w-full max-w-md mx-auto lg:max-w-none py-4">
          {/* AI Zara Avatar Orb (Clean light design system treatment) */}
          <div className="relative flex items-center justify-center mb-8">
            <motion.div
              animate={{ scale: aiSpeaking ? [1, 1.05, 1] : [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: aiSpeaking ? 0.6 : 2.5, ease: "easeInOut" }}
              className="relative w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center border border-[#E5E5E5]"
            >
              <span className="text-3xl font-extrabold text-[#1A1A1A]">
                D<span className="text-[#EB3A14]">.</span>
              </span>
            </motion.div>
          </div>

          {/* Question text — Inter typeface with animated reveal */}
          <div className="max-w-lg w-full mb-6 text-center min-h-[90px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {displayedText ? (
                <motion.div
                  key={`${currentQ}-${displayedText.length}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  {currentQ === 0 && !answered.has(0) && (
                    <p className="text-[11px] font-semibold text-[#EB3A14] uppercase tracking-[0.08em] mb-2">
                      Zara · AI Interviewer
                    </p>
                  )}
                  <p className="text-[16px] sm:text-[18px] leading-relaxed text-[#1A1A1A] font-semibold tracking-[-0.015em]">
                    {displayedText}
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="text-sm text-[#666666] font-normal italic"
                >
                  Question text will appear here as Zara speaks...
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Session Status Pill */}
          {isSubmitting ? (
            <div className="w-full max-w-lg rounded-2xl border border-[#E5E5E5] bg-white px-5 py-3.5 flex items-center justify-center gap-3 shadow-xs">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-3.5 h-3.5 rounded-full border-2 border-[#E5E5E5] border-t-[#EB3A14] flex-shrink-0"
              />
              <span className="text-xs font-semibold text-[#1A1A1A]">
                Evaluating your answer…
              </span>
            </div>
          ) : isRecording ? (
            <div className="w-full max-w-lg rounded-2xl border border-[#EB3A14]/30 bg-white px-5 py-3.5 flex items-center justify-center gap-3 shadow-xs">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2.5 h-2.5 rounded-full bg-[#EB3A14] flex-shrink-0"
              />
              <span className="text-xs font-semibold text-[#EB3A14]">
                Recording your answer… (speak naturally)
              </span>
            </div>
          ) : (
            <div className="w-full max-w-lg rounded-2xl border border-[#E5E5E5] bg-white px-5 py-3.5 flex items-center justify-center gap-3 shadow-xs">
              {aiSpeaking ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-2.5 h-2.5 rounded-full bg-[#EB3A14] flex-shrink-0"
                  />
                  <span className="text-xs font-semibold text-[#1A1A1A]">
                    Zara is speaking…
                  </span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="w-2 h-2 rounded-full bg-[#666666]/40 flex-shrink-0"
                  />
                  <span className="text-xs font-medium text-[#666666]">
                    Listening for response…
                  </span>
                </>
              )}
            </div>
          )}

          {!isTranscribing && error && (
            <div className="w-full max-w-lg mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            </div>
          )}

          <p className="mt-4 text-xs text-[#666666] font-medium">
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
            onClick={() => alert("Troubleshooting Tip: Make sure your microphone permission is granted in the browser address bar. If audio stops, you can refresh the page safely.")}
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

