"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { diffLines } from "diff";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Code2,
  Download,
  FileCode2,
  GitCompare,
  Image as ImageIcon,
  Play,
  Plus,
  Scissors,
  ShieldAlert,
  Sparkles,
  Terminal,
} from "lucide-react";
import { removeImageBackgroundLocal } from "@/lib/zebra-x/media-client";
import {
  HEYUKA_CHARACTER_PROFILES,
  HEYUKA_LIGHTING_PRESETS,
} from "@/lib/heyuka/heyuka-universe";
import { buildBinarySafeZipArchive } from "@/lib/heyuka/pkzip";

const HEYUKACreatureCanvas = dynamic(
  () => import("@/components/heyuka/HEYUKACreatureCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[260px] rounded-2xl kaspi-frosted-surface flex items-center justify-center text-xs font-mono text-[var(--kaspi-text-muted)]">
        Loading WebGL2 3D Stage...
      </div>
    ),
  }
);

export async function logArtifactToVault(payload: {
  taskName: string;
  productId: string;
  actualModel: string;
  actualEngine: string;
  status: "completed" | "partial" | "failed" | "worker_required";
  truthClass: "real_output" | "preview" | "example" | "failed" | "in_progress";
  durationMs: number;
  format: string;
  byteSize?: number;
  dimensions?: string;
  accessUrl?: string;
  inlineTextPreview?: string;
  errorLog?: string;
}) {
  try {
    await fetch("/api/v1/heyuka/outputs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}
}

export function CodingStudioWorkbench({
  onContextChange,
}: {
  onContextChange?: (ctx: string) => void;
}) {
  const [files, setFiles] = useState<Record<string, string>>({
    "app.py": `def calculate_ttc(amount: float, tax_rate: float = 0.20) -> float:\n    return round(amount * (1 + tax_rate), 2)\n\nif __name__ == "__main__":\n    print("1500 + 20% VAT =", calculate_ttc(1500))\n`,
    "test_app.py": `from app import calculate_ttc\n\nassert calculate_ttc(100, 0.2) == 120.0\nassert calculate_ttc(1500, 0.2) == 1800.0\nprint("ALL_TESTS_PASSED")\n`,
    "README.md": `# HEYUKA Coding Project\nIsolated sandbox project files. Only runs when explicitly executed.`,
  });
  const [originalFiles] = useState<Record<string, string>>({ ...files });
  const [activeFile, setActiveFile] = useState("app.py");
  const [newFileName, setNewFileName] = useState("");
  const [language, setLanguage] = useState<"python" | "javascript" | "typescript" | "bash" | "go">("python");
  const [approvalChecked, setApprovalChecked] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [running, setRunning] = useState(false);
  const [timeline, setTimeline] = useState<
    Array<{ step: string; status: "ok" | "fail" | "info"; detail: string; ts: string }>
  >([]);
  const [terminalOut, setTerminalOut] = useState("");

  const activeContent = files[activeFile] || "";

  const updateFile = (val: string) => {
    const next = { ...files, [activeFile]: val };
    setFiles(next);
    onContextChange?.(
      `Open file ${activeFile} (${language}):\n${val.slice(0, 2200)}`
    );
  };

  const diffChunks = useMemo(() => {
    const before = originalFiles[activeFile] || "";
    const after = files[activeFile] || "";
    return diffLines(before, after);
  }, [originalFiles, files, activeFile]);

  const addFile = () => {
    const clean = newFileName.trim().replace(/[^a-zA-Z0-9._-]/g, "");
    if (!clean || files[clean]) return;
    setFiles((prev) => ({ ...prev, [clean]: "" }));
    setActiveFile(clean);
    setNewFileName("");
  };

  const runSandbox = async (mode: "active" | "test_suite") => {
    if (!approvalChecked) return;
    setRunning(true);
    const t0 = performance.now();
    const ts = new Date().toLocaleTimeString();
    const combinedCode =
      mode === "test_suite" && language === "python"
        ? `${files["app.py"] || ""}\n\n# --- Test Suite ---\n${(files["test_app.py"] || "").replace(/from app import.*\n?/g, "")}`
        : activeContent;

    setTimeline((prev) => [
      { step: `Prepare ${mode} (${language})`, status: "info", detail: `File: ${activeFile}`, ts },
      ...prev.slice(0, 8),
    ]);

    try {
      const res = await fetch("/api/v1/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: combinedCode }),
      });
      const json = await res.json();
      const durationMs = Math.round(performance.now() - t0);
      const passed = Boolean(res.ok && json.ok && json.exitCode === 0);
      setTerminalOut(
        `[HTTP ${res.status} • ${json.engine || "Sandbox"} • exitCode=${json.exitCode} • ${durationMs}ms]\n--- STDOUT ---\n${json.stdout || "(empty)"}\n${json.stderr ? `--- STDERR ---\n${json.stderr}` : ""}`
      );
      setTimeline((prev) => [
        {
          step: passed ? `Verified ${mode} Passed` : `Execution Error (${json.exitCode})`,
          status: passed ? "ok" : "fail",
          detail: String(json.stdout || json.stderr || json.error || "").slice(0, 120),
          ts: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 8),
      ]);
      await logArtifactToVault({
        taskName: `Coding Studio: ${activeFile} (${mode})`,
        productId: "coding-studio",
        actualModel: "heyuka-core",
        actualEngine: String(json.engine || "HEYUKA Sandbox"),
        status: passed ? "completed" : "failed",
        truthClass: passed ? "real_output" : "failed",
        durationMs,
        format: language,
        inlineTextPreview: json.stdout || json.stderr || combinedCode,
        errorLog: passed ? undefined : json.stderr || json.error,
      });
    } catch (err: any) {
      setTerminalOut(`Network error: ${err?.message || "Failed"}`);
    } finally {
      setRunning(false);
    }
  };

  const downloadProjectZip = () => {
    const zipBytes = buildBinarySafeZipArchive(
      Object.entries(files).map(([path, data]) => ({ path, data }))
    );
    const blob = new Blob([new Uint8Array(zipBytes)], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "heyuka-coding-project.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="kaspi-glass-card rounded-3xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-black text-[var(--kaspi-text-primary)]">
            <FileCode2 className="w-4 h-4 text-rose-500" />
            <span>Multi-File Code IDE &amp; Isolated Sandbox</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["python", "javascript", "typescript", "bash", "go"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold cursor-pointer ${
                  language === l
                    ? "kaspi-orbit-active text-rose-500"
                    : "kaspi-glass-surface text-[var(--kaspi-text-muted)]"
                }`}
              >
                {l}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowDiff((d) => !d)}
              className="kaspi-glass-btn rounded-xl px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <GitCompare className="w-3.5 h-3.5 text-rose-500" />
              <span>{showDiff ? "Code Editor" : "Inspect Diff"}</span>
            </button>
            <button
              type="button"
              onClick={downloadProjectZip}
              className="kaspi-glass-btn rounded-xl px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ZIP</span>
            </button>
          </div>
        </div>

        {/* Explorer + Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-3 kaspi-frosted-surface rounded-2xl p-3 space-y-2">
            <div className="text-[11px] font-bold text-[var(--kaspi-text-muted)]">Project Files</div>
            <div className="space-y-1">
              {Object.keys(files).map((fname) => (
                <button
                  key={fname}
                  type="button"
                  onClick={() => setActiveFile(fname)}
                  className={`w-full text-start px-3 py-1.5 rounded-xl font-mono text-xs truncate cursor-pointer ${
                    activeFile === fname
                      ? "kaspi-orbit-active text-rose-500 font-bold"
                      : "hover:bg-[var(--kaspi-surface-hover)] text-[var(--kaspi-text-secondary)]"
                  }`}
                >
                  {fname}
                </button>
              ))}
            </div>
            <div className="flex gap-1 pt-2 border-t border-[var(--kaspi-border)]">
              <input
                dir="ltr"
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="new_file.py"
                className="flex-1 min-w-0 rounded-xl kaspi-glass-surface px-2.5 py-1 text-[11px] font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={addFile}
                className="kaspi-glass-btn rounded-xl px-2 py-1 cursor-pointer"
                aria-label="Add File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-3">
            {showDiff ? (
              <div
                dir="ltr"
                className="kaspi-frosted-surface rounded-2xl p-4 font-mono text-xs min-h-[220px] max-h-[300px] overflow-auto whitespace-pre-wrap"
              >
                {diffChunks.map((part, i) => (
                  <span
                    key={i}
                    className={
                      part.added
                        ? "block bg-rose-500/20 text-rose-400"
                        : part.removed
                        ? "block bg-rose-500/20 text-rose-400 line-through"
                        : "block text-[var(--kaspi-text-secondary)]"
                    }
                  >
                    {part.added ? "+ " : part.removed ? "- " : "  "}
                    {part.value}
                  </span>
                ))}
              </div>
            ) : (
              <textarea
                dir="ltr"
                value={activeContent}
                onChange={(e) => updateFile(e.target.value)}
                rows={11}
                className="w-full rounded-2xl kaspi-frosted-surface p-4 font-mono text-xs text-[var(--kaspi-text-primary)] focus:outline-none resize-y"
              />
            )}

            {/* Approval Gate + Run Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 kaspi-frosted-surface rounded-2xl p-3">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalChecked}
                  onChange={(e) => setApprovalChecked(e.target.checked)}
                  className="accent-rose-500"
                />
                <span>Approve isolated sandbox run (Zero host filesystem access)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={running || !approvalChecked}
                  onClick={() => void runSandbox("active")}
                  className="kaspi-primary-cta-btn rounded-xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{running ? "Running..." : "Run Active File"}</span>
                </button>
                <button
                  type="button"
                  disabled={running || !approvalChecked}
                  onClick={() => void runSandbox("test_suite")}
                  className="kaspi-glass-btn rounded-xl px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Run Tests</span>
                </button>
              </div>
            </div>

            {terminalOut && (
              <pre
                dir="ltr"
                className="rounded-2xl kaspi-frosted-surface p-3.5 font-mono text-xs text-[var(--kaspi-text-primary)] overflow-x-auto max-h-48 whitespace-pre-wrap"
              >
                {terminalOut}
              </pre>
            )}
          </div>
        </div>

        {/* Execution Timeline */}
        {timeline.length > 0 && (
          <div className="kaspi-frosted-surface rounded-2xl p-3 space-y-1.5">
            <div className="text-[11px] font-bold text-[var(--kaspi-text-muted)] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Real Execution Timeline</span>
            </div>
            <div className="space-y-1">
              {timeline.map((item, idx) => (
                <div key={idx} className="text-[11px] flex items-center justify-between gap-2">
                  <span
                    className={
                      item.status === "ok"
                        ? "text-rose-500 font-bold"
                        : item.status === "fail"
                        ? "text-rose-500 font-bold"
                        : "text-[var(--kaspi-text-secondary)]"
                    }
                  >
                    • {item.step} {item.detail ? `— ${item.detail}` : ""}
                  </span>
                  <span dir="ltr" className="font-mono text-[10px] text-[var(--kaspi-text-muted)]">
                    {item.ts}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BackgroundStudioWorkbench() {
  const [origUrl, setOrigUrl] = useState<string>("");
  const [cutoutUrl, setCutoutUrl] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [dims, setDims] = useState<string>("");
  const [bgSwatch, setBgSwatch] = useState<string>("transparent");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    const localObj = URL.createObjectURL(file);
    setOrigUrl(localObj);
    const t0 = performance.now();
    try {
      const res = await removeImageBackgroundLocal(file);
      setCutoutUrl(res.dataUrl);
      setMethod(res.method);
      setDims(`${res.width}x${res.height}`);
      await logArtifactToVault({
        taskName: `Background Cutout PNG: ${file.name}`,
        productId: "background-studio",
        actualModel: "on-device-onnx",
        actualEngine: res.method === "imgly_onnx" ? "@imgly/background-removal" : "Canvas Border Alpha",
        status: "completed",
        truthClass: "real_output",
        durationMs: Math.round(performance.now() - t0),
        format: "png",
        byteSize: res.dataUrl.length,
        dimensions: `${res.width}x${res.height}`,
      });
    } catch (error: any) {
      setErr(error?.message || "Failed cutting out image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kaspi-glass-card rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[var(--kaspi-text-primary)] flex items-center gap-2">
            <Scissors className="w-4 h-4 text-rose-500" />
            <span>Zero-Cost Local Background Removal Studio</span>
          </h3>
          <p className="text-xs text-[var(--kaspi-text-muted)]">
            Runs directly on your browser WebGPU / ONNX runtime ($0.00 server cost).
          </p>
        </div>

        <label className="kaspi-primary-cta-btn rounded-2xl px-4 py-2 text-xs font-bold cursor-pointer">
          <span>{busy ? "Processing Cutout..." : "Upload Image"}</span>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[var(--kaspi-text-muted)] font-semibold">Backdrop Preview:</span>
        {[
          { id: "transparent", label: "Checker / Transparent" },
          { id: "#ffffff", label: "Studio White" },
          { id: "#0f172a", label: "Midnight Slate" },
          { id: "#e11d48", label: "Emerald" },
        ].map((sw) => (
          <button
            key={sw.id}
            type="button"
            onClick={() => setBgSwatch(sw.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
              bgSwatch === sw.id ? "kaspi-orbit-active text-rose-500" : "kaspi-glass-surface"
            }`}
          >
            {sw.label}
          </button>
        ))}
      </div>

      {err && <div className="text-xs text-rose-500">{err}</div>}

      {(origUrl || cutoutUrl) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="kaspi-frosted-surface rounded-2xl p-3 space-y-2">
            <div className="text-[11px] font-bold text-[var(--kaspi-text-muted)]">Original Input</div>
            {origUrl && (
              <img src={origUrl} alt="Original" className="w-full h-56 object-contain rounded-xl" />
            )}
          </div>
          <div className="kaspi-frosted-surface rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-rose-500">
                Real Cutout Output ({method} • {dims})
              </span>
              {cutoutUrl && (
                <a
                  href={cutoutUrl}
                  download="heyuka-cutout.png"
                  className="kaspi-glass-btn rounded-lg px-2.5 py-1 text-[10px] font-bold inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> PNG
                </a>
              )}
            </div>
            {cutoutUrl && (
              <div
                className="w-full h-56 rounded-xl flex items-center justify-center overflow-hidden border border-[var(--kaspi-border)]"
                style={{
                  backgroundColor: bgSwatch === "transparent" ? undefined : bgSwatch,
                  backgroundImage:
                    bgSwatch === "transparent"
                      ? "linear-gradient(45deg, rgba(148,163,184,0.2) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.2) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.2) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.2) 75%)"
                      : undefined,
                  backgroundSize: "16px 16px",
                }}
              >
                <img src={cutoutUrl} alt="Cutout Result" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ImageStudioWorkbench() {
  const [prompt, setPrompt] = useState("minimalist frosted emerald perfume bottle on stone studio table");
  const [mode, setMode] = useState<"generate" | "web_images">("generate");
  const [busy, setBusy] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");
  const [webResults, setWebResults] = useState<Array<{ title: string; thumbUrl: string; imageUrl: string }>>([]);
  const [filterBrightness, setFilterBrightness] = useState(100);
  const [filterContrast, setFilterContrast] = useState(100);
  const [err, setErr] = useState<string | null>(null);

  const runImage = async () => {
    setBusy(true);
    setErr(null);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/v1/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, action: mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error?.message || "Image studio request failed");
        return;
      }
      if (mode === "web_images") {
        setWebResults(Array.isArray(json.results) ? json.results : []);
      } else {
        setGeneratedUrl(json.imageUrl || "");
        setProxyUrl(json.proxyUrl || "");
        await logArtifactToVault({
          taskName: `Image Studio: ${prompt.slice(0, 60)}`,
          productId: "image-studio",
          actualModel: "heyuka-vision",
          actualEngine: "Zero-Key Diffusion URL",
          status: "completed",
          truthClass: "real_output",
          durationMs: Math.round(performance.now() - t0),
          format: "jpg",
          dimensions: "512x512",
          accessUrl: json.imageUrl,
        });
      }
    } catch (e: any) {
      setErr(e?.message || "Request error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kaspi-glass-card rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-black">
          <ImageIcon className="w-4 h-4 text-rose-500" />
          <span>HEYUKA Image Synthesis &amp; Canvas Enhancer</span>
        </div>
        <div className="flex gap-1.5">
          {(["generate", "web_images"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                mode === m ? "kaspi-orbit-active text-rose-500" : "kaspi-glass-surface"
              }`}
            >
              {m === "generate" ? "AI Diffusion" : "Wikimedia Search"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 rounded-2xl kaspi-glass-surface px-4 py-2.5 text-xs focus:outline-none"
        />
        <button
          type="button"
          disabled={busy || !prompt.trim()}
          onClick={() => void runImage()}
          className="kaspi-primary-cta-btn rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer"
        >
          {busy ? "Generating..." : mode === "generate" ? "Generate Visual" : "Search Commons"}
        </button>
      </div>

      {err && <div className="text-xs text-rose-500">{err}</div>}

      {proxyUrl && mode === "generate" && (
        <div className="kaspi-frosted-surface rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="space-y-1">
              <span>Brightness: {filterBrightness}%</span>
              <input
                type="range"
                min={50}
                max={150}
                value={filterBrightness}
                onChange={(e) => setFilterBrightness(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </label>
            <label className="space-y-1">
              <span>Contrast: {filterContrast}%</span>
              <input
                type="range"
                min={50}
                max={150}
                value={filterContrast}
                onChange={(e) => setFilterContrast(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </label>
          </div>
          <img
            src={proxyUrl}
            alt={prompt}
            style={{ filter: `brightness(${filterBrightness}%) contrast(${filterContrast}%)` }}
            className="w-full max-h-80 object-contain rounded-2xl"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--kaspi-text-muted)]">
            <span className="font-mono truncate max-w-md">{generatedUrl}</span>
            <a
              href={proxyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="kaspi-glass-btn rounded-xl px-3 py-1 font-bold"
            >
              Open Full Image
            </a>
          </div>
        </div>
      )}

      {webResults.length > 0 && mode === "web_images" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {webResults.map((w, i) => (
            <a
              key={i}
              href={w.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="kaspi-frosted-surface rounded-2xl p-2 space-y-1.5 hover:scale-[1.01] transition-transform"
            >
              <img src={w.thumbUrl} alt={w.title} className="w-full h-32 object-cover rounded-xl" />
              <div className="text-[11px] truncate font-medium">{w.title}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreeDStudioWorkbench() {
  const [query, setQuery] = useState("chair");
  const [assetType, setAssetType] = useState<"models" | "textures" | "hdris">("models");
  const [assets, setAssets] = useState<any[]>([]);
  const [bpyScript, setBpyScript] = useState("");
  const [workerMsg, setWorkerMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const searchCatalog = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/v1/3d/assets?q=${encodeURIComponent(query)}&type=${assetType}&limit=6`);
      const json = await r.json();
      setAssets(Array.isArray(json.assets) ? json.assets : []);
    } finally {
      setBusy(false);
    }
  };

  const generateBpyOrMesh = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/3d/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, format: "glb" }),
      });
      const json = await res.json();
      setBpyScript(json.blenderBpyStarter || "");
      setWorkerMsg(
        json.executedServerSide
          ? "Binary 3D Mesh executed cleanly by GPU Worker."
          : "No GPU 3D Worker connected — real PolyHaven matches & Blender Python (`bpy`) script provided honestly below."
      );
      await logArtifactToVault({
        taskName: `3D Studio: ${query} (.glb workflow)`,
        productId: "3d-studio",
        actualModel: "heyuka-vision",
        actualEngine: json.engine || "PolyHaven + Blender bpy",
        status: json.executedServerSide ? "completed" : "partial",
        truthClass: json.executedServerSide ? "real_output" : "preview",
        durationMs: 250,
        format: json.executedServerSide ? "glb" : "py",
        inlineTextPreview: json.blenderBpyStarter || JSON.stringify(json),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 kaspi-glass-card rounded-3xl p-4 space-y-2">
          <div className="text-xs font-bold flex items-center justify-between">
            <span>Interactive WebGL2 3D Preview</span>
            <span className="text-rose-500 font-mono">Three.js 0.169</span>
          </div>
          <HEYUKACreatureCanvas
            character={HEYUKA_CHARACTER_PROFILES[0]}
            lighting={HEYUKA_LIGHTING_PRESETS[0]}
            compact
          />
        </div>

        <div className="lg:col-span-7 kaspi-glass-card rounded-3xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-black">
              <Box className="w-4 h-4 text-rose-500" />
              <span>PolyHaven Live 3D Hub &amp; Blender Pipeline</span>
            </div>
            <div className="flex gap-1.5">
              {(["models", "textures", "hdris"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAssetType(t)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                    assetType === t ? "kaspi-orbit-active text-rose-500" : "kaspi-glass-surface"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-2xl kaspi-glass-surface px-3.5 py-2 text-xs focus:outline-none"
              placeholder="chair, wood, marble, studio..."
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void searchCatalog()}
              className="kaspi-glass-btn rounded-2xl px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Search PolyHaven
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void generateBpyOrMesh()}
              className="kaspi-primary-cta-btn rounded-2xl px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Generate bpy / Worker Mesh
            </button>
          </div>

          {workerMsg && (
            <div className="kaspi-frosted-surface rounded-xl p-2.5 text-xs flex items-start gap-2 text-amber-500 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{workerMsg}</span>
            </div>
          )}

          {assets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {assets.map((a, idx) => (
                <div key={idx} className="kaspi-frosted-surface rounded-xl p-2.5 text-xs space-y-1">
                  <div className="font-bold truncate">{a.name || a.id}</div>
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-rose-500 hover:underline font-mono"
                    >
                      Open Asset
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {bpyScript && (
            <pre
              dir="ltr"
              className="kaspi-frosted-surface rounded-2xl p-3 font-mono text-[11px] overflow-x-auto"
            >
              {bpyScript}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
