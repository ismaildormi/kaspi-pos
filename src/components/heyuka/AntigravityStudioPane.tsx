"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Cpu,
  Download,
  Eye,
  FileCode2,
  FolderOpen,
  HardDrive,
  Loader2,
  Play,
  Plus,
  Terminal,
  Video,
  Volume2,
  X,
} from "lucide-react";
import {
  buildClientProjectZipBlob,
  executeJsInClientWorker,
  probeClientHardware,
  type ClientHardwareTelemetry,
  type ClientMediaArtifact,
  type ClientStudioFile,
} from "@/lib/heyuka/client-cpu-engine";

interface AntigravityStudioPaneProps {
  files: ClientStudioFile[];
  onChangeFiles: (next: ClientStudioFile[]) => void;
  mediaArtifacts: ClientMediaArtifact[];
  activePollinationsUrl?: string | null;
  videoProgressPct: number | null;
  isRenderingMedia: boolean;
  onClose: () => void;
  locale: "ar" | "fr" | "en";
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
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
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
  activePollinationsUrl,
  videoProgressPct,
  isRenderingMedia,
  onClose,
  locale,
}: AntigravityStudioPaneProps) {
  const [stageTab, setStageTab] = useState<"preview" | "code" | "cpu">("preview");
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || "");
  const [selectedArtifactIdx, setSelectedArtifactIdx] = useState<number>(0);
  const [hw, setHw] = useState<ClientHardwareTelemetry | null>(null);
  const [workerLogs, setWorkerLogs] = useState<string[]>([
    "[HEYUKA Client CPU] Ready. Computation executes directly on your device hardware ($0.00 server cost).",
  ]);
  const [workerRunning, setWorkerRunning] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHw(probeClientHardware());
  }, []);

  useEffect(() => {
    if (files.length > 0 && !files.some((f) => f.path === selectedPath)) {
      setSelectedPath(files[0].path);
    }
  }, [files, selectedPath]);

  useEffect(() => {
    if (mediaArtifacts.length > 0) {
      setSelectedArtifactIdx(mediaArtifacts.length - 1);
      setStageTab("preview");
    }
  }, [mediaArtifacts.length]);

  const activeFile = useMemo(
    () => files.find((f) => f.path === selectedPath) || files[0] || null,
    [files, selectedPath]
  );

  const activeArtifact = mediaArtifacts[selectedArtifactIdx] || mediaArtifacts[0] || null;

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
          if (handle.kind === "file" && loaded.length < 25) {
            const file = await handle.getFile();
            if (file.size <= 250_000) {
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
            `[Local Device Sync] Mounted ${loaded.length} file(s) from "${dirHandle.name}" strictly inside browser memory.`,
          ]);
        }
        return;
      } catch {
        // Cancelled or fallback to input
      }
    }
    folderInputRef.current?.click();
  };

  const handleFolderFallbackChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []).slice(0, 25);
    if (fileList.length === 0) return;
    const loaded: ClientStudioFile[] = [];
    for (const f of fileList) {
      if (f.size <= 250_000) {
        const content = await f.text();
        const rel = (f as any).webkitRelativePath || f.name;
        const ext = f.name.split(".").pop() || "txt";
        loaded.push({ path: rel, language: ext, content });
      }
    }
    if (loaded.length > 0) {
      onChangeFiles(loaded);
      setSelectedPath(loaded[0].path);
      setWorkerLogs((p) => [
        ...p,
        `[Local Device Sync] Loaded ${loaded.length} file(s) onto client CPU workspace.`,
      ]);
    }
  };

  const handleRunOnClientCpu = async () => {
    const target = activeFile;
    if (!target) {
      setStageTab("preview");
      return;
    }

    if (
      target.path.endsWith(".js") ||
      target.language === "js" ||
      target.language === "javascript"
    ) {
      setWorkerRunning(true);
      setStageTab("cpu");
      const res = await executeJsInClientWorker(target.content);
      setWorkerRunning(false);
      setWorkerLogs((prev) => [
        ...prev,
        `> Running ${target.path} on ${hw?.cpuCores || 4}-core Browser Web Worker...`,
        ...res.logs,
        res.result !== undefined ? `<= Return: ${res.result}` : "",
        res.error
          ? `[Error] ${res.error}`
          : `[Done in ${res.durationMs}ms • Server Cost: $0.00]`,
      ].filter(Boolean));
      return;
    }

    setStageTab("preview");
    setWorkerLogs((prev) => [
      ...prev,
      `[Client DOM Sandbox] Refreshed preview for ${target.path} cleanly ($0.00).`,
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
      content: `// Runs on your local CPU Web Worker\nconst t0 = performance.now();\nconsole.log("HEYUKA local execution complete in", (performance.now() - t0).toFixed(2), "ms");\n`,
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
        // @ts-expect-error webkitdirectory supported across desktop browsers
        webkitdirectory="true"
        className="hidden"
        onChange={(e) => void handleFolderFallbackChange(e)}
      />

      {/* Top Antigravity IDE Bar */}
      <header className="h-14 px-3 sm:px-4 border-b border-white/[0.07] bg-[#141519] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="px-2 py-1 rounded-md bg-rose-500/15 border border-rose-500/35 text-rose-400 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
            <Cpu className="w-3.5 h-3.5" />
            <span>Antigravity Studio</span>
          </div>
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 truncate">
            {hw?.cpuCores || 4} CPU Threads • $0.00 Server
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void handleOpenLocalFolder()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-medium cursor-pointer"
            title={locale === "ar" ? "فتح مجلد من جهازك" : "Connect Local Folder"}
          >
            <FolderOpen className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Device Folder</span>
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
            title="Download Project ZIP ($0)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.ZIP</span>
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

      {/* Main Split Interior: Left File Explorer + Right Stage */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
        {/* File Tree & Generated Assets */}
        <aside className="sm:w-48 shrink-0 border-b sm:border-b-0 sm:border-r border-white/[0.06] bg-[#0F1013] p-2.5 flex flex-col gap-3 overflow-y-auto max-h-40 sm:max-h-none">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Project Files ({files.length})
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
                Ask HEYUKA to generate code, an app, video, image, audio, or 3D scene.
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
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-start shrink-0 cursor-pointer transition-colors ${
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
                Media Outputs ({mediaArtifacts.length})
              </span>
              {mediaArtifacts.map((art, idx) => (
                <button
                  key={`${art.filename}-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedArtifactIdx(idx);
                    setStageTab("preview");
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-start cursor-pointer ${
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

        {/* Right Stage: Preview | Code | CPU Runner */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Sub-Tabs Bar */}
          <div className="px-3 py-2 border-b border-white/[0.06] bg-[#141519] flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg bg-[#0D0E11] p-0.5 text-xs">
              {[
                { id: "preview" as const, label: "Preview", icon: Eye },
                { id: "code" as const, label: "Code", icon: Code2 },
                { id: "cpu" as const, label: "CPU Runner", icon: Terminal },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStageTab(t.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
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
              <div className="flex items-center gap-1.5">
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

          {/* Stage Viewport */}
          <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4 bg-[#15161A]">
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
                        <div
                          className="h-full bg-rose-600 transition-all"
                          style={{ width: `${videoProgressPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeArtifact && (
                  <div className="w-full max-w-2xl rounded-2xl bg-[#1B1D23] border border-white/[0.08] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white truncate">{activeArtifact.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-400">
                          {activeArtifact.cpuCoresUsed} Cores • {activeArtifact.durationMs}ms •{" "}
                          {Math.round(activeArtifact.bytes / 1024)} KB • $0 Server
                        </span>
                        <a
                          href={activeArtifact.objectUrl}
                          download={activeArtifact.filename}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
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
                              View Cloud AI Diffusion Variant (Pollinations Zero-Key)
                            </summary>
                            <img
                              src={activePollinationsUrl}
                              alt="AI Diffusion Variant"
                              className="w-full rounded-lg mt-2 object-contain"
                            />
                          </details>
                        )}
                      </div>
                    )}
                    {activeArtifact.kind === "audio" && (
                      <div className="p-4 rounded-xl bg-[#111215] border border-white/10 space-y-2">
                        <audio controls src={activeArtifact.objectUrl} className="w-full" />
                        <p className="text-[11px] text-zinc-400 font-mono">
                          Synthesized natively via client WebAudio PCM WAV engine ({activeArtifact.durationMs}ms).
                        </p>
                      </div>
                    )}
                    {activeArtifact.kind === "3d" && (
                      <div className="flex justify-center">
                        <Interactive3dCanvas prompt={activeArtifact.title} />
                      </div>
                    )}
                  </div>
                )}

                {assembledHtmlSrcDoc && (
                  <div className="w-full h-full min-h-[340px] flex flex-col rounded-xl border border-white/10 overflow-hidden bg-white">
                    <div className="px-3 py-1.5 bg-[#1C1D22] border-b border-white/10 flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                      <span>Live Sandboxed Browser DOM Preview ($0.00)</span>
                      <span className="text-rose-400">Running on Device</span>
                    </div>
                    <iframe
                      title="HEYUKA Antigravity Live Preview"
                      sandbox="allow-scripts"
                      srcDoc={assembledHtmlSrcDoc}
                      className="w-full flex-1 min-h-[320px] border-0 bg-[#111215]"
                    />
                  </div>
                )}

                {!activeArtifact && !assembledHtmlSrcDoc && !isRenderingMedia && (
                  <div className="text-center max-w-sm space-y-3 py-12">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      HEYUKA Antigravity Studio Ready
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ask HEYUKA to code a web app, render a 30fps video, create images/audio/3D, scan security, or mount a folder from your own computer. All compute executes on your hardware at $0.00 cost.
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
                      onChangeFiles(
                        files.map((f) => (f.path === activeFile.path ? { ...f, content: val } : f))
                      );
                    }}
                    spellCheck={false}
                    className="w-full h-full min-h-[380px] rounded-xl bg-[#0D0E12] border border-white/[0.08] p-4 font-mono text-xs text-zinc-100 leading-relaxed focus:outline-none focus:border-rose-500 resize-none select-text"
                  />
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-12">
                    Select or create a file to edit code.
                  </p>
                )}
              </div>
            )}

            {stageTab === "cpu" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-3">
                    <p className="text-zinc-400 text-[10px]">CPU Threads</p>
                    <p className="font-mono font-bold text-base text-white">{hw?.cpuCores || 4} Cores</p>
                  </div>
                  <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-3">
                    <p className="text-zinc-400 text-[10px]">Device RAM</p>
                    <p className="font-mono font-bold text-base text-white">
                      {hw?.deviceMemoryGb ? `${hw.deviceMemoryGb} GB` : "Browser Pool"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-3 col-span-2">
                    <p className="text-zinc-400 text-[10px]">GPU / WebGL Engine</p>
                    <p className="font-mono text-xs text-rose-300 truncate mt-0.5">
                      {hw?.gpuRenderer || "WebGL2 Client Engine"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#0B0C0F] border border-white/[0.08] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Isolated Client Web Worker Console ($0.00 Cost)</span>
                    <button
                      type="button"
                      onClick={() => setWorkerLogs([])}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-[11px] text-zinc-200 select-text">
                    {workerLogs.map((line, i) => (
                      <div key={i} className="leading-relaxed whitespace-pre-wrap">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
