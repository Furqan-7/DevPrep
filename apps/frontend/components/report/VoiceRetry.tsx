"use client";

/**
 * Record a new spoken answer to one question, check the transcript, then send it for
 * scoring. The level meter reads the real microphone signal.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { submitAttempt, transcribe, ReportApiError, type AttemptResult } from "@/lib/interview/report";
import { MicIcon, primaryBtn, secondaryBtn } from "./ui";

const MAX_SECONDS = 180;
const BARS = 32;

type Phase =
  | { name: "idle" }
  | { name: "requesting" }
  | { name: "recording" }
  | { name: "transcribing" }
  | { name: "review"; transcript: string }
  | { name: "scoring"; transcript: string }
  | { name: "error"; message: string; transcript?: string };

export function VoiceRetry({
  questionId,
  onScored,
  onCancel,
}: {
  questionId: number;
  onScored: (result: AttemptResult) => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevels(Array(BARS).fill(0));
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const start = async () => {
    setPhase({ name: "requesting" });
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPhase({ name: "error", message: "Microphone access is blocked. Allow it in your browser's site settings, then try again." });
      return;
    }
    streamRef.current = stream;

    // level meter
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setLevels(Array.from({ length: BARS }, (_, i) => (data[i] ?? 0) / 255));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // recording
    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    recorderRef.current = rec;
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = async () => {
      cleanup();
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
      if (blob.size === 0) {
        setPhase({ name: "error", message: "Nothing was recorded. Please try again." });
        return;
      }
      setPhase({ name: "transcribing" });
      try {
        const text = await transcribe(blob);
        if (!text) setPhase({ name: "error", message: "We didn't catch anything. Try again a little closer to the mic." });
        else setPhase({ name: "review", transcript: text });
      } catch (err) {
        setPhase({ name: "error", message: err instanceof ReportApiError ? err.message : "We couldn't transcribe that recording." });
      }
    };
    rec.start();
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stop();
        return s + 1;
      });
    }, 1000);
    setPhase({ name: "recording" });
  };

  const send = async (transcript: string) => {
    setPhase({ name: "scoring", transcript });
    try {
      onScored(await submitAttempt(questionId, transcript));
    } catch (err) {
      setPhase({ name: "error", transcript, message: err instanceof ReportApiError ? err.message : "Couldn't score your answer. Please try again." });
    }
  };

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mt-4 rounded-[14px] bg-[#0a0a0a] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" aria-live="polite">
      {(phase.name === "idle" || phase.name === "requesting") && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={start} disabled={phase.name === "requesting"} className={primaryBtn}>
            <MicIcon />
            {phase.name === "requesting" ? "Waiting for microphone…" : "Start recording"}
          </button>
          <button type="button" onClick={onCancel} className={secondaryBtn}>
            Cancel
          </button>
          <p className="m-0 w-full text-[12.5px] text-white/45">Answer out loud, like in the interview. You&rsquo;ll see the transcript before it&rsquo;s scored.</p>
        </div>
      )}

      {phase.name === "recording" && (
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={stop}
            aria-label="Stop recording"
            className="relative grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full bg-[#bec8ff] text-[#0a0a0a] after:absolute after:-inset-1.5 after:animate-ping after:rounded-full after:shadow-[0_0_0_2px_rgba(190,200,255,0.45)] motion-reduce:after:animate-none"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
              <rect x="4" y="4" width="8" height="8" rx="2" fill="currentColor" />
            </svg>
          </button>
          <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden="true">
            {levels.map((l, i) => (
              <i key={i} className="block flex-1 rounded-[3px] bg-[#bec8ff]/60" style={{ height: `${Math.max(12, Math.min(100, l * 130))}%` }} />
            ))}
          </div>
          <span className="w-10 text-right text-[13px] tabular-nums text-white/50">{clock}</span>
          <span className="sr-only">Recording. Press stop when you&rsquo;re done.</span>
        </div>
      )}

      {phase.name === "transcribing" && <Pending label="Transcribing your answer…" />}

      {(phase.name === "review" || phase.name === "scoring" || (phase.name === "error" && phase.transcript)) && (
        <div>
          <div className="mb-1.5 text-[12px] text-white/40">Your new answer</div>
          <p className="m-0 text-[14px] leading-[1.55] text-white/85">{"transcript" in phase ? phase.transcript : ""}</p>
        </div>
      )}

      {phase.name === "review" && (
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          <button type="button" onClick={() => send(phase.transcript)} className={primaryBtn}>
            Score this answer
          </button>
          <button type="button" onClick={start} className={secondaryBtn}>
            <MicIcon />
            Record again
          </button>
          <button type="button" onClick={onCancel} className={secondaryBtn}>
            Cancel
          </button>
        </div>
      )}

      {phase.name === "scoring" && <Pending label="Scoring your new answer…" className="mt-3" />}

      {phase.name === "error" && (
        <div className={phase.transcript ? "mt-3" : ""}>
          <p role="alert" className="m-0 text-[13.5px] text-[#ffb4b4]">
            {phase.message}
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {phase.transcript ? (
              <button type="button" onClick={() => send(phase.transcript!)} className={primaryBtn}>
                Try scoring again
              </button>
            ) : null}
            <button type="button" onClick={start} className={phase.transcript ? secondaryBtn : primaryBtn}>
              <MicIcon />
              Record again
            </button>
            <button type="button" onClick={onCancel} className={secondaryBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pending({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 text-[13px] text-white/55 ${className}`}>
      <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-[#bec8ff] motion-reduce:animate-none" />
      {label}
    </div>
  );
}
