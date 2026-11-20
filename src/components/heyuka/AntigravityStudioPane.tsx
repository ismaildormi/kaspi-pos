"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Download,
  Eraser,
  Eye,
  FileCode2,
  FolderOpen,
  HardDrive,
  Layers,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Upload,
  Video,
  Volume2,
  X,
} from "lucide-react";
import {
  buildClientProjectZipBlob,
  buildPortableHeyukaAppHtml,
  executeJsInClientWorker,
  probeClientHardware,
  synthesizeAudioWavOnClientCpu,
  unpackUploadedFilesOrZip,
  type ClientHardwareTelemetry,
  type ClientMediaArtifact,
  type ClientStudioFile,
} from "@/lib/heyuka/client-cpu-engine";

interface ThinkingPhaseStep {
  phase: string;
  agentModel: string;
  summary: string;
  durationMs: number;
  timestamp: string;
}

interface AntigravityStudioPaneProps {
  files: ClientStudioFile[];
  onChangeFiles: (next: ClientStudioFile[]) => void;
  mediaArtifacts: ClientMediaArtifact[];
  onAddMediaArtifact?: (artifact: ClientMediaArtifact) => void;
  activePollinationsUrl?: string | null;
  editableImageUrl?: string | null;
  videoProgressPct: number | null;
  isRenderingMedia: boolean;
  executionPolicy: "turbo" | "auto" | "review";
  activeModel: string;
  thinkingSteps?: ThinkingPhaseStep[];
  onClose: () => void;
  locale: "ar" | "fr" | "en";
}

