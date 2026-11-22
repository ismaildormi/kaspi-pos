"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import * as Diff from "diff";
import { zipSync, strToU8 } from "fflate";
import {
  Activity,
  Award,
  Bot,
  Camera,
  Check,
  Cloud,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  Flame,
  FolderOpen,
  Globe,
  HardDrive,
  KeyRound,
  Monitor,
  MonitorUp,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Terminal,
  Trophy,
  Users,
  Video,
  WifiOff,
  Wrench,
} from "lucide-react";
import { HeyukaSyntaxCodeView, getFileBadgeMeta } from "@/components/heyuka/HeyukaSyntaxCodeView";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { assembleMultiFilePreviewDocument } from "@/lib/heyuka/autonomous-builder-v24-v28";
import {
  STUDIO_STARTER_TEMPLATES,
  type ElasticScaleMode,
  type StudioBrand,
  type StudioStarterTemplate,
  type SwarmCouncilNode,
  type WorkerBotExecution,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import type { KanbanTaskItem, StudioFileNode, StudioMode } from "./studio-types";

interface StudioWorkbenchTabsProps {
  mode: StudioMode;
  brand: StudioBrand;
  locale: "ar" | "fr" | "en";
  files: StudioFileNode[];
  onChangeFiles: (next: StudioFileNode[]) => void;
  checkpoints: Array<{ id: string; label: string; at: string; files: StudioFileNode[] }>;
  onSaveCheckpoint: (label: string) => void;
  onRestoreCheckpoint: (id: string) => void;
  onRunPromptFromChild: (promptText: string) => void;
  onSelectTemplate: (tpl: StudioStarterTemplate) => void;
  onInjectContextText: (label: string, text: string) => void;
  onCaptureFrameToChat: (dataUrl: string, caption: string) => void;
  councilData: {
    tier: string;
    modelCount: number;
    complexityScore: number;
    nodes: SwarmCouncilNode[];
    spawnedBots: WorkerBotExecution[];
  } | null;
  onTriggerCouncil: (scale: ElasticScaleMode, promptText: string) => Promise<void>;
  focusFilePath?: string | null;
  appearance?: {
    backgroundHex: string;
    foregroundHex: string;
    accentHex: string;
    contrastMode: "default" | "strong";
  };
}

export function StudioWorkbenchTabs({
  mode,
  brand,
  locale,
  files,
  onChangeFiles,
  checkpoints,
  onSaveCheckpoint,
  onRestoreCheckpoint,
  onRunPromptFromChild,
  onSelectTemplate,
  onInjectContextText,
  onCaptureFrameToChat,
  councilData,
  onTriggerCouncil,
  focusFilePath,
  appearance,
}: StudioWorkbenchTabsProps) {
  const isAr = locale === "ar";
  const accentBtn = "bg-[#007ACC] text-white";

  // Build Canvas State
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || "index.html");
  const [codeViewMode, setCodeViewMode] = useState<"syntax" | "edit">("syntax");
  const [viewSplit, setViewSplit] = useState<"split" | "code" | "preview">("split");

  useEffect(() => {
    if (focusFilePath && files.some((f) => f.path === focusFilePath)) {
      setSelectedPath(focusFilePath);
    }
  }, [focusFilePath, files]);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [annotateMode, setAnnotateMode] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);
  const [bottomUtilityTab, setBottomUtilityTab] = useState<"none" | "browser" | "terminal" | "swarm">("none");
  const annotateCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  // Embedded Live Browser + OAuth Handshake (v57)
  const [browserUrl, setBrowserUrl] = useState("https://github.com/ismaildormi/kaspi-pos");
  const [browserSnapshot, setBrowserSnapshot] = useState<string>("");
  const [browserLoading, setBrowserLoading] = useState(false);
  const [gmailSignedIn, setGmailSignedIn] = useState(false);
  const [oauthPausedForUser, setOauthPausedForUser] = useState(false);
  const [cloudProjectName, setCloudProjectName] = useState("kaspi-next-app");
  const [factoryOutput, setFactoryOutput] = useState<any>(null);

  // Embedded Terminal / PowerShell (v53 + v55)
  const [termLang, setTermLang] = useState<"python" | "bash" | "javascript" | "powershell">("powershell");
  const [termCmd, setTermCmd] = useState("Get-Process | Select-Object -First 5");
  const [termOut, setTermOut] = useState<string>("Ready • Local/Sandbox PowerShell & Python Bridge");
  const [termBusy, setTermBusy] = useState(false);

  // Stream Realtime WebRTC State
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [streamKind, setStreamKind] = useState<"off" | "camera" | "screen">("off");
  const [voiceName, setVoiceName] = useState("Kore (Multilingual Warm)");
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Compare Mode State
  const [comparePrompt, setComparePrompt] = useState("اشرح الفرق بين WebGPU و WebAssembly باختصار مع مثال عملي.");
  const [compareBusy, setCompareBusy] = useState(false);
  const [compareLeft, setCompareLeft] = useState<{ model: string; text: string; ms: number }>({ model: "heyuka-omni", text: "", ms: 0 });
  const [compareRight, setCompareRight] = useState<{ model: string; text: string; ms: number }>({ model: "heyuka-core", text: "", ms: 0 });

  // Team Multiplayer Yjs + Kanban + Gamification + Offline Vault State (v59 + v60)
  const [yjsSharedText, setYjsSharedText] = useState("HEYUKA x KASPI POS Sprint Board — Shared Live Document");
  const [peerCount, setPeerCount] = useState(1);
  const [rbacRole, setRbacRole] = useState<"Owner" | "Admin" | "Developer" | "Designer" | "Cashier" | "Viewer">("Owner");
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTaskItem[]>([
    { id: "k1", title: "Google AI Studio Dual-Brand UI Parity", assignee: "Ismail (Owner)", status: "done", xpReward: 150 },
    { id: "k2", title: "Elastic 12-Model Swarm Verification", assignee: "@heyuka (AI Teammate)", status: "in_progress", xpReward: 200 },
    { id: "k3", title: "KASPI POS 80mm Receipt Export", assignee: "Cashier Lead", status: "backlog", xpReward: 120 },
  ]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [pomodoroSec, setPomodoroSec] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  // API Keys & Usage State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [freshKeyOnce, setFreshKeyOnce] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const yDocRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    if (!files.some((f) => f.path === selectedPath) && files[0]) {
      setSelectedPath(files[0].path);
    }
  }, [files, selectedPath]);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev?.data?.source === "heyuka-preview-console") {
        setPreviewLogs((prev) => [`[${ev.data.level}] ${ev.data.message}`, ...prev].slice(0, 30));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (streamKind === "off") return;
    const t = setInterval(() => setLiveSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [streamKind]);

  useEffect(() => {
    if (!pomodoroRunning) return;
    const t = setInterval(() => setPomodoroSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [pomodoroRunning]);

  // Real Yjs CRDT + BroadcastChannel cross-tab sync
  useEffect(() => {
    if (mode !== "team_collab" && mode !== "offline_vault") return;
    const doc = new Y.Doc();
    yDocRef.current = doc;
    const yText = doc.getText("sharedBrief");
    const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("heyuka_studio_yjs_room_v59") : null;

    const onUpdate = (u: Uint8Array, origin: unknown) => {
      if (origin !== "remote" && bc) {
        bc.postMessage({ type: "yjs_update", data: Array.from(u) });
      }
      const nextVal = yText.toString();
      if (nextVal) setYjsSharedText(nextVal);
    };
    doc.on("update", onUpdate);
    if (bc) {
      bc.postMessage({ type: "peer_ping" });
      bc.onmessage = (e) => {
        if (e.data?.type === "peer_ping") {
          setPeerCount((p) => Math.max(2, p));
          bc.postMessage({ type: "yjs_update", data: Array.from(Y.encodeStateAsUpdate(doc)) });
        } else if (e.data?.type === "yjs_update" && Array.isArray(e.data.data)) {
          Y.applyUpdate(doc, new Uint8Array(e.data.data), "remote");
        }
      };
    }
    fetch("/api/v1/studio/team", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTeamStats(d))
      .catch(() => {});

    return () => {
      doc.destroy();
      bc?.close();
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "api_keys") return;
    fetch("/api/v1/zebra-x/keys", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setApiKeys(Array.isArray(d?.keys) ? d.keys : []))
      .catch(() => {});
    fetch("/api/v1/zebra-x/telemetry?days=14", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTelemetry(d))
      .catch(() => {});
  }, [mode]);

  const activeFile = files.find((f) => f.path === selectedPath) || files[0] || { path: "index.html", language: "html", content: "" };

  const previewHtmlDoc = useMemo(() => {
    const raw = assembleMultiFilePreviewDocument(files) || "<html><head></head><body></body></html>";
    const consoleBridge = `<script>(function(){var ow=console.warn,oe=console.error;function s(l,a){try{parent.postMessage({source:"heyuka-preview-console",level:l,message:[].slice.call(a).join(" ")},"*")}catch{}}console.error=function(){s("error",arguments);oe.apply(console,arguments)};window.onerror=function(m){s("error",[m])};})();</script>`;
    return raw.includes("</head>") ? raw.replace("</head>", `${consoleBridge}</head>`) : `${consoleBridge}${raw}`;
  }, [files]);

  const handleDownloadZip = () => {
    const zipEntries: Record<string, Uint8Array> = {};
    for (const f of files) {
      zipEntries[f.path.replace(/^\/+/, "")] = strToU8(f.content);
    }
    const zipped = zipSync(zipEntries);
    const ab = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
    const blob = new Blob([ab], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brand === "kaspi_pos" ? "kaspi-pos" : "heyuka"}-studio-project.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runLiveBrowserFetch = async () => {
    setBrowserLoading(true);
    try {
      const r = await fetch("/api/v1/web/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: browserUrl, query: browserUrl }),
      });
      const d = await r.json();
      setBrowserSnapshot(
        typeof d?.markdown === "string"
          ? d.markdown.slice(0, 2600)
          : JSON.stringify(d?.results || d, null, 2).slice(0, 2600)
      );
    } catch (e: any) {
      setBrowserSnapshot(`Fetch note: ${e?.message || "Network unavailable"}`);
    } finally {
      setBrowserLoading(false);
    }
  };

  const runCloudFactoryProvision = async () => {
    const r = await fetch("/api/v1/studio/browser-factory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName: cloudProjectName,
        gmailSignedIn,
        cloudTargets: ["GitHub", "Vercel", "Supabase", "Cloudflare"],
      }),
    });
    const d = await r.json();
    setFactoryOutput(d);
  };

  const runTerminalExec = async () => {
    setTermBusy(true);
    try {
      if (termLang === "powershell") {
        const r = await fetch("/api/v1/os/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "shell", command: termCmd }),
        });
        const d = await r.json();
        setTermOut(
          `[v53 Sovereign OS Plan • POS_CORE_LOCK=true]\nPowerShell:\n${d?.generatedScripts?.powershell || termCmd}\n\nBash Equivalent:\n${d?.generatedScripts?.bash || ""}`
        );
      } else {
        const r = await fetch("/api/v1/sandbox/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: termLang, code: termCmd }),
        });
        const d = await r.json();
        setTermOut(
          `[Sandbox exit=${d?.exitCode ?? "?"} • ${d?.engine || "HEYUKA VM"}]\n${d?.stdout || ""}${d?.stderr ? `\nERR:\n${d.stderr}` : ""}`
        );
      }
    } catch (e: any) {
      setTermOut(`Error: ${e?.message || "Execution failed"}`);
    } finally {
      setTermBusy(false);
    }
  };

  const startMediaStream = async (kind: "camera" | "screen") => {
    stopMediaStream();
    try {
      const stream =
        kind === "screen"
          ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamKind(kind);
      setLiveSeconds(0);
    } catch (e: any) {
      setPreviewLogs((p) => [`[media] ${e?.message || "Permission denied"}`, ...p]);
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreamKind("off");
  };

  const runCompareArena = async () => {
    setCompareBusy(true);
    const runOne = async (modelId: string) => {
      const t0 = performance.now();
      const res = await fetch("/api/v1/heyuka/local-sdk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: comparePrompt, mode: modelId.includes("core") ? "coding" : "auto", locale }),
      });
      const d = await res.json();
      return { model: modelId, text: String(d?.answer || d?.reply || ""), ms: Math.round(performance.now() - t0) };
    };
    try {
      const [a, b] = await Promise.all([runOne(compareLeft.model), runOne(compareRight.model)]);
      setCompareLeft(a);
      setCompareRight(b);
    } finally {
      setCompareBusy(false);
    }
  };

  const handleAwardXp = async (xp: number, reason: string, badge?: string) => {
    const r = await fetch("/api/v1/studio/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member: `Member (${rbacRole})`, xp, reason, badge }),
    });
    const d = await r.json();
    setTeamStats((prev: any) => ({ ...(prev || {}), ...d }));
  };

  // --- RENDER BY SPECIALIZED MODE ---
  if (mode === "starter_apps") {
    return (
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[var(--kaspi-text-primary)]">
              {isAr ? "معرض القوالب والتطبيقات الجاهزة (Starter Apps)" : "Starter Apps & Prompt Gallery"}
            </h2>
            <p className="text-xs text-[var(--kaspi-text-muted)]">
              {isAr ? "تشمل قوالب HEYUKA للبرمجة والـ 3D وقوالب KASPI POS للتجارة والفواتير." : "One-click starter blueprints for HEYUKA & KASPI POS."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {STUDIO_STARTER_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl bg-[#161618] border border-white/[0.08] hover:border-white/[0.16] transition-colors flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-[10px] font-medium">
                    {tpl.brand === "kaspi_pos" ? "KASPI POS" : "HEYUKA"} • {tpl.category}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">{tpl.scale}</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {isAr ? tpl.titleAr : tpl.titleEn}
                </h3>
                <p className="text-xs text-zinc-400">{isAr ? tpl.descAr : tpl.descEn}</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTemplate(tpl)}
                className="w-full py-1.5 rounded-lg bg-white/[0.07] hover:bg-[#007ACC] text-zinc-100 hover:text-white text-xs font-medium cursor-pointer transition-colors"
              >
                {isAr ? "فتح القالب" : "Use Template"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "stream_realtime") {
    return (
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Video className="w-5 h-5 text-rose-400" />
              <span>{isAr ? "البث التفاعلي الحي (Stream Realtime — صوت، كاميرا، وشاشة)" : "Stream Realtime (Voice, Webcam & Screen Share)"}</span>
            </h2>
            <p className="text-xs text-[var(--kaspi-text-muted)]">
              WebRTC MediaDevices + Screen Capture -&gt; HEYUKA Vision (v54 + v55).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-white/[0.06] font-mono text-xs">
              {String(Math.floor(liveSeconds / 60)).padStart(2, "0")}:{String(liveSeconds % 60).padStart(2, "0")}
            </span>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs"
            >
              <option value="Kore (Multilingual Warm)">Voice: Kore (Warm)</option>
              <option value="Puck (Fast Studio)">Voice: Puck (Fast)</option>
              <option value="Atlas (Darija & Arabic)">Voice: Atlas (Arabic/Darija)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => startMediaStream("camera")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${accentBtn}`}
          >
            <Camera className="w-4 h-4" />
            <span>Turn on Webcam</span>
          </button>
          <button
            type="button"
            onClick={() => startMediaStream("screen")}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <MonitorUp className="w-4 h-4" />
            <span>Share Screen</span>
          </button>
          {streamKind !== "off" && (
            <>
              <button
                type="button"
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  const c = document.createElement("canvas");
                  c.width = Math.min(1280, v.videoWidth || 640);
                  c.height = Math.min(720, v.videoHeight || 360);
                  c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
                  onCaptureFrameToChat(c.toDataURL("image/jpeg", 0.85), `Captured ${streamKind} frame for HEYUKA Vision analysis.`);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer"
              >
                Analyze Current Frame with Vision
              </button>
              <button
                type="button"
                onClick={stopMediaStream}
                className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold cursor-pointer"
              >
                Stop Stream
              </button>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-[#18191E] border border-white/10 min-h-[280px] flex items-center justify-center overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className={streamKind === "off" ? "hidden" : "w-full max-h-[380px] object-contain"} />
          {streamKind === "off" && (
            <div className="text-center p-8 space-y-2 text-[var(--kaspi-text-muted)] text-xs">
              <MonitorUp className="w-10 h-10 mx-auto opacity-50" />
              <p>Select Webcam or Share Screen above to inspect documents, barcodes, or UI errors live.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "compare") {
    return (
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{isAr ? "وضع المقارنة المتوازية (Compare Arena)" : "Compare Mode (Side-by-Side)"}</h2>
          <button
            type="button"
            disabled={compareBusy}
            onClick={runCompareArena}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${accentBtn}`}
          >
            {compareBusy ? "Running..." : "Run Both Models"}
          </button>
        </div>
        <textarea
          rows={2}
          value={comparePrompt}
          onChange={(e) => setComparePrompt(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/[0.05] border border-white/15 text-xs"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { label: "Model A", state: compareLeft, setModel: (m: string) => setCompareLeft((p) => ({ ...p, model: m })) },
            { label: "Model B", state: compareRight, setModel: (m: string) => setCompareRight((p) => ({ ...p, model: m })) },
          ].map((col) => (
            <div key={col.label} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <select
                  value={col.state.model}
                  onChange={(e) => col.setModel(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.07] border border-white/15 text-xs font-bold"
                >
                  <option value="heyuka-omni">heyuka-omni</option>
                  <option value="heyuka-core">heyuka-core</option>
                  <option value="heyuka-vision">heyuka-vision</option>
                </select>
                <span className="font-mono text-[11px] text-[var(--kaspi-text-muted)]">{col.state.ms} ms</span>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-[var(--kaspi-text-secondary)] max-h-80 overflow-y-auto">
                {col.state.text || "Click 'Run Both Models' to compare outputs side by side."}
              </pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "team_collab") {
    return (
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>{isAr ? "فضاء العمل الجماعي (Yjs CRDT + Kanban + نظام الحوافز XP)" : "Multiplayer CRDT, Team Kanban & Gamified XP (v59.0)"}</span>
            </h2>
            <p className="text-xs text-[var(--kaspi-text-muted)]">
              Yjs CRDT Active ({peerCount} synced peer tab(s)) • Role RBAC: {rbacRole}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={rbacRole}
              onChange={(e) => setRbacRole(e.target.value as typeof rbacRole)}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs font-semibold"
            >
              {(["Owner", "Admin", "Developer", "Designer", "Cashier", "Viewer"] as const).map((r) => (
                <option key={r} value={r}>Role: {r}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPomodoroRunning((p) => !p)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/15 text-xs font-mono cursor-pointer"
            >
              🍅 {String(Math.floor(pomodoroSec / 60)).padStart(2, "0")}:{String(pomodoroSec % 60).padStart(2, "0")} {pomodoroRunning ? "Pause" : "Focus"}
            </button>
          </div>
        </div>

        {/* Team Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#161618] border border-white/[0.08]">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-zinc-400" /><span>Level</span></div>
            <div className="text-sm font-semibold text-zinc-100 mt-1">{teamStats?.gamification?.level || "Architect"}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161618] border border-white/[0.08]">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-zinc-400" /><span>Activity</span></div>
            <div className="text-sm font-semibold text-zinc-100 mt-1">{teamStats?.gamification?.totalXp ?? 770} pts</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161618] border border-white/[0.08]">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-zinc-400" /><span>Streak</span></div>
            <div className="text-sm font-semibold text-zinc-100 mt-1">12 Days</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161618] border border-white/[0.08] flex flex-col justify-between">
            <span className="text-[11px] text-zinc-400">Recognition</span>
            <button
              type="button"
              onClick={() => handleAwardXp(50, "Sent Peer Kudos in Studio", "Team Catalyst")}
              className="mt-1 px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-[#007ACC] text-zinc-200 hover:text-white text-[11px] font-medium cursor-pointer transition-colors"
            >
              Send Kudos
            </button>
          </div>
        </div>

        {/* Real Yjs Live Shared Editor */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Yjs Live Shared Team Brief (Open a 2nd browser tab to watch instant CRDT sync)</span>
            <span className="text-emerald-400 font-mono">yjs • BroadcastChannel</span>
          </div>
          <textarea
            rows={3}
            value={yjsSharedText}
            onChange={(e) => {
              const val = e.target.value;
              setYjsSharedText(val);
              const doc = yDocRef.current;
              if (doc) {
                const t = doc.getText("sharedBrief");
                doc.transact(() => {
                  t.delete(0, t.length);
                  t.insert(0, val);
                });
              }
            }}
            className="w-full p-2.5 rounded-xl bg-white/[0.05] border border-white/15 text-xs"
          />
        </div>

        {/* Team Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["backlog", "in_progress", "done"] as const).map((col) => (
            <div key={col} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--kaspi-text-muted)]">
                {col.replace("_", " ")}
              </div>
              {kanbanTasks
                .filter((t) => t.status === col)
                .map((task) => (
                  <div key={task.id} className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 space-y-1.5 text-xs">
                    <div className="font-semibold">{task.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--kaspi-text-muted)]">
                      <span>{task.assignee}</span>
                      <span className="font-mono text-amber-300">+{task.xpReward} XP</span>
                    </div>
                    {col !== "done" && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = col === "backlog" ? "in_progress" : "done";
                          setKanbanTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status: nextStatus } : x)));
                          if (nextStatus === "done") handleAwardXp(task.xpReward, `Completed ${task.title}`, "🚀 Milestone Shipper");
                        }}
                        className="w-full py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[10px] font-bold cursor-pointer"
                      >
                        {col === "backlog" ? "Start Task ->" : "Mark Done (+XP)"}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "offline_vault") {
    const manifest = teamStats?.offlineManifest;
    return (
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "الخزنة المحلية المعزولة 100% والشبكة المحلية (v60.0 Offline Vault)" : "Air-Gapped Sovereign Offline Vault & LAN Mesh (v60.0)"}</span>
            </h2>
            <p className="text-xs text-[var(--kaspi-text-muted)]">
              Workbox PWA • IndexedDB • OPFS • Kiwix OpenZIM • Ollama/Llamafile • Zero-WiFi LAN WebRTC Mesh.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(manifest || {}, null, 2)], { type: "application/json" });
              const u = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = u;
              a.download = "heyuka-airgapped-offline-manifest.json";
              a.click();
              URL.revokeObjectURL(u);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${accentBtn}`}
          >
            Export Offline Manifest (.JSON)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(manifest?.tiers || []).map((tier: any) => (
            <div key={tier.tierId} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="text-xs font-bold text-emerald-300">{tier.title}</div>
              <div className="flex flex-wrap gap-1.5">
                {(tier.engines || []).map((eng: string) => (
                  <span key={eng} className="px-2 py-0.5 rounded-full bg-white/[0.07] text-[10px] font-mono">
                    {eng}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2">
          <div className="text-xs font-bold">v60.0 Vaulted Offline Engines ({manifest?.v60Engines?.length || 15})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(manifest?.v60Engines || []).map((v: any) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs flex items-center justify-between gap-2"
              >
                <span className="truncate font-semibold">{v.name}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "api_keys") {
    const chartData = Array.isArray(telemetry?.dailySeries) && telemetry.dailySeries.length > 0
      ? telemetry.dailySeries
      : [{ date: "Today", requests: 12, estimatedTokens: 4800 }];

    return (
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-sky-400" />
              <span>API Keys & Real-Time Usage Charts ($0.00 Unlimited)</span>
            </h2>
            <p className="text-xs text-[var(--kaspi-text-muted)]">
              Create unlimited `hk-live-...` keys scoped to your workspace. Works drop-in with OpenAI SDKs.
            </p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/v1/zebra-x/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: newKeyLabel || `${brand.toUpperCase()} Studio Key`, tokenPrefix: "hk-live" }),
              });
              const d = await res.json();
              if (d?.secretKeyOnce) setFreshKeyOnce(d.secretKeyOnce);
              setNewKeyLabel("");
              const list = await fetch("/api/v1/zebra-x/keys").then((r) => r.json()).catch(() => ({}));
              setApiKeys(Array.isArray(list?.keys) ? list.keys : []);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="New key label..."
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs"
            />
            <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-[#007ACC] hover:bg-[#0B84D8] text-white text-xs font-medium cursor-pointer transition-colors">
              + Create API Key
            </button>
          </form>
        </div>

        {freshKeyOnce && (
          <div className="p-3 rounded-lg bg-[#161618] border border-[#007ACC]/40 flex items-center justify-between gap-2 text-xs">
            <span className="font-mono font-medium truncate text-zinc-100">New Secret Key: {freshKeyOnce}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(freshKeyOnce);
                setCopiedId("fresh");
              }}
              className="px-2.5 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-white font-medium cursor-pointer"
            >
              {copiedId === "fresh" ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        <div className="h-56 p-4 rounded-xl bg-[#161618] border border-white/[0.08]">
          <div className="text-xs font-medium text-zinc-300 mb-2">Daily Requests</div>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip />
              <Bar dataKey="requests" fill="#007ACC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[var(--kaspi-text-muted)]">
                <th className="py-2.5 px-4 text-start">Label</th>
                <th className="py-2.5 px-4 text-start">Prefix</th>
                <th className="py-2.5 px-4 text-start">Created</th>
                <th className="py-2.5 px-4 text-end">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {apiKeys.map((k) => (
                <tr key={k.id}>
                  <td className="py-2.5 px-4 font-semibold">{k.label}</td>
                  <td className="py-2.5 px-4 font-mono">{k.prefix}...{k.last4}</td>
                  <td className="py-2.5 px-4 text-[var(--kaspi-text-muted)]">{String(k.createdAt || "").slice(0, 10)}</td>
                  <td className="py-2.5 px-4 text-end font-mono">{k.usageCount || 0} reqs ($0.00)</td>
                </tr>
              ))}
              {apiKeys.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-center text-[var(--kaspi-text-muted)]">
                    Sign in via /zebra-x/api-keys to manage persistent tenant keys, or use unlimited zero-key mode directly.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // DEFAULT WORKBENCH PANEL: Build Mode + Bottom Embedded Browser / Terminal / Elastic Swarm Utility
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {mode === "build" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Build Toolbar */}
          <div className="px-3 py-1.5 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2 bg-[#141416]">
            <div className="flex items-center gap-1">
              {(["split", "preview", "code"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewSplit(v)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize cursor-pointer transition-colors ${
                    viewSplit === v ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                  }`}
                >
                  {v}
                </button>
              ))}
              <div className="h-4 w-px bg-white/[0.08] mx-1" />
              <button type="button" onClick={() => setViewport("desktop")} className={`p-1 rounded-md cursor-pointer ${viewport === "desktop" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200"}`} title="Desktop"><Monitor className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => setViewport("tablet")} className={`p-1 rounded-md cursor-pointer ${viewport === "tablet" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200"}`} title="Tablet"><Tablet className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => setViewport("mobile")} className={`p-1 rounded-md cursor-pointer ${viewport === "mobile" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200"}`} title="Mobile"><Smartphone className="w-3.5 h-3.5" /></button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDiffMode((d) => !d)}
                className={`px-2.5 py-1 rounded-md border text-[11px] font-medium cursor-pointer ${diffMode ? "bg-[#007ACC]/20 border-[#007ACC]/50 text-sky-300" : "bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]"}`}
              >
                Diff
              </button>
              <button
                type="button"
                onClick={() => setAnnotateMode((a) => !a)}
                className={`px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 cursor-pointer ${annotateMode ? "bg-[#007ACC]/20 border-[#007ACC]/50 text-sky-300" : "bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]"}`}
              >
                <Pencil className="w-3 h-3" />
                <span>Annotate</span>
              </button>
              <button
                type="button"
                onClick={() => onSaveCheckpoint(`Checkpoint #${checkpoints.length + 1}`)}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-zinc-300 cursor-pointer"
              >
                Checkpoint
              </button>
              <button
                type="button"
                onClick={handleDownloadZip}
                className="px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-zinc-400" />
                <span>.ZIP</span>
              </button>
            </div>
          </div>

          {/* File Tree + Code + Live Preview */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* File Tree */}
            <div className="w-48 shrink-0 border-e border-white/10 p-2 overflow-y-auto bg-white/[0.02] space-y-2 hidden sm:block">
              <div className="text-[10px] font-bold uppercase text-[var(--kaspi-text-muted)] px-1">Project Files ({files.length})</div>
              <div className="space-y-0.5">
                {files.map((f) => (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => setSelectedPath(f.path)}
                    className={`w-full text-start px-2 py-1.5 rounded-lg text-[11px] font-mono truncate cursor-pointer ${
                      f.path === activeFile.path ? "bg-white/15 font-bold text-[var(--kaspi-text-primary)]" : "text-[var(--kaspi-text-secondary)] hover:bg-white/[0.06]"
                    }`}
                  >
                    {f.path}
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-white/10 flex gap-1">
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="app.tsx"
                  className="w-full px-1.5 py-1 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const p = newFilePath.trim();
                    if (!p || files.some((x) => x.path === p)) return;
                    onChangeFiles([...files, { path: p, language: p.split(".").pop() || "text", content: `// ${p}\n` }]);
                    setSelectedPath(p);
                    setNewFilePath("");
                  }}
                  className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
              {checkpoints.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Checkpoints</div>
                  {checkpoints.slice(0, 4).map((cp) => (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => onRestoreCheckpoint(cp.id)}
                      className="w-full text-start px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.1] text-[10px] flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{cp.label}</span>
                      <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Code Editor & Antigravity Syntax Code View */}
            {(viewSplit === "split" || viewSplit === "code") && (
              <div className="flex-1 flex flex-col min-w-0 border-e border-white/10 overflow-hidden">
                {/* Multi-Tab Bar like Antigravity IDE */}
                <div className="px-2 py-1 border-b border-white/10 flex items-center gap-1 overflow-x-auto bg-white/[0.02] kaspi-no-scrollbar">
                  {files.map((f) => {
                    const meta = getFileBadgeMeta(f.path, f.language);
                    const isAct = f.path === activeFile.path;
                    return (
                      <button
                        key={f.path}
                        type="button"
                        onClick={() => setSelectedPath(f.path)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono shrink-0 cursor-pointer transition-colors ${
                          isAct
                            ? "bg-white/[0.12] text-white border border-white/20 font-bold"
                            : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                        }`}
                      >
                        <span
                          style={{ color: meta.color, backgroundColor: meta.bg }}
                          className="px-1 py-0.2 rounded text-[8px] font-black"
                        >
                          {meta.extLabel}
                        </span>
                        <span className="truncate max-w-[140px]">{meta.fileName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Toolbar: Syntax / Edit / Diff */}
                <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-[11px] font-mono bg-white/[0.02]">
                  <span className="truncate text-zinc-300">{activeFile.path}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-zinc-400 hidden sm:inline">
                      {activeFile.content.split(/\r?\n/).length} lines • +{activeFile.content.length} chars
                    </span>
                    <button
                      type="button"
                      onClick={() => setCodeViewMode((m) => (m === "syntax" ? "edit" : "syntax"))}
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-medium cursor-pointer transition-colors ${
                        codeViewMode === "edit"
                          ? "bg-[#007ACC] border-[#007ACC] text-white"
                          : "bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      {codeViewMode === "syntax" ? "Edit" : "Preview Syntax"}
                    </button>
                  </div>
                </div>
                {diffMode && checkpoints[0] ? (
                  <div className="flex-1 overflow-auto p-3 font-mono text-[11px] space-y-0.5">
                    {Diff.diffLines(
                      checkpoints[0].files.find((f) => f.path === activeFile.path)?.content || "",
                      activeFile.content
                    ).map((part, i) => (
                      <div
                        key={i}
                        className={
                          part.added
                            ? "bg-emerald-500/15 text-emerald-300"
                            : part.removed
                            ? "bg-rose-500/15 text-rose-300"
                            : "text-[var(--kaspi-text-secondary)]"
                        }
                      >
                        <pre className="whitespace-pre-wrap">{part.value}</pre>
                      </div>
                    ))}
                  </div>
                ) : codeViewMode === "syntax" ? (
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    <HeyukaSyntaxCodeView
                      code={activeFile.content}
                      language={activeFile.language}
                      filePath={activeFile.path}
                      maxHeightClass="flex-1 h-full"
                      backgroundHex={appearance?.backgroundHex || "#101010"}
                      foregroundHex={appearance?.foregroundHex || "#F7EAEA"}
                      accentHex={appearance?.accentHex || "#007ACC"}
                      contrastMode={appearance?.contrastMode || "default"}
                      showHeaderBreadcrumb
                    />
                  </div>
                ) : (
                  <textarea
                    value={activeFile.content}
                    onChange={(e) =>
                      onChangeFiles(
                        files.map((f) => (f.path === activeFile.path ? { ...f, content: e.target.value } : f))
                      )
                    }
                    spellCheck={false}
                    style={{
                      backgroundColor: appearance?.backgroundHex || "#101010",
                      color: appearance?.foregroundHex || "#F7EAEA",
                    }}
                    className="flex-1 w-full p-3 font-mono text-xs resize-none focus:outline-none"
                  />
                )}
              </div>
            )}

            {/* Live Sandpack-Style Preview Frame */}
            {(viewSplit === "split" || viewSplit === "preview") && (
              <div className="flex-1 flex flex-col min-w-0 relative bg-[#18191E]">
                <div className="flex-1 flex items-center justify-center p-2 overflow-auto relative">
                  <iframe
                    title="HEYUKA Live Preview"
                    srcDoc={previewHtmlDoc}
                    sandbox="allow-scripts allow-forms allow-modals"
                    className={`bg-white rounded-xl border border-white/15 transition-all h-full ${
                      viewport === "mobile" ? "w-[375px]" : viewport === "tablet" ? "w-[768px]" : "w-full"
                    }`}
                  />
                  {annotateMode && (
                    <canvas
                      ref={annotateCanvasRef}
                      width={680}
                      height={420}
                      onMouseDown={() => { drawingRef.current = true; }}
                      onMouseUp={() => { drawingRef.current = false; }}
                      onMouseMove={(e) => {
                        if (!drawingRef.current || !annotateCanvasRef.current) return;
                        const rect = annotateCanvasRef.current.getBoundingClientRect();
                        const ctx = annotateCanvasRef.current.getContext("2d");
                        if (!ctx) return;
                        ctx.fillStyle = "#f43f5e";
                        ctx.beginPath();
                        ctx.arc(((e.clientX - rect.left) / rect.width) * 680, ((e.clientY - rect.top) / rect.height) * 420, 6, 0, Math.PI * 2);
                        ctx.fill();
                      }}
                      className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] cursor-crosshair rounded-xl border-2 border-rose-500/60"
                    />
                  )}
                </div>

                {/* Vibe Coding Suggestion Chips + Console Error Catcher */}
                <div className="px-3 py-2 border-t border-white/10 space-y-1.5 bg-white/[0.03]">
                  <div className="flex flex-wrap gap-1.5">
                    {["Add Dark Mode", "Add CSV Export", "Make Mobile Responsive", "Connect KASPI POS API"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => onRunPromptFromChild(`${chip} to the current Build project.`)}
                        className="px-2 py-0.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-[10px] font-semibold cursor-pointer"
                      >
                        ✨ {chip}
                      </button>
                    ))}
                  </div>
                  {previewLogs.length > 0 && (
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-1 rounded">
                      <span className="truncate">{previewLogs[0]}</span>
                      <button
                        type="button"
                        onClick={() => onRunPromptFromChild(`Fix this preview console error cleanly: ${previewLogs[0]}`)}
                        className="px-2 py-0.5 rounded bg-rose-500/30 font-bold cursor-pointer shrink-0"
                      >
                        Fix with AI
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded Live Browser + PowerShell Terminal + Elastic 3/6/12 Swarm & Worker Bots Utility Bar */}
      <div className="border-t border-white/10 bg-white/[0.03]">
        <div className="px-3 py-1 flex flex-wrap items-center justify-between gap-2 bg-[#141416]">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: "swarm", icon: Activity, label: `Swarm (${councilData?.modelCount || 3}/6/12)` },
              { id: "browser", icon: Globe, label: "Browser" },
              { id: "terminal", icon: Terminal, label: "Terminal" },
              { id: "none", icon: Eye, label: "Collapse" },
            ].map((tb) => {
              const Icon = tb.icon;
              const isAct = bottomUtilityTab === tb.id && tb.id !== "none";
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setBottomUtilityTab(tb.id as typeof bottomUtilityTab)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isAct
                      ? "bg-white/[0.1] text-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tb.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {bottomUtilityTab === "swarm" && (
          <div className="p-3 border-t border-white/10 space-y-3 max-h-64 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-bold">
                {councilData
                  ? `Active Tier: ${councilData.tier.toUpperCase()} (${councilData.modelCount} Models + ${councilData.spawnedBots.length} Worker Bots)`
                  : "Elastic 3 -> 6 -> 12 Model Swarm Ready"}
              </div>
              <div className="flex gap-1.5">
                {(["3x_fast", "6x_pro", "12x_titan"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onTriggerCouncil(tier, activeFile.path || "Build full-stack app")}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-[10px] font-bold cursor-pointer"
                  >
                    Run {tier.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            {councilData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px]">
                <div className="flex flex-wrap gap-1.5">
                  {councilData.nodes.map((n) => (
                    <div key={n.id} className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10">
                      <div className="font-bold text-sky-300">{n.role}</div>
                      <div className="text-[10px] font-mono text-[var(--kaspi-text-muted)]">{n.model} • {n.latencyMs}ms</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {councilData.spawnedBots.map((b) => (
                    <div key={b.botId} className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-emerald-300">{b.botType}</span>
                      <span className="truncate text-[10px]">{b.outputPreview}</span>
                      <span className="font-mono text-[10px]">exit={b.exitCode}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {bottomUtilityTab === "browser" && (
          <div className="p-3 border-t border-white/10 space-y-2.5 max-h-72 overflow-y-auto">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs font-mono"
              />
              <button type="button" onClick={runLiveBrowserFetch} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${accentBtn}`}>
                {browserLoading ? "Loading..." : "Fetch Live URL"}
              </button>
              <button
                type="button"
                onClick={() => browserSnapshot && onInjectContextText(browserUrl, browserSnapshot)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.07] text-[11px] font-semibold cursor-pointer"
              >
                Send to Context
              </button>
              <button
                type="button"
                onClick={() => {
                  setOauthPausedForUser((p) => !p);
                  if (oauthPausedForUser) setGmailSignedIn(true);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                  gmailSignedIn
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-500/15 border-amber-500/40 text-amber-300"
                }`}
              >
                {oauthPausedForUser ? "Resume AI After Gmail Login" : gmailSignedIn ? "OAuth Session Ready ✓" : "Human OAuth Handshake"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                value={cloudProjectName}
                onChange={(e) => setCloudProjectName(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-xs font-mono"
                placeholder="project-slug"
              />
              <button type="button" onClick={runCloudFactoryProvision} className="px-3 py-1 rounded-lg bg-white/[0.09] hover:bg-white/[0.15] text-[11px] font-bold cursor-pointer">
                Generate GitHub + Vercel + Supabase + Docker Provisioning
              </button>
            </div>
            {(browserSnapshot || factoryOutput) && (
              <pre className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] font-mono max-h-36 overflow-auto whitespace-pre-wrap">
                {factoryOutput ? `${factoryOutput.cliProvisionScript}\n\n${factoryOutput.privacyShield}` : browserSnapshot}
              </pre>
            )}
          </div>
        )}

        {bottomUtilityTab === "terminal" && (
          <div className="p-3 border-t border-white/10 space-y-2 max-h-64 overflow-y-auto">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={termLang}
                onChange={(e) => setTermLang(e.target.value as typeof termLang)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.07] border border-white/15 text-xs font-mono"
              >
                <option value="powershell">PowerShell 7</option>
                <option value="python">Python 3 Sandbox</option>
                <option value="bash">Bash</option>
                <option value="javascript">Node.js</option>
              </select>
              <input
                type="text"
                value={termCmd}
                onChange={(e) => setTermCmd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runTerminalExec()}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs font-mono"
              />
              <button type="button" onClick={runTerminalExec} disabled={termBusy} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${accentBtn}`}>
                {termBusy ? "Running..." : "Execute"}
              </button>
              <button
                type="button"
                onClick={() => onRunPromptFromChild(`Analyze and explain/fix this terminal output:\n${termOut}`)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold cursor-pointer"
              >
                Fix Error with AI
              </button>
            </div>
            <pre className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] font-mono max-h-32 overflow-auto whitespace-pre-wrap">
              {termOut}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
