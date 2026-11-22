"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseHybridDictationOptions {
  locale: "ar" | "fr" | "en";
  onTranscript: (text: string) => void;
}

/**
 * Hybrid voice dictation hook combining browser Web Speech Recognition with
 * MediaRecorder + `/api/ai/transcribe` Whisper/Gemini fallback so audio input
 * works reliably across Chromium, Firefox, desktop Linux, and mobile browsers.
 */
export function useHybridDictation({ locale, onTranscript }: UseHybridDictationOptions) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [statusError, setStatusError] = useState<string | null>(null);

  const recRef = useRef<any>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechCapturedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupStreams = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      recRef.current?.stop?.();
    } catch {}
    recRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => cleanupStreams, [cleanupStreams]);

  const stop = useCallback(() => {
    setListening(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      recRef.current?.stop?.();
    } catch {}
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      try {
        mediaRecRef.current.stop();
      } catch {}
    } else {
      cleanupStreams();
    }
  }, [cleanupStreams]);

  const toggle = useCallback(async () => {
    if (listening) {
      stop();
      return;
    }

    setStatusError(null);
    speechCapturedRef.current = false;
    chunksRef.current = [];
    setElapsedSec(0);

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let startedAnyCapture = false;

    // Start MediaRecorder first so every browser (including Linux/Firefox) records real audio for Whisper/Gemini
    if (navigator?.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
        const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecRef.current = mr;

        mr.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
        };

        mr.onstop = async () => {
          const capturedBySpeech = speechCapturedRef.current;
          const recordedChunks = [...chunksRef.current];
          cleanupStreams();
          mediaRecRef.current = null;

          if (capturedBySpeech || recordedChunks.length === 0) return;

          const blob = new Blob(recordedChunks, { type: mimeType || "audio/webm" });
          if (blob.size < 200) return;

          setTranscribing(true);
          try {
            const fd = new FormData();
            fd.append("file", blob, "voice-note.webm");
            const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
            const json = await res.json().catch(() => null);
            const txt = String(json?.text || "").trim();
            if (txt) {
              onTranscript(txt);
            } else {
              setStatusError(
                json?.message ||
                  (locale === "ar"
                    ? "تم تسجيل الصوت، لكن خدمة التفريغ الصوتي غير متوفرة حالياً."
                    : "Audio captured; speech transcription service unavailable.")
              );
            }
          } catch {
            setStatusError(
              locale === "ar"
                ? "تعذر إرسال التسجيل الصوتي للخادم."
                : "Could not upload recorded audio."
            );
          } finally {
            setTranscribing(false);
          }
        };

        mr.start(250);
        startedAnyCapture = true;
      } catch {
        // Fallback solely to Web Speech if MediaRecorder stream was denied or unavailable
      }
    }

    if (SR) {
      try {
        const rec = new SR();
        recRef.current = rec;
        rec.lang = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US";
        rec.interimResults = false;
        rec.continuous = true;
        rec.onresult = (ev: any) => {
          let appended = "";
          for (let i = ev.resultIndex || 0; i < (ev.results?.length || 0); i++) {
            const chunk = ev.results[i]?.[0]?.transcript || "";
            if (ev.results[i]?.isFinal && chunk.trim()) {
              appended += `${chunk.trim()} `;
            }
          }
          const clean = appended.trim();
          if (clean) {
            speechCapturedRef.current = true;
            onTranscript(clean);
          }
        };
        rec.onerror = (err: any) => {
          if (err?.error === "not-allowed") {
            setStatusError(
              locale === "ar"
                ? "يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح."
                : "Please allow microphone access in your browser settings."
            );
          }
        };
        rec.onend = () => {
          // Stop MediaRecorder cleanly if SpeechRecognition terminated first
          if (!mediaRecRef.current || mediaRecRef.current.state === "inactive") {
            setListening(false);
          }
        };
        rec.start();
        startedAnyCapture = true;
      } catch {}
    }

    if (!startedAnyCapture) {
      setStatusError(
        locale === "ar"
          ? "المتصفح لم يسمح بتشغيل الميكروفون (تأكد من HTTPS ومن إذن الصوت)."
          : "Microphone capture unavailable in this browser context."
      );
      return;
    }

    setListening(true);
    timerRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
  }, [cleanupStreams, listening, locale, onTranscript, stop]);

  return { listening, transcribing, elapsedSec, statusError, clearError: () => setStatusError(null), toggle, stop };
}