function InteractiveImageInpaintEditor({
  sourceUrl,
  locale,
}: {
  sourceUrl: string;
  locale: "ar" | "fr" | "en";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState(28);
  const [mode, setMode] = useState<"blur_inpaint" | "erase">("blur_inpaint");
  const drawingRef = useRef(false);

  const paintInitial = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const scale = Math.min(1, 680 / Math.max(img.width || 680, 1));
    canvas.width = Math.max(200, Math.round((img.width || 640) * scale));
    canvas.height = Math.max(150, Math.round((img.height || 400) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      paintInitial();
    };
    img.src = sourceUrl;
  }, [sourceUrl]);

  const applyBrush = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.save();
    if (mode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sample nearby horizontal background pixels cleanly onto brushed region (Client GPU Patch!)
      const sx = Math.max(0, Math.min(canvas.width - brushSize, x > canvas.width / 2 ? x - brushSize * 2 : x + brushSize));
      const sy = Math.max(0, Math.min(canvas.height - brushSize, y - brushSize / 2));
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.filter = "blur(8px)";
      ctx.drawImage(canvas, sx, sy, brushSize, brushSize, x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
    ctx.restore();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heyuka-edited-${Date.now().toString(36)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-[#1B1D23] border border-rose-500/35 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          <Eraser className="w-4 h-4 text-rose-400" />
          <span>
            {locale === "ar"
              ? "محرر الصور المباشر على معالج جهازك (إزالة الأشخاص / الخلفية)"
              : "Client-GPU Image Studio (Brush Clean / Isolate Background)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode((m) => (m === "blur_inpaint" ? "erase" : "blur_inpaint"))}
            className="px-2.5 py-1 rounded-lg bg-white/10 text-zinc-200 text-[11px] font-semibold cursor-pointer"
          >
            {mode === "blur_inpaint" ? "Mode: Smart Patch" : "Mode: Transparent Erase"}
          </button>
          <button
            type="button"
            onClick={paintInitial}
            className="p-1.5 rounded-lg bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
            title="Reset image"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
        <span>Brush Size: {brushSize}px</span>
        <input
          type="range"
          min={8}
          max={72}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="accent-rose-600 cursor-pointer"
        />
        <span className="text-rose-300">
          {locale === "ar"
            ? "مرّر الفرشاة فوق الأشخاص لإزالتهم وتعويض الخلفية"
            : "Paint over objects/people to blend background"}
        </span>
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10 bg-[repeating-conic-gradient(#1e2028_0%_25%,#14151a_0%_50%)] bg-[length:20px_20px] flex justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            drawingRef.current = true;
            applyBrush(e);
          }}
          onPointerMove={(e) => {
            if (drawingRef.current) applyBrush(e);
          }}
          onPointerUp={() => {
            drawingRef.current = false;
          }}
          onPointerLeave={() => {
            drawingRef.current = false;
          }}
          className="max-w-full h-auto cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
}

function Interactive3dCanvas({ prompt }: { prompt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let angle = 0;
    const vertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    const render = () => {
      angle += 0.018;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#111215";
      ctx.fillRect(0, 0, w, h);

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosB = Math.cos(angle * 0.65);
      const sinB = Math.sin(angle * 0.65);

      const proj = vertices.map(([vx, vy, vz]) => {
        const x1 = vx * cosA - vz * sinA;
        const z1 = vx * sinA + vz * cosA;
        const y2 = vy * cosB - z1 * sinB;
        const z2 = vy * sinB + z1 * cosB;
        const scale = 190 / (4.2 + z2);
        return [w / 2 + x1 * scale, h / 2 + y2 * scale];
      });

      ctx.strokeStyle = "#E11D48";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (const [a, b] of edges) {
        ctx.moveTo(proj[a][0], proj[a][1]);
        ctx.lineTo(proj[b][0], proj[b][1]);
      }
      ctx.stroke();

      for (const [px, py] of proj) {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#A1A1AA";
      ctx.font = "12px monospace";
      ctx.fillText(`HEYUKA 3D GPU • ${prompt.slice(0, 38)}`, 16, h - 16);
      raf = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(raf);
  }, [prompt]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={380}
      className="w-full max-w-xl rounded-xl border border-white/10 bg-[#111215]"
    />
  );
}

export function AntigravityStudioPane({
  files,
  onChangeFiles,
  mediaArtifacts,
  onAddMediaArtifact,
  activePollinationsUrl,
  editableImageUrl,
  videoProgressPct,
  isRenderingMedia,
  executionPolicy,
  activeModel,
  thinkingSteps = [],
  onClose,
  locale,
}: AntigravityStudioPaneProps) {
  const [stageTab, setStageTab] = useState<
    "overview" | "preview" | "code" | "review" | "terminal" | "audio"
  >("preview");
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || "");
  const [selectedArtifactIdx, setSelectedArtifactIdx] = useState<number>(0);
  const [hw, setHw] = useState<ClientHardwareTelemetry | null>(null);
  const [terminalCmd, setTerminalCmd] = useState("");
  const [workerLogs, setWorkerLogs] = useState<string[]>([
    "PS C:\\HEYUKA\\studio> Antigravity Client-CPU Terminal Ready ($0.00 Server Cost).",
    "Type `help`, `ls`, `cat <file>`, `node <file.js>`, `sast`, `hw`, or any JS expression.",
  ]);
  const [workerRunning, setWorkerRunning] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);
  const [audioSynthPrompt, setAudioSynthPrompt] = useState("HEYUKA Futuristic Studio Pulse");
  const [audioSynthBpm, setAudioSynthBpm] = useState(112);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const uploadAppInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHw(probeClientHardware());
  }, []);

  useEffect(() => {
    if (files.length > 0 && !files.some((f) => f.path === selectedPath)) {
      setSelectedPath(files[0].path);
    }
  }, [files, selectedPath]);

  useEffect(() => {
    if (mediaArtifacts.length > 0 || editableImageUrl) {
      if (mediaArtifacts.length > 0) setSelectedArtifactIdx(mediaArtifacts.length - 1);
      setStageTab("preview");
    }
  }, [mediaArtifacts.length, editableImageUrl]);

  const activeFile = useMemo(
    () => files.find((f) => f.path === selectedPath) || files[0] || null,
    [files, selectedPath]
  );

  const activeArtifact = mediaArtifacts[selectedArtifactIdx] || mediaArtifacts[0] || null;

  const reviewFindings = useMemo(() => {
    const issues: Array<{ file: string; severity: "warn" | "ok"; note: string }> = [];
    for (const f of files) {
      const c = f.content || "";
      if (/\beval\s*\(|new Function\s*\(/.test(c)) {
        issues.push({ file: f.path, severity: "warn", note: "Dynamic code evaluation detected (`eval` / `Function`). Verify untrusted input sanitization." });
      }
      if (/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(c)) {
        issues.push({ file: f.path, severity: "warn", note: "DOM HTML sink found (`innerHTML`). Prefer `textContent` or sanitized nodes." });
      }
      if (/(?:AIzaSy|sk-live|ghp_|xoxb-)[A-Za-z0-9_-]{8,}/.test(c)) {
        issues.push({ file: f.path, severity: "warn", note: "Potential secret/key literal detected. Move keys to encrypted vault/env." });
      }
      if (!issues.some((i) => i.file === f.path)) {
        issues.push({ file: f.path, severity: "ok", note: "Clean static client-side security & structure check." });
      }
    }
    return issues;
  }, [files]);

  const assembledHtmlSrcDoc = useMemo(() => {
    const htmlFile = files.find((f) => f.path.endsWith(".html") || f.language === "html");
    const cssFiles = files.filter((f) => f.path.endsWith(".css") || f.language === "css");
    const jsFiles = files.filter(
      (f) => f.path.endsWith(".js") || f.language === "js" || f.language === "javascript"
    );

    if (htmlFile) {
      let doc = htmlFile.content;
      if (cssFiles.length > 0) {
        const styleTag = `<style>\n${cssFiles.map((c) => c.content).join("\n")}\n</style>`;
        doc = doc.includes("</head>") ? doc.replace("</head>", `${styleTag}</head>`) : `${styleTag}${doc}`;
      }
      if (jsFiles.length > 0) {
        const scriptTag = `<script>\n${jsFiles.map((j) => j.content).join("\n")}\n</script>`;
        doc = doc.includes("</body>") ? doc.replace("</body>", `${scriptTag}</body>`) : `${doc}${scriptTag}`;
      }
      return doc;
    }

    const svgFile = files.find((f) => f.path.endsWith(".svg") || f.language === "svg");
    if (svgFile) {
      return `<!DOCTYPE html><html><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#111215;">${svgFile.content}</body></html>`;
    }

    if (jsFiles.length > 0) {
      return `<!DOCTYPE html><html><body style="margin:0;background:#111215;color:#f4f4f5;font-family:monospace;padding:20px;"><pre id="out"></pre><script>const log=(...a)=>{document.getElementById('out').textContent+=a.join(' ')+'\\n';};console.log=log;try{${jsFiles.map((j) => j.content).join("\n")}}catch(e){log('Error:',e.message);}</script></body></html>`;
    }
    return null;
  }, [files]);

  const handleOpenLocalFolder = async () => {
    const win = window as any;
    if (typeof win.showDirectoryPicker === "function") {
      try {
        const dirHandle = await win.showDirectoryPicker();
        const loaded: ClientStudioFile[] = [];
        for await (const [name, handle] of dirHandle.entries()) {
          if (handle.kind === "file" && loaded.length < 30) {
            const file = await handle.getFile();
            if (file.size <= 300_000) {
              const text = await file.text();
              const ext = name.split(".").pop() || "txt";
              loaded.push({ path: name, language: ext, content: text });
            }
          }
        }
        if (loaded.length > 0) {
          onChangeFiles(loaded);
          setSelectedPath(loaded[0].path);
          setWorkerLogs((p) => [
            ...p,
            `PS C:\\HEYUKA\\studio> Mounted ${loaded.length} file(s) from "${dirHandle.name}" cleanly on client CPU.`,
          ]);
        }
        return;
      } catch {}
    }
    folderInputRef.current?.click();
  };

  const handleFilesOrZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawList = Array.from(e.target.files || []);
    if (rawList.length === 0) return;
    const loaded = await unpackUploadedFilesOrZip(rawList);
    if (loaded.length > 0) {
      onChangeFiles(loaded);
      setSelectedPath(loaded[0].path);
      setStageTab("preview");
      setWorkerLogs((p) => [
        ...p,
        `PS C:\\HEYUKA\\studio> Unpacked/uploaded ${loaded.length} file(s) into workspace ($0 server cost).`,
      ]);
    }
    e.target.value = "";
  };

  const runShellCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;
    const lower = cmd.toLowerCase();
    setWorkerLogs((p) => [...p, `PS C:\\HEYUKA\\studio> ${cmd}`]);

    if (lower === "clear" || lower === "cls") {
      setWorkerLogs(["PS C:\\HEYUKA\\studio> Console cleared."]);
      return;
    }
    if (lower === "help") {
      setWorkerLogs((p) => [
        ...p,
        "Built-in Client Commands: ls | dir | pwd | cat <path> | touch <path> | rm <path> | node <file.js> | run | sast | hw | zip | date | clear",
      ]);
      return;
    }
    if (lower === "pwd") {
      setWorkerLogs((p) => [...p, "/heyuka/workspace (Browser Virtual FS)"]);
      return;
    }
    if (lower === "date") {
      setWorkerLogs((p) => [...p, new Date().toString()]);
      return;
    }
    if (lower === "ls" || lower === "dir") {
      setWorkerLogs((p) => [
        ...p,
        files.length > 0
          ? files.map((f) => `${String(f.content.length).padStart(7)}B  ${f.path}`).join("\n")
          : "(empty workspace)",
      ]);
      return;
    }
    if (lower === "hw") {
      setWorkerLogs((p) => [
        ...p,
        `CPU Cores: ${hw?.cpuCores || 4} | RAM: ${hw?.deviceMemoryGb || "Browser"}GB | GPU: ${hw?.gpuRenderer || "WebGL2"} | Cost: $0.00`,
      ]);
      return;
    }
    if (lower === "sast") {
      setWorkerLogs((p) => [
        ...p,
        ...reviewFindings.map((r) => `[${r.severity.toUpperCase()}] ${r.file}: ${r.note}`),
      ]);
      return;
    }
    if (lower === "zip") {
      handleDownloadZip();
      setWorkerLogs((p) => [...p, "Exported workspace PKZIP cleanly."]);
      return;
    }
    if (lower.startsWith("cat ")) {
      const targetName = cmd.slice(4).trim();
      const found = files.find((f) => f.path === targetName || f.path.endsWith(`/${targetName}`));
      setWorkerLogs((p) => [
        ...p,
        found ? found.content.slice(0, 1800) : `File not found: ${targetName}`,
      ]);
      return;
    }
    if (lower.startsWith("touch ")) {
      const name = cmd.slice(6).trim();
      if (name && !files.some((f) => f.path === name)) {
        onChangeFiles([...files, { path: name, language: name.split(".").pop() || "txt", content: "" }]);
        setSelectedPath(name);
        setWorkerLogs((p) => [...p, `Created ${name}`]);
      }
      return;
    }
    if (lower.startsWith("rm ")) {
      const name = cmd.slice(3).trim();
      onChangeFiles(files.filter((f) => f.path !== name));
      setWorkerLogs((p) => [...p, `Removed ${name}`]);
      return;
    }
    if (lower.startsWith("echo ")) {
      setWorkerLogs((p) => [...p, cmd.slice(5)]);
      return;
    }

    // Run active JS file or evaluate inline JS inside Client Web Worker
    let codeToExec = cmd;
    if (lower === "run" && activeFile) {
      codeToExec = activeFile.content;
    } else if (lower.startsWith("node ")) {
      const fname = cmd.slice(5).trim();
      const match = files.find((f) => f.path === fname);
      if (!match) {
        setWorkerLogs((p) => [...p, `File not found: ${fname}`]);
        return;
      }
      codeToExec = match.content;
    }

    setWorkerRunning(true);
    const res = await executeJsInClientWorker(codeToExec);
    setWorkerRunning(false);
    setWorkerLogs((p) =>
      [
        ...p,
        ...res.logs,
        res.result !== undefined ? `<= ${res.result}` : "",
        res.error ? `[Error] ${res.error}` : `[CPU Worker Done: ${res.durationMs}ms • $0.00]`,
      ].filter(Boolean)
    );
  };

  const handleRunOnClientCpu = async () => {
    if (activeFile && (activeFile.path.endsWith(".js") || activeFile.language === "js")) {
      setStageTab("terminal");
      await runShellCommand(`node ${activeFile.path}`);
      return;
    }
    setStageTab("preview");
    setWorkerLogs((prev) => [
      ...prev,
      `PS C:\\HEYUKA\\studio> Refreshed sandboxed client preview ($0.00).`,
    ]);
  };

  const handleDownloadZip = () => {
    if (files.length === 0) return;
    const zipBlob = buildClientProjectZipBlob(files);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heyuka-studio-${Date.now().toString(36)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPortableApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://kaspi-pos.vercel.app";
    const html = buildPortableHeyukaAppHtml(origin);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "HEYUKA-Portable-Studio.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadActiveFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.path.split("/").pop() || "artifact.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNewFile = () => {
    const name = `module-${files.length + 1}.js`;
    const nextFile: ClientStudioFile = {
      path: name,
      language: "js",
      content: `// Runs directly inside your browser CPU Web Worker ($0.00)\nconst t0 = performance.now();\nconsole.log("HEYUKA local execution finished in", (performance.now() - t0).toFixed(2), "ms on", navigator.hardwareConcurrency, "cores");\n`,
    };
    onChangeFiles([...files, nextFile]);
    setSelectedPath(name);
    setStageTab("code");
  };

  const handleCopyFile = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 1400);
    } catch {}
  };

  return (
    <section className="h-full flex flex-col bg-[#111215] border-l border-white/[0.08] text-zinc-100 select-none min-w-0">
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory supported on Chromium/Edge/Firefox
        webkitdirectory="true"
        className="hidden"
        onChange={(e) => void handleFilesOrZipUpload(e)}
      />
      <input
        ref={uploadAppInputRef}
        type="file"
        multiple
        accept=".zip,.html,.css,.js,.jsx,.ts,.tsx,.py,.json,.svg,.md,.txt,.sql,.ps1,.sh"
        className="hidden"
        onChange={(e) => void handleFilesOrZipUpload(e)}
      />

      {/* Top Antigravity IDE Toolbar */}
      <header className="h-14 px-3 border-b border-white/[0.07] bg-[#141519] flex items-center justify-between gap-2 shrink-0 overflow-x-auto kaspi-no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2 py-1 rounded-md bg-rose-500/15 border border-rose-500/35 text-rose-400 text-[11px] font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Antigravity Studio</span>
          </div>
          <span className="hidden xl:inline-flex text-[11px] font-mono text-zinc-400">
            {hw?.cpuCores || 4} Cores • {executionPolicy.toUpperCase()} • $0.00
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => uploadAppInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-medium cursor-pointer"
            title="Upload App (.zip or files) into Studio"
          >
            <Upload className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Upload App</span>
          </button>

          <button
            type="button"
            onClick={() => void handleOpenLocalFolder()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-medium cursor-pointer"
            title="Connect Local Computer Folder"
          >
            <FolderOpen className="w-3.5 h-3.5 text-zinc-300" />
            <span className="hidden md:inline">Folder</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPortableApp}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-medium cursor-pointer"
            title="Export Portable HEYUKA Studio App (.html)"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Export App</span>
          </button>

          <button
            type="button"
            onClick={() => void handleRunOnClientCpu()}
            disabled={workerRunning}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E11D48] hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
          >
            {workerRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Run CPU</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={files.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 text-[11px] font-bold cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.ZIP</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Interior Split: File Tree + Right Stage */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
        {/* File Explorer */}
        <aside className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-white/[0.06] bg-[#0F1013] p-2.5 flex flex-col gap-3 overflow-y-auto max-h-36 sm:max-h-none">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Files ({files.length})
            </span>
            <button
              type="button"
              onClick={handleAddNewFile}
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              title="New file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible">
            {files.length === 0 ? (
              <p className="text-[11px] text-zinc-500 px-1.5 py-2">
                Upload a `.zip` / folder or ask HEYUKA to generate code, apps, video, 3D, or audio.
              </p>
            ) : (
              files.map((f) => {
                const active = f.path === activeFile?.path;
                return (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => {
                      setSelectedPath(f.path);
                      setStageTab("code");
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-start shrink-0 cursor-pointer transition-colors ${
                      active
                        ? "bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30"
                        : "text-zinc-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span className="truncate font-mono text-[11px]">{f.path}</span>
                  </button>
                );
              })
            )}
          </div>

          {mediaArtifacts.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 block">
                Media ({mediaArtifacts.length})
              </span>
              {mediaArtifacts.map((art, idx) => (
                <button
                  key={`${art.filename}-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedArtifactIdx(idx);
                    setStageTab("preview");
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-start cursor-pointer ${
                    idx === selectedArtifactIdx && stageTab === "preview"
                      ? "bg-white/[0.11] text-white font-semibold"
                      : "text-zinc-400 hover:bg-white/[0.05]"
                  }`}
                >
                  {art.kind === "video" ? (
                    <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : art.kind === "audio" ? (
                    <Volume2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span className="truncate font-mono text-[11px]">{art.filename}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right Stage: Antigravity IDE Tabs (Overview | Preview | Code | Review | Terminal | Audio) */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-3 py-2 border-b border-white/[0.06] bg-[#141519] flex items-center justify-between gap-2 overflow-x-auto kaspi-no-scrollbar">
            <div className="inline-flex rounded-lg bg-[#0D0E11] p-0.5 text-[11px] shrink-0">
              {[
                { id: "overview" as const, label: "Overview", icon: Layers },
                { id: "preview" as const, label: "Preview / 3D", icon: Eye },
                { id: "code" as const, label: "Code", icon: Code2 },
                { id: "review" as const, label: "Review", icon: ShieldCheck },
                { id: "terminal" as const, label: "Terminal", icon: Terminal },
                { id: "audio" as const, label: "Audio", icon: AudioLines },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStageTab(t.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                      stageTab === t.id ? "bg-[#23252C] text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {activeFile && stageTab === "code" && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleCopyFile()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[11px] text-zinc-200 cursor-pointer"
                >
                  {copiedFile ? <Check className="w-3 h-3 text-rose-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFile ? "Copied" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadActiveFile}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[11px] text-zinc-200 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Stage Viewport */}
          <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4 bg-[#15161A]">
            {stageTab === "overview" && (
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-3">
                    <p className="text-zinc-400 text-[10px]">Active Model</p>
                    <p className="font-mono font-bold text-rose-300 mt-0.5 truncate">{activeModel}</p>
                  </div>
                  <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-3">
                    <p className="text-zinc-400 text-[10px]">Policy Mode</p>
                    <p className="font-mono font-bold text-white mt-0.5 uppercase">{executionPolicy}</p>
                  </div>
                  <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-3">
                    <p className="text-zinc-400 text-[10px]">Client Hardware</p>
                    <p className="font-mono font-bold text-white mt-0.5">{hw?.cpuCores || 4} CPU Threads</p>
                  </div>
                  <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-3">
                    <p className="text-zinc-400 text-[10px]">Server Cost</p>
                    <p className="font-mono font-bold text-rose-400 mt-0.5">$0.00 Free</p>
                  </div>
                </div>

                {thinkingSteps.length > 0 && (
                  <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-white">Latest Agent Execution Pipeline</h4>
                    {thinkingSteps.map((s, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 text-xs border-t border-white/[0.05] pt-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-rose-300">
                            {idx + 1}. {s.phase} <span className="text-zinc-500 font-mono">[{s.agentModel}]</span>
                          </p>
                          <p className="text-zinc-400 text-[11px]">{s.summary}</p>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                          {s.timestamp} • {s.durationMs}ms
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-4 space-y-2.5 text-xs">
                  <h4 className="font-bold text-white">Portable HEYUKA App &amp; Local Machine Bridge</h4>
                  <p className="text-zinc-400 leading-relaxed">
                    Download the standalone portable HTML studio app or upload your own `.zip` / project folder from your PC to edit, preview, review SAST security, or execute scripts directly on your CPU.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => uploadAppInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-zinc-900 font-bold text-[11px] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload App / .ZIP</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPortableApp}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Portable HEYUKA App (.html)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {stageTab === "preview" && (
              <div className="h-full flex flex-col gap-4 items-center justify-center">
                {isRenderingMedia && (
                  <div className="w-full max-w-lg rounded-2xl bg-[#1C1E24] border border-rose-500/35 p-5 space-y-2.5 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        Rendering on Your Device CPU/GPU ({hw?.cpuCores || 4} Cores)
                        {videoProgressPct !== null ? ` — ${videoProgressPct}%` : ""}
                      </span>
                    </div>
                    {videoProgressPct !== null && (
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-rose-600 transition-all" style={{ width: `${videoProgressPct}%` }} />
                      </div>
                    )}
                  </div>
                )}

                {editableImageUrl && (
                  <InteractiveImageInpaintEditor sourceUrl={editableImageUrl} locale={locale} />
                )}

                {activeArtifact && (
                  <div className="w-full max-w-2xl rounded-2xl bg-[#1B1D23] border border-white/[0.08] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white truncate">{activeArtifact.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-400">
                          {activeArtifact.cpuCoresUsed} Cores • {activeArtifact.durationMs}ms •{" "}
                          {Math.round(activeArtifact.bytes / 1024)} KB
                        </span>
                        {activeArtifact.objectUrl && (
                          <a
                            href={activeArtifact.objectUrl}
                            download={activeArtifact.filename}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {activeArtifact.kind === "video" && (
                      <video
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        src={activeArtifact.objectUrl}
                        className="w-full rounded-xl border border-white/10 bg-black"
                      />
                    )}
                    {activeArtifact.kind === "image" && (
                      <div className="space-y-3">
                        <img
                          src={activeArtifact.objectUrl}
                          alt={activeArtifact.title}
                          className="w-full rounded-xl border border-white/10 object-contain"
                        />
                        {activePollinationsUrl && (
                          <details className="rounded-xl bg-black/30 p-2.5 text-xs">
                            <summary className="cursor-pointer text-rose-400 font-semibold">
                              View Cloud AI Diffusion Variant (Zero-Key)
                            </summary>
                            <img src={activePollinationsUrl} alt="AI Diffusion" className="w-full rounded-lg mt-2 object-contain" />
                          </details>
                        )}
                      </div>
                    )}
                    {activeArtifact.kind === "audio" && (
                      <audio controls src={activeArtifact.objectUrl} className="w-full" />
                    )}
                    {activeArtifact.kind === "3d" && (
                      <div className="flex justify-center">
                        <Interactive3dCanvas prompt={activeArtifact.title} />
                      </div>
                    )}
                  </div>
                )}

                {assembledHtmlSrcDoc && (
                  <div className="w-full h-full min-h-[320px] flex flex-col rounded-xl border border-white/10 overflow-hidden bg-white">
                    <div className="px-3 py-1.5 bg-[#1C1D22] border-b border-white/10 flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                      <span>Live Browser DOM Preview ($0.00)</span>
                      <span className="text-rose-400">Client CPU</span>
                    </div>
                    <iframe
                      title="HEYUKA Antigravity Live Preview"
                      sandbox="allow-scripts"
                      srcDoc={assembledHtmlSrcDoc}
                      className="w-full flex-1 min-h-[300px] border-0 bg-[#111215]"
                    />
                  </div>
                )}

                {!activeArtifact && !assembledHtmlSrcDoc && !editableImageUrl && !isRenderingMedia && (
                  <div className="text-center max-w-sm space-y-3 py-10">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Antigravity Studio Ready</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Upload a `.zip` or folder, draw or edit photos on GPU, render 30fps WebM videos, inspect 3D geometry, or run code in the Terminal tab at $0.00 server cost.
                    </p>
                  </div>
                )}
              </div>
            )}

            {stageTab === "code" && (
              <div className="h-full flex flex-col">
                {activeFile ? (
                  <textarea
                    value={activeFile.content}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChangeFiles(files.map((f) => (f.path === activeFile.path ? { ...f, content: val } : f)));
                    }}
                    spellCheck={false}
                    className="w-full h-full min-h-[380px] rounded-xl bg-[#0D0E12] border border-white/[0.08] p-4 font-mono text-xs text-zinc-100 leading-relaxed focus:outline-none focus:border-rose-500 resize-none select-text"
                  />
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-12">Select or create a file to edit code.</p>
                )}
              </div>
            )}

            {stageTab === "review" && (
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">
                    Automated Security &amp; Diff Review ({files.length} files scanned on client CPU)
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono text-[10px] uppercase">
                    Policy: {executionPolicy}
                  </span>
                </div>
                {reviewFindings.length === 0 ? (
                  <p className="text-xs text-zinc-500">No files loaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {reviewFindings.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-[#1D1E23] border border-white/[0.07] p-3 flex items-start gap-2.5 text-xs"
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            item.severity === "ok" ? "text-zinc-300" : "text-rose-400"
                          }`}
                        />
                        <div>
                          <p className="font-mono font-bold text-white">{item.file}</p>
                          <p className="text-zinc-400 mt-0.5">{item.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {stageTab === "terminal" && (
              <div className="h-full flex flex-col gap-3">
                <div className="flex-1 min-h-[260px] rounded-xl bg-[#0B0C0F] border border-white/[0.08] p-3.5 flex flex-col justify-between gap-2">
                  <div className="overflow-y-auto space-y-1 font-mono text-[11px] text-zinc-200 select-text max-h-[340px]">
                    {workerLogs.map((line, i) => (
                      <div key={i} className="leading-relaxed whitespace-pre-wrap">
                        {line}
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const c = terminalCmd;
                      setTerminalCmd("");
                      void runShellCommand(c);
                    }}
                    className="flex items-center gap-2 border-t border-white/[0.08] pt-2.5 font-mono text-xs"
                  >
                    <span className="text-rose-400 font-bold shrink-0">PS studio&gt;</span>
                    <input
                      type="text"
                      value={terminalCmd}
                      onChange={(e) => setTerminalCmd(e.target.value)}
                      placeholder="ls, cat index.html, node script.js, sast, hw, clear..."
                      className="flex-1 bg-transparent text-zinc-100 focus:outline-none"
                    />
                  </form>
                </div>
              </div>
            )}

            {stageTab === "audio" && (
              <div className="space-y-4 max-w-xl text-xs">
                <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-4 space-y-3">
                  <h4 className="font-bold text-white">Client-CPU Audio &amp; Soundtrack Synthesizer (.WAV)</h4>
                  <input
                    type="text"
                    value={audioSynthPrompt}
                    onChange={(e) => setAudioSynthPrompt(e.target.value)}
                    className="w-full rounded-xl bg-[#111215] border border-white/10 px-3 py-2 text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-zinc-400">Tempo: {audioSynthBpm} BPM</label>
                    <input
                      type="range"
                      min={70}
                      max={160}
                      value={audioSynthBpm}
                      onChange={(e) => setAudioSynthBpm(Number(e.target.value))}
                      className="accent-rose-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const wav = synthesizeAudioWavOnClientCpu({
                        title: audioSynthPrompt || "HEYUKA Studio Track",
                        prompt: audioSynthPrompt,
                        bpm: audioSynthBpm,
                        durationSec: 4.5,
                      });
                      onAddMediaArtifact?.(wav);
                      setStageTab("preview");
                    }}
                    className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                  >
                    Synthesize .WAV on Client CPU ($0.00)
                  </button>
                </div>
                <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-4 space-y-1 text-zinc-400 font-mono text-[11px]">
                  <p>AudioContext: {hw?.supportsAudioContext ? "READY" : "UNAVAILABLE"}</p>
                  <p>SpeechSynthesis TTS: {hw?.supportsSpeechSynthesis ? "READY" : "UNAVAILABLE"}</p>
                  <p>SpeechRecognition STT: {hw?.supportsSpeechRecognition ? "READY" : "MediaRecorder Fallback Active"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
