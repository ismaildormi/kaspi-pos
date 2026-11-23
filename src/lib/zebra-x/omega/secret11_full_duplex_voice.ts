export type DuplexVoiceState = "idle" | "listening" | "thinking" | "speaking" | "interrupted_barge_in";

export interface VoiceLocaleProfile {
  locale: "ar" | "fr" | "en";
  edgeTtsVoice: string;
  kokoroFallbackVoice: string;
  targetFirstAudioChunkMs: number;
}

export interface VadBargeInTelemetry {
  previousState: DuplexVoiceState;
  nextState: DuplexVoiceState;
  rmsAmplitude: number;
  bargeInTriggered: boolean;
  reactionLatencyMs: number;
  voiceProfile: VoiceLocaleProfile;
}

const VOICE_PROFILES: Record<"ar" | "fr" | "en", VoiceLocaleProfile> = {
  ar: {
    locale: "ar",
    edgeTtsVoice: "ar-MA-MounaNeural",
    kokoroFallbackVoice: "af_bella",
    targetFirstAudioChunkMs: 140,
  },
  fr: {
    locale: "fr",
    edgeTtsVoice: "fr-FR-DeniseNeural",
    kokoroFallbackVoice: "ff_siwis",
    targetFirstAudioChunkMs: 120,
  },
  en: {
    locale: "en",
    edgeTtsVoice: "en-US-AvaNeural",
    kokoroFallbackVoice: "af_heart",
    targetFirstAudioChunkMs: 110,
  },
};

/**
 * Secret #11 (`v88.0`): Sub-200ms Full-Duplex Voice + VAD Barge-In State Machine.
 * Computes live frame RMS against Silero-style amplitude gate so talking interrupts active TTS
 * playback cleanly inside browser WebAudio/Stream Realtime without waiting for sentence end.
 */
export function evaluateVadBargeInFrame(params: {
  samples: number[];
  currentState: DuplexVoiceState;
  locale?: "ar" | "fr" | "en";
  speechThreshold?: number;
}): VadBargeInTelemetry {
  const t0 = performance.now();
  const samples = Array.isArray(params.samples) ? params.samples : [];
  const threshold = params.speechThreshold ?? 0.035;
  const profile = VOICE_PROFILES[params.locale || "ar"];

  let sq = 0;
  for (let i = 0; i < samples.length; i++) {
    sq += samples[i] * samples[i];
  }
  const rms = samples.length > 0 ? Math.sqrt(sq / samples.length) : 0;
  const voiceActive = rms >= threshold;
  const bargeInTriggered = voiceActive && params.currentState === "speaking";

  const nextState: DuplexVoiceState = bargeInTriggered
    ? "interrupted_barge_in"
    : voiceActive
    ? "listening"
    : params.currentState;

  return {
    previousState: params.currentState,
    nextState,
    rmsAmplitude: Number(rms.toFixed(5)),
    bargeInTriggered,
    reactionLatencyMs: Number((performance.now() - t0).toFixed(3)),
    voiceProfile: profile,
  };
}
