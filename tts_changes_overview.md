# Speech Synthesis — Code Added

Two files were touched. No existing logic was removed — only new code was layered on top.

---

## File 1 — NEW FILE (created from scratch)

**Path:** `apps/web/hooks/useSpeechSynthesis.ts`

```typescript
/**
 * useSpeechSynthesis
 *
 * A clean, modular hook that wraps the browser's native Web Speech API
 * (window.speechSynthesis). Designed to:
 *   - Detect whether the API is supported before doing anything.
 *   - Expose a `speak()` function that cancels any in-progress utterance,
 *     then speaks the provided text.
 *   - Expose a `cancel()` function to stop speech immediately.
 *   - Track `isSpeaking` so the UI can react (e.g. animate the AI orb).
 *   - Handle the infamous Chrome/Edge bug where `getVoices()` returns [] on
 *     first call — we retry once the `voiceschanged` event fires.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechOptions {
  /** BCP 47 language tag, e.g. "en-US". Defaults to "en-US". */
  lang?: string;
  /** Speaking rate. 1 = normal, 0.5 = slow, 2 = fast. */
  rate?: number;
  /** Pitch. 1 = normal, 0 = low, 2 = high. */
  pitch?: number;
  /** Volume. 1 = full, 0 = silent. */
  volume?: number;
  /**
   * Preferred voice name substring (case-insensitive match).
   * If no match is found the browser's default voice is used.
   * Example: "Google UK English Female"
   */
  preferredVoice?: string;
}

export interface UseSpeechSynthesisReturn {
  /** Whether the browser supports the SpeechSynthesis API. */
  isSupported: boolean;
  /** True while an utterance is being spoken. */
  isSpeaking: boolean;
  /** Speak the given text, cancelling any current utterance first. */
  speak: (text: string, options?: SpeechOptions) => void;
  /** Cancel any speech that is currently playing. */
  cancel: () => void;
}

const DEFAULT_OPTIONS: Required<SpeechOptions> = {
  lang: "en-US",
  rate: 0.95,
  pitch: 1.05,
  volume: 1,
  preferredVoice: "",
};

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cache available voices so we don't call getVoices() on every speak().
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load voices once; in Chrome they're async so we also listen for the event.
  useEffect(() => {
    if (!isSupported) return;

    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const v = synth.getVoices();
      if (v.length > 0) voicesRef.current = v;
    };

    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);

    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
    };
  }, [isSupported]);

  // Cancel any ongoing speech when the component that owns this hook unmounts.
  useEffect(() => {
    if (!isSupported) return;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  /** Pick a voice from the cached list that best matches `preferredVoice`. */
  const resolveVoice = useCallback(
    (preferredVoice: string, lang: string): SpeechSynthesisVoice | null => {
      const voices = voicesRef.current;
      if (voices.length === 0) return null;

      if (preferredVoice) {
        const match = voices.find((v) =>
          v.name.toLowerCase().includes(preferredVoice.toLowerCase())
        );
        if (match) return match;
      }

      // Fallback: first voice whose lang matches (prefix match so "en-US"
      // matches voices tagged "en_US" or "en-US").
      const langMatch = voices.find((v) =>
        v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())
      );
      return langMatch ?? null;
    },
    []
  );

  const speak = useCallback(
    (text: string, options?: SpeechOptions) => {
      if (!isSupported || !text.trim()) return;

      const synth = window.speechSynthesis;
      const opts = { ...DEFAULT_OPTIONS, ...options };

      // Cancel whatever is currently playing.
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = opts.lang;
      utterance.rate = opts.rate;
      utterance.pitch = opts.pitch;
      utterance.volume = opts.volume;

      const voice = resolveVoice(opts.preferredVoice, opts.lang);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend   = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synth.speak(utterance);
    },
    [isSupported, resolveVoice]
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, cancel };
}
```

---

## File 2 — EXISTING FILE (4 small additions only)

**Path:** `apps/web/app/dashboard/ai-interview/[role]/session/page.tsx`

### Addition 1 — new import at the top

```tsx
// Added Volume2 icon + the new hook import
import {
  Mic, MicOff, Clock3, PhoneOff, AlertOctagon,
  VideoOff, CheckCircle2, ChevronDown, Volume2,   // ← Volume2 added
} from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis"; // ← new import
```

---

### Addition 2 — hook call + aiSpeaking wiring (~line 61)

```tsx
// ── Speech Synthesis ─────────────────────────────────────────────────────────
const { isSupported: ttsSupported, isSpeaking, speak, cancel: cancelSpeech } =
  useSpeechSynthesis();

// ...existing state...

// aiSpeaking is now driven by real TTS state; fallback to a brief timeout
// when TTS is not available so the orb still animates.
const [aiSpeakingFallback, setAiSpeakingFallback] = useState(false);
const aiSpeaking = ttsSupported ? isSpeaking : aiSpeakingFallback;
//                 ^^^^^^^^^^^^   ^^^^^^^^^
//                 real TTS       OR fallback timeout
```

> `aiSpeaking` was previously a plain `useState`. Now it's derived from TTS
> state so the AI orb pulses exactly as long as speech plays.

---

### Addition 3 — useEffect that auto-speaks every question (~line 86)

```tsx
// ── Speak the current question whenever it changes (or phase becomes active) ─
useEffect(() => {
  if (phase !== "active" || !data) return;

  setShowText(false);

  // Build the exact text Zara will say.
  const questionText =
    currentQ === 0 && !answered.has(0)
      ? `Hi, I'm Zara, your AI interviewer at DevPrep. ${data.questions[currentQ]}`
      : data.questions[currentQ];

  if (ttsSupported) {
    // Speak it. onstart/onend callbacks in the hook update isSpeaking → aiSpeaking.
    speak(questionText, { rate: 0.92, pitch: 1.05 });

    // Reveal the question text proportional to its length (feels natural).
    const revealDelay = Math.min(questionText.length * 40, 1800);
    const t = setTimeout(() => setShowText(true), revealDelay);
    return () => clearTimeout(t);

  } else {
    // TTS unavailable — keep the old timeout-based orb animation.
    setAiSpeakingFallback(true);
    const t1 = setTimeout(() => setAiSpeakingFallback(false), 1800);
    const t2 = setTimeout(() => setShowText(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentQ, phase]);   // ← fires on every question change AND when interview starts
```

---

### Addition 4 — cancel TTS on end-interview + unsupported banner

```tsx
// In endInterview() — two lines added at the top:
const endInterview = () => {
  cancelSpeech();   // ← stops any TTS before navigating away
  // ...rest unchanged...
};

// In the JSX — shown only when TTS is unavailable (non-blocking amber banner):
{!ttsSupported && (
  <div className="relative z-20 flex items-center justify-center gap-2 px-4 py-2
                  bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-400">
    <Volume2 size={12} />
    Your browser doesn&apos;t support text-to-speech — questions will appear as text only.
  </div>
)}
```

---

## Summary of What Each Piece Does

| Piece | What it does |
|---|---|
| `useSpeechSynthesis.ts` | Self-contained hook; wraps `window.speechSynthesis`; handles voices, state, cleanup |
| Import additions | Brings the hook + `Volume2` icon into the session page |
| Hook call + `aiSpeaking` | Replaces the hard-coded `useState(false)` with live TTS state |
| `useEffect` (speak) | Fires whenever the question index or phase changes; speaks the question automatically |
| `cancelSpeech()` in `endInterview` | Stops audio if user clicks "End Interview" mid-speech |
| Amber banner | Graceful fallback UI when the browser has no Speech API support |
