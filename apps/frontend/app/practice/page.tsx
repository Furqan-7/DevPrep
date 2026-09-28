"use client";

import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";

export default function PracticePage() {
  const {
    isInterviewActive,
    vadState,
    speechEnergy,
    silenceProgress,
    turnCount,
    isTranscribing,
    isAiResponding,
    isTtsSpeaking,
    wsStatus,
    transcript,
    aiResponse,
    firstTokenLatencyMs,
    aiModelUsed,
    ttsMetrics,
    ttsAudioBytes,
    error,
    startInterview,
    endInterview,
  } = useRealtimeVoice();

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] p-6 sm:p-10 flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl w-full bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Realtime Voice Pipeline Test
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Route: /practice (Step 6: Automatic VAD Turn Detection)</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                wsStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : wsStatus === "connecting"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-gray-300"
              }`}
            />
            <span className="text-xs font-medium text-gray-500 capitalize">
              {wsStatus}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          <strong>Automatic Turn Detection:</strong> Click &ldquo;Start Interview&rdquo; once. Speak naturally — Voice Activity Detection (VAD) automatically senses when you finish speaking (~800ms continuous silence), finalizes the turn, sends it to <strong>Groq Whisper</strong>, streams from <strong>Gemini</strong>, and plays audio from <strong>Deepgram Aura-2</strong>. The microphone stays active for the next turn automatically!
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Action Controls & Turn Badge */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {!isInterviewActive ? (
            <button
              onClick={startInterview}
              className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer bg-black text-white hover:bg-neutral-800 active:scale-[0.98]"
            >
              Start Interview (Hands-Free VAD)
            </button>
          ) : (
            <button
              onClick={endInterview}
              className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-[0.98]"
            >
              End Interview Session
            </button>
          )}

          {isInterviewActive && (
            <div className="flex items-center gap-2 px-4 py-3 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-mono font-bold text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Turn #{turnCount}
            </div>
          )}
        </div>

        {/* Dynamic VAD State Card */}
        {isInterviewActive && (
          <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  VAD Engine State:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                    vadState === "speaking"
                      ? "bg-red-100 text-red-700 animate-pulse"
                      : vadState === "silence_detecting"
                      ? "bg-amber-100 text-amber-800"
                      : vadState === "processing"
                      ? "bg-blue-100 text-blue-800"
                      : vadState === "ai_speaking"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {vadState === "speaking"
                    ? "🎙️ User Speaking"
                    : vadState === "silence_detecting"
                    ? "⏳ Silence Detecting (~800ms)"
                    : vadState === "processing"
                    ? "⚙️ Processing Turn"
                    : vadState === "ai_speaking"
                    ? "🔊 AI Speaking"
                    : "🟢 Listening for Speech..."}
                </span>
              </div>
              <div className="text-[11px] font-mono text-gray-500">
                Silence Thresh: 800ms · Min Speech: 300ms
              </div>
            </div>

            {/* Live Audio Energy & Silence Countdown Bars */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
                  <span>Mic Energy (RMS)</span>
                  <span>{(speechEnergy * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      vadState === "speaking" ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, speechEnergy * 100)}%` }}
                  />
                </div>
              </div>

              {vadState === "silence_detecting" && (
                <div>
                  <div className="flex justify-between text-[10px] text-amber-700 font-mono mb-1">
                    <span>Continuous Silence Progress</span>
                    <span>{(silenceProgress * 100).toFixed(0)}% (Finalizing at 100%)</span>
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-75"
                      style={{ width: `${Math.min(100, silenceProgress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time Pipeline Latency Metrics (Step 7: Concurrent Streaming) */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Pipeline Latency Breakdown (Step 7 Concurrent Streaming)
            </span>
            {ttsMetrics?.userStopToFirstAudioMs !== undefined && (
              <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ⚡ Turn E2E: {ttsMetrics.userStopToFirstAudioMs}ms
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[10px] font-medium text-gray-500">Groq Whisper</div>
              <div className="text-base font-bold text-gray-700 mt-0.5 font-mono">
                {ttsMetrics?.groqLatencyMs !== undefined ? `${ttsMetrics.groqLatencyMs}ms` : "—"}
              </div>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[10px] font-medium text-gray-500">Gemini TTFT</div>
              <div className="text-base font-bold text-emerald-600 mt-0.5 font-mono">
                {firstTokenLatencyMs !== null
                  ? `${firstTokenLatencyMs}ms`
                  : ttsMetrics?.firstTokenLatencyMs !== undefined
                  ? `${ttsMetrics.firstTokenLatencyMs}ms`
                  : "—"}
              </div>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[10px] font-medium text-gray-500">1st Text → TTS</div>
              <div className="text-base font-bold text-blue-600 mt-0.5 font-mono">
                {ttsMetrics?.firstTextToDeepgramLatencyMs !== undefined
                  ? `${ttsMetrics.firstTextToDeepgramLatencyMs}ms`
                  : "—"}
              </div>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[10px] font-medium text-gray-500">Deepgram TTFA</div>
              <div className="text-base font-bold text-amber-600 mt-0.5 font-mono">
                {ttsMetrics?.timeToFirstAudioMs !== undefined ? `${ttsMetrics.timeToFirstAudioMs}ms` : "—"}
              </div>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[10px] font-medium text-gray-500">Audio Duration</div>
              <div className="text-base font-bold text-purple-600 mt-0.5 font-mono">
                {ttsMetrics?.audioDurationSec !== undefined ? `${ttsMetrics.audioDurationSec.toFixed(1)}s` : "—"}
              </div>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="text-[10px] font-medium text-gray-500">Total Turn Time</div>
              <div className="text-base font-bold text-indigo-600 mt-0.5 font-mono">
                {ttsMetrics?.totalTurnDurationMs !== undefined ? `${ttsMetrics.totalTurnDurationMs}ms` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        {isTranscribing && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-amber-600 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            VAD finalized turn — transcribing audio with Groq Whisper...
          </div>
        )}

        {isAiResponding && !aiResponse && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Gemini streaming requested — awaiting first token...
          </div>
        )}

        {isTtsSpeaking && (
          <div className="mt-6 flex items-center justify-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold">
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-4 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2 bg-purple-600 rounded-full animate-bounce" />
            </div>
            <span>Zara Voice Playing (Deepgram Aura-2 · 24kHz Linear16 PCM)</span>
            <span className="text-[10px] text-purple-600 font-mono">{(ttsAudioBytes / 1024).toFixed(1)} KB streamed</span>
          </div>
        )}

        {/* User Transcript */}
        {transcript && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                User Said (Groq Whisper · Turn #{turnCount})
              </span>
            </div>
            <p className="text-sm text-emerald-950 font-medium leading-relaxed">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>
        )}

        {/* Gemini Streaming AI Response */}
        {(aiResponse || isAiResponding) && (
          <div className="mt-4 p-5 rounded-xl bg-[#F0F7FF] border border-[#BFDBFE]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse" />
                Zara (Gemini Streaming)
                {aiModelUsed && <span className="text-[10px] text-blue-600/70 font-normal">({aiModelUsed})</span>}
              </span>
              {firstTokenLatencyMs !== null && (
                <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded font-medium">
                  TTFT: {firstTokenLatencyMs}ms
                </span>
              )}
            </div>
            <p className="text-sm text-[#1E3A8A] font-normal leading-relaxed whitespace-pre-wrap">
              {aiResponse}
              {isAiResponding && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-blue-600 animate-pulse align-middle" />
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}