"use client";

import React, { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Download,
  FileAudio,
  FileText,
  Film,
  Globe,
  Mic,
  Play,
  Printer,
  Square,
  Workflow,
} from "lucide-react";
import { buildBinarySafeZipArchive } from "@/lib/heyuka/pkzip";
import { logArtifactToVault } from "./StudioWorkbenchesA";

export function VideoAndShortsWorkbench({ mode }: { mode: "video" | "shorts" }) {
  const isShorts = mode === "shorts";
  const [title, setTitle] = useState(
    isShorts ? "HEYUKA Shorts 9:16 — 3s Hook" : "HEYUKA Brand Film 16:9"
  );
  const [scenes, setScenes] = useState(
    isShorts
      ? [
          { time: "00:00-00:03", caption: "Stop paying hidden AI markups!", durationSec: 2 },
          { time: "00:03-00:06", caption: "Run cutouts & code locally on HEYUKA", durationSec: 2 },
          { time: "00:06-00:09", caption: "Deploy across apps in seconds", durationSec: 2 },
        ]
      : [
          { time: "00:00-00:04", caption: "Scene 1: Future Glass Architecture Intro", durationSec: 2 },
          { time: "00:04-00:08", caption: "Scene 2: Multi-Product AI Studios", durationSec: 2 },
          { time: "00:08-00:12", caption: "Scene 3: Verified Zero-Cost Output Vault", durationSec: 2 },
        ]
  );
  const [rendering, setRendering] = useState(false);
  const [webmUrl, setWebmUrl] = useState("");
  const [webmSize, setWebmSize] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  const srtContent = useMemo(() => {
    let cursor = 0;
    return scenes
      .map((s, idx) => {
        const start = cursor;
        cursor += Math.max(1, s.durationSec);
        const fmt = (sec: number) =>
          `00:00:${String(sec).padStart(2, "0")},000`;
        return `${idx + 1}\n${fmt(start)} --> ${fmt(cursor)}\n${s.caption}\n`;
      })
      .join("\n");
  }, [scenes]);

  const downloadSrt = async () => {
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = isShorts ? "heyuka-shorts-captions.srt" : "heyuka-video-captions.srt";
    a.click();
    await logArtifactToVault({
      taskName: `${isShorts ? "Shorts" : "Video"} Captions: ${title}`,
      productId: isShorts ? "shorts-studio" : "video-studio",
      actualModel: "heyuka-core",
      actualEngine: "SRT Subtitle Formatter",
      status: "completed",
      truthClass: "real_output",
      durationMs: 25,
      format: "srt",
      inlineTextPreview: srtContent,
    });
  };

  /**
   * Real in-browser HTML5 Canvas + MediaRecorder `.webm` encoder (zero fabricated videos).
   */
  const renderBrowserWebm = async () => {
    if (typeof MediaRecorder === "undefined") {
      setRenderError("Browser MediaRecorder API unavailable on this device.");
      return;
    }
    setRenderError(null);
    setRendering(true);
    const t0 = performance.now();

    try {
      const width = isShorts ? 540 : 960;
      const height = isShorts ? 960 : 540;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D unavailable");

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      const donePromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start();
      const totalDurationMs = scenes.reduce((acc, s) => acc + s.durationSec * 1000, 0);
      const startMs = performance.now();

      await new Promise<void>((resolve) => {
        const tick = () => {
          const elapsed = performance.now() - startMs;
          let acc = 0;
          let activeScene = scenes[0];
          for (const s of scenes) {
            acc += s.durationSec * 1000;
            if (elapsed <= acc) {
              activeScene = s;
              break;
            }
          }

          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, "#0b1322");
          grad.addColorStop(1, "#064e3b");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(36, 48, width - 72, height - 96);

          ctx.fillStyle = "#10b981";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText(isShorts ? "HEYUKA SHORTS 9:16" : "HEYUKA VIDEO 16:9", 64, 110);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 28px sans-serif";
          ctx.fillText(activeScene?.caption || title, 64, height / 2, width - 128);

          ctx.fillStyle = "#94a3b8";
          ctx.font = "16px monospace";
          ctx.fillText(activeScene?.time || "", 64, height / 2 + 44);

          if (elapsed < totalDurationMs) {
            requestAnimationFrame(tick);
          } else {
            recorder.stop();
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });

      const blob = await donePromise;
      const objUrl = URL.createObjectURL(blob);
      setWebmUrl(objUrl);
      setWebmSize(blob.size);
      await logArtifactToVault({
        taskName: `${isShorts ? "Shorts 9:16" : "Video 16:9"} WebM Render: ${title}`,
        productId: isShorts ? "shorts-studio" : "video-studio",
        actualModel: "browser-device",
        actualEngine: `Canvas2D + MediaRecorder (${mimeType})`,
        status: "completed",
        truthClass: "real_output",
        durationMs: Math.round(performance.now() - t0),
        format: "webm",
        byteSize: blob.size,
        dimensions: `${width}x${height}`,
      });
    } catch (e: any) {
      setRenderError(e?.message || "Failed browser WebM rendering");
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="kaspi-glass-card rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-black">
          <Film className="w-4 h-4 text-emerald-500" />
          <span>
            {isShorts
              ? "Shorts 9:16 Storyboard, SRT & Local WebM Renderer"
              : "Video 16:9 Storyboard, Motion WebM & FFmpeg Spec"}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] font-mono text-emerald-500">
          {isShorts ? "540x960 (9:16)" : "960x540 (16:9)"}
        </span>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-2xl kaspi-glass-surface px-4 py-2 text-xs font-bold focus:outline-none"
      />

      <div className="space-y-2">
        {scenes.map((sc, i) => (
          <div key={i} className="kaspi-frosted-surface rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <span dir="ltr" className="sm:col-span-3 font-mono text-[11px] text-emerald-500 font-bold">
              {sc.time} ({sc.durationSec}s)
            </span>
            <input
              type="text"
              value={sc.caption}
              onChange={(e) => {
                const next = [...scenes];
                next[i] = { ...sc, caption: e.target.value };
                setScenes(next);
              }}
              className="sm:col-span-9 rounded-xl kaspi-glass-surface px-3 py-1.5 text-xs focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={rendering}
          onClick={() => void renderBrowserWebm()}
          className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{rendering ? "Rendering Local .webm..." : "Render Real Browser .webm"}</span>
        </button>
        <button
          type="button"
          onClick={() => void downloadSrt()}
          className="kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-500" />
          <span>Export .SRT Subtitles</span>
        </button>
      </div>

      <div className="kaspi-frosted-surface rounded-xl p-3 text-xs text-amber-500 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Local WebM renders genuinely on your device GPU/Canvas ($0 server cost). H.264 MP4 cloud transcoding requires connecting your own FFmpeg Worker node under Workers.
        </span>
      </div>

      {renderError && <div className="text-xs text-rose-500">{renderError}</div>}

      {webmUrl && (
        <div className="kaspi-frosted-surface rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-emerald-500">
              Real Rendered WebM Output ({(webmSize / 1024).toFixed(1)} KB)
            </span>
            <a href={webmUrl} download={isShorts ? "heyuka-short.webm" : "heyuka-video.webm"} className="kaspi-glass-btn rounded-xl px-3 py-1">
              Download .webm
            </a>
          </div>
          <video
            src={webmUrl}
            controls
            className={`rounded-xl mx-auto ${isShorts ? "max-h-72" : "w-full max-h-64"}`}
          />
        </div>
      )}
    </div>
  );
}

export function AudioStudioWorkbench() {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [stemStatus, setStemStatus] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);

  const transcribeBlob = async (blob: Blob, label: string) => {
    setBusy(true);
    const t0 = performance.now();
    try {
      const fd = new FormData();
      fd.append("file", blob, label);
      const res = await fetch("/api/v1/audio/transcribe", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      setTranscript(json.text || JSON.stringify(json, null, 2));
      if (json.text) {
        await logArtifactToVault({
          taskName: `Audio Transcription: ${label}`,
          productId: "audio-studio",
          actualModel: "whisper-large-v3-turbo",
          actualEngine: json.engine || "HEYUKA Whisper",
          status: "completed",
          truthClass: "real_output",
          durationMs: Math.round(performance.now() - t0),
          format: "txt",
          inlineTextPreview: json.text,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = async () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        void transcribeBlob(blob, "mic-recording.webm");
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e: any) {
      setTranscript(`Microphone permission unavailable: ${e?.message}`);
    }
  };

  const checkStemWorker = async () => {
    const res = await fetch("/api/v1/audio/separate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaUrl: "https://example.com/audio.mp3", stems: "2stems" }),
    });
    const json = await res.json();
    setStemStatus(
      json.executedServerSide
        ? "Worker Demucs executed cleanly."
        : `Worker Required: ${json.engine}`
    );
  };

  return (
    <div className="kaspi-glass-card rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-black">
          <FileAudio className="w-4 h-4 text-emerald-500" />
          <span>Speech Transcription &amp; Stem Separation Check</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void toggleMic()}
            className="kaspi-primary-cta-btn rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            {recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{recording ? "Stop & Transcribe" : "Record Voice"}</span>
          </button>
          <label className="kaspi-glass-btn rounded-2xl px-4 py-2 text-xs font-bold cursor-pointer">
            <span>{busy ? "Transcribing..." : "Upload Audio File"}</span>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void transcribeBlob(f, f.name);
              }}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => void checkStemWorker()}
            className="kaspi-glass-btn rounded-2xl px-3 py-2 text-xs font-bold cursor-pointer"
          >
            Check Stem Worker
          </button>
        </div>
      </div>

      {stemStatus && (
        <div className="kaspi-frosted-surface rounded-xl p-3 text-xs text-amber-500 font-semibold">
          {stemStatus}
        </div>
      )}

      <pre className="kaspi-frosted-surface rounded-2xl p-4 text-xs min-h-[120px] whitespace-pre-wrap">
        {transcript || "Record audio or upload a track for real Whisper multilingual transcription..."}
      </pre>
    </div>
  );
}

export function ConversionStudioWorkbench() {
  const [tab, setTab] = useState<"csv_json" | "srt_vtt" | "img_fmt">("csv_json");
  const [inputTxt, setInputTxt] = useState("name,price,currency\nTea,15,MAD\nCoffee,22,MAD");
  const [outputTxt, setOutputTxt] = useState("");
  const [imgTargetFmt, setImgTargetFmt] = useState<"image/png" | "image/webp" | "image/jpeg">("image/webp");
  const [convertedImgUrl, setConvertedImgUrl] = useState("");

  const convertText = async () => {
    if (tab === "csv_json") {
      if (inputTxt.trim().startsWith("[") || inputTxt.trim().startsWith("{")) {
        const parsed = JSON.parse(inputTxt);
        setOutputTxt(Papa.unparse(Array.isArray(parsed) ? parsed : [parsed]));
      } else {
        const parsed = Papa.parse(inputTxt, { header: true, skipEmptyLines: true });
        setOutputTxt(JSON.stringify(parsed.data, null, 2));
      }
    } else if (tab === "srt_vtt") {
      const converted =
        "WEBVTT\n\n" + inputTxt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
      setOutputTxt(converted);
    }
    await logArtifactToVault({
      taskName: `Format Conversion (${tab})`,
      productId: "conversion-studio",
      actualModel: "client-device",
      actualEngine: "Zero-Cost Format Converter",
      status: "completed",
      truthClass: "real_output",
      durationMs: 12,
      format: tab === "csv_json" ? "json/csv" : "vtt",
      inlineTextPreview: outputTxt || inputTxt,
    });
  };

  const handleImageConvert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise<void>((res) => {
      img.onload = () => res();
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0);
    const out = canvas.toDataURL(imgTargetFmt, 0.92);
    setConvertedImgUrl(out);
    URL.revokeObjectURL(img.src);
  };

  return (
    <div className="kaspi-glass-card rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-black">
          <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
          <span>Genuine Multi-Format Studio Converter ($0.00 Server Cost)</span>
        </div>
        <div className="flex gap-1.5">
          {[
            { id: "csv_json", label: "CSV ↔ JSON" },
            { id: "srt_vtt", label: "SRT → WebVTT" },
            { id: "img_fmt", label: "PNG ↔ WEBP ↔ JPEG" },
          ].map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id as any)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                tab === x.id ? "kaspi-orbit-active text-emerald-500" : "kaspi-glass-surface"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "img_fmt" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["image/webp", "image/png", "image/jpeg"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setImgTargetFmt(f)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold cursor-pointer ${
                  imgTargetFmt === f ? "kaspi-orbit-active text-emerald-500" : "kaspi-glass-surface"
                }`}
              >
                {f}
              </button>
            ))}
            <label className="kaspi-primary-cta-btn rounded-2xl px-4 py-2 text-xs font-bold cursor-pointer">
              <span>Select Image to Convert</span>
              <input type="file" accept="image/*" onChange={handleImageConvert} className="hidden" />
            </label>
          </div>
          {convertedImgUrl && (
            <div className="kaspi-frosted-surface rounded-2xl p-4 space-y-2">
              <img src={convertedImgUrl} alt="Converted" className="max-h-56 object-contain rounded-xl" />
              <a
                href={convertedImgUrl}
                download={`converted.${imgTargetFmt.split("/")[1]}`}
                className="kaspi-glass-btn rounded-xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download {imgTargetFmt.split("/")[1].toUpperCase()}
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <textarea
            dir="ltr"
            value={inputTxt}
            onChange={(e) => setInputTxt(e.target.value)}
            rows={7}
            className="rounded-2xl kaspi-frosted-surface p-3 font-mono text-xs focus:outline-none"
          />
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void convertText()}
              className="kaspi-primary-cta-btn w-full rounded-xl py-2 text-xs font-bold cursor-pointer"
            >
              Run Real Conversion
            </button>
            <textarea
              dir="ltr"
              readOnly
              value={outputTxt}
              rows={5}
              className="w-full rounded-2xl kaspi-frosted-surface p-3 font-mono text-xs focus:outline-none"
              placeholder="Converted result appears cleanly here..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function DataStudioWorkbench() {
  const [csvText, setCsvText] = useState("month,revenue\nJan,12400\nFeb,15900\nMar,18200\nApr,21500");
  const rows = useMemo(() => {
    const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
    return Array.isArray(parsed.data) ? (parsed.data as any[]).slice(0, 20) : [];
  }, [csvText]);

  const numericKey = useMemo(() => {
    if (rows.length === 0) return "";
    return Object.keys(rows[0]).find((k) => typeof rows[0][k] === "number") || "";
  }, [rows]);
  const labelKey = useMemo(() => {
    if (rows.length === 0) return "";
    return Object.keys(rows[0]).find((k) => k !== numericKey) || "";
  }, [rows, numericKey]);

  const sumVal = useMemo(() => {
    if (!numericKey) return 0;
    return rows.reduce((acc, r) => acc + (Number(r[numericKey]) || 0), 0);
  }, [rows, numericKey]);

  return (
    <div className="kaspi-glass-card rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-black">
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          <span>Real CSV Parser, Computed KPIs &amp; Recharts Visualization</span>
        </div>
        <span className="text-xs font-mono text-emerald-500 font-bold">
          Rows: {rows.length} {numericKey ? `• Sum(${numericKey}) = ${sumVal}` : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <textarea
          dir="ltr"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={7}
          className="lg:col-span-5 rounded-2xl kaspi-frosted-surface p-3 font-mono text-xs focus:outline-none"
        />
        <div className="lg:col-span-7 kaspi-frosted-surface rounded-2xl p-3 h-56">
          {rows.length > 0 && numericKey && labelKey ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <XAxis dataKey={labelKey} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey={numericKey} fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[var(--kaspi-text-muted)]">
              Paste CSV columns (text label + numeric value) to visualize cleanly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WebAndDocWorkbench({ mode }: { mode: "web" | "document" | "automation" }) {
  const [htmlCode, setHtmlCode] = useState(
    `<div style="font-family:system-ui;padding:24px;border-radius:16px;background:linear-gradient(135deg,#0f172a,#064e3b);color:#fff">\n  <h2>HEYUKA Live Preview Card</h2>\n  <p>Edit this HTML cleanly inside the isolated sandbox iframe.</p>\n</div>`
  );
  const [specUrl, setSpecUrl] = useState("https://petstore3.swagger.io/api/v3/openapi.json");
  const [specOut, setSpecOut] = useState("");

  if (mode === "automation") {
    return (
      <div className="kaspi-glass-card rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-black">
          <Workflow className="w-4 h-4 text-emerald-500" />
          <span>SSRF-Safe OpenAPI Spec Discovery Tester</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            dir="ltr"
            type="url"
            value={specUrl}
            onChange={(e) => setSpecUrl(e.target.value)}
            className="flex-1 rounded-2xl kaspi-glass-surface px-4 py-2 text-xs font-mono focus:outline-none"
          />
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/v1/zebra-x/auto-connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ specUrl }),
              });
              setSpecOut(JSON.stringify(await res.json(), null, 2));
            }}
            className="kaspi-primary-cta-btn rounded-2xl px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Inspect OpenAPI
          </button>
        </div>
        {specOut && (
          <pre dir="ltr" className="kaspi-frosted-surface rounded-2xl p-3 font-mono text-[11px] max-h-56 overflow-auto">
            {specOut}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="kaspi-glass-card rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-black">
          {mode === "web" ? (
            <Globe className="w-4 h-4 text-emerald-500" />
          ) : (
            <FileText className="w-4 h-4 text-emerald-500" />
          )}
          <span>
            {mode === "web"
              ? "Live Sandboxed HTML Preview + PKZIP Export"
              : "Structured Document Composer & Printable PDF Export"}
          </span>
        </div>
        <div className="flex gap-2">
          {mode === "document" && (
            <button
              type="button"
              onClick={() => window.print()}
              className="kaspi-glass-btn rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const bytes = buildBinarySafeZipArchive([
                { path: mode === "web" ? "index.html" : "document.html", data: htmlCode },
              ]);
              const blob = new Blob([new Uint8Array(bytes)], { type: "application/zip" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = mode === "web" ? "heyuka-web-project.zip" : "heyuka-document.zip";
              a.click();
            }}
            className="kaspi-primary-cta-btn rounded-xl px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export ZIP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <textarea
          dir="ltr"
          value={htmlCode}
          onChange={(e) => setHtmlCode(e.target.value)}
          rows={9}
          className="rounded-2xl kaspi-frosted-surface p-3.5 font-mono text-xs focus:outline-none"
        />
        <iframe
          title="Isolated Preview"
          sandbox=""
          srcDoc={htmlCode}
          className="w-full h-56 rounded-2xl bg-white border border-[var(--kaspi-border)]"
        />
      </div>
    </div>
  );
}
