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

/**
 * Prioritised list of high-quality English voices.
 * Searched in order; the first one found on the device is used.
 * Falls back to en-US → any English voice → browser default.
 */
const PRIORITY_VOICES = [
  "Google US English",
  "Microsoft Zira",
  "Microsoft Aria Online (Natural)",
  "Microsoft Jenny Online (Natural)",
  "Microsoft Aria",
  "Samantha",
] as const;

/**
 * Given a list of available SpeechSynthesisVoice objects, return the best
 * English voice according to PRIORITY_VOICES, or null if no voices loaded yet.
 */
function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  preferredVoice?: string
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  // 1. Caller-supplied override takes precedence (case-insensitive substring).
  if (preferredVoice) {
    const match = voices.find((v) =>
      v.name.toLowerCase().includes(preferredVoice.toLowerCase())
    );
    if (match) return match;
  }

  // 2. Walk the priority list — exact name match (case-insensitive).
  for (const name of PRIORITY_VOICES) {
    const found = voices.find(
      (v) => v.name.toLowerCase() === name.toLowerCase()
    );
    if (found) return found;
  }

  // 3. Fallback: first en-US voice.
  const enUS = voices.find((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith("en-us")
  );
  if (enUS) return enUS;

  // 4. Fallback: first voice whose language starts with "en".
  const enAny = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return enAny ?? null;
}

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

  /** Pick a voice from the cached list using PRIORITY_VOICES order. */
  const resolveVoice = useCallback(
    (preferredVoice: string, _lang: string): SpeechSynthesisVoice | null =>
      pickBestVoice(voicesRef.current, preferredVoice || undefined),
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
      utterance.onend = () => setIsSpeaking(false);
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
