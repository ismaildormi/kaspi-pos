"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FlaskConical,
  Play,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type {
  BenchmarkCategoryId,
  BenchmarkSuiteRun,
} from "@/lib/heyuka/ecosystem/benchmark-engine";

const ALL_CATEGORIES: Array<{
  id: BenchmarkCategoryId;
  label: string;
  desc: string;
}> = [
  { id: "reasoning_multilingual", label: "Multilingual Chat / Darija & AR", desc: "Real text router & VAT prompt check" },
  { id: "image_studio", label: "Studio Image Diffusion", desc: "Fetches real binary image bytes & SHA-256" },
  { id: "code_sandbox", label: "Code Sandbox (Python)", desc: "Executes real Python assertion in sandbox" },
  { id: "public_data", label: "Live FX & Market Feed", desc: "Verifies zero-key public API payload" },
  { id: "three_d_assets", label: "3D PolyHaven + GLB Worker Check", desc: "Real 3D catalog + Worker honest status" },
  { id: "audio_stem_check", label: "Audio Stem Worker Check", desc: "Verifies Demucs Worker availability cleanly" },
  { id: "video_worker_check", label: "FFmpeg Video Worker Check", desc: "Verifies FFmpeg Worker presence cleanly" },
];

export function PlatformLabView() {
  const [selected, setSelected] = useState<BenchmarkCategoryId[]>(
    ALL_CATEGORIES.map((c) => c.id)
  );
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [runs, setRuns] = useState<BenchmarkSuiteRun[]>([]);
  const [activeRun, setActiveRun] = useState<BenchmarkSuiteRun | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadRuns = async () => {
    try {
      const r = await fetch("/api/v1/heyuka/lab", { cache: "no-store" });
      if (!r.ok) return;
      const json = await r.json();
      if (Array.isArray(json.runs)) {
        setRuns(json.runs);
        if (!activeRun && json.runs[0]) setActiveRun(json.runs[0]);
      }
    } catch {}
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  const toggleCat = (id: BenchmarkCategoryId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const startSuite = async () => {
    if (selected.length === 0) return;
    setRunning(true);
    setErr(null);
    try {
      const res = await fetch("/api/v1/heyuka/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: selected }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error?.message || "Sign in required to run benchmarks.");
        return;
      }
      setActiveRun(json.run);
      await loadRuns();
    } catch (e: any) {
      setErr(e?.message || "Benchmark run failed");
    } finally {
      setRunning(false);
    }
  };

  const exportFullZip = async () => {
    if (!activeRun) return;
    setExporting(true);
    try {
      const res = await fetch("/api/v1/heyuka/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export_zip", runId: activeRun.runId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error?.message || "ZIP export failed");
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `HEYUKA_FULL_BENCHMARK_${activeRun.runId}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    } finally {
      setExporting(false);
    }
  };

  const rateTest = async (testId: string, adherence: number, quality: number) => {
    if (!activeRun) return;
    const res = await fetch("/api/v1/heyuka/lab", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: activeRun.runId,
        testId,
        promptAdherence: adherence,
        visualOrTechnicalQuality: quality,
        notes: "Reviewed manually inside Testing Lab",
      }),
    });
    const json = await res.json();
    if (json?.run) setActiveRun(json.run);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-[#161618] border border-white/[0.08] p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-rose-500">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Autonomous Real Benchmark Engine • $0.00 Owner Cost Shield</span>
          </div>
          <span className="text-xs font-mono text-rose-500 font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Zero Fake Scores / Zero Stub Files
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black">
          HEYUKA Autonomous API &amp; Media Testing Laboratory
        </h1>
        <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl leading-relaxed">
          Runs live requests against your authorized zero-cost tiers or connected Worker nodes, records SHA-256 &amp; latency telemetry, cleanly isolates `worker_required` gaps without faking binaries, and exports real `.xlsx` + `MANIFEST.json` archives.
        </p>

        {/* Category Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {ALL_CATEGORIES.map((cat) => {
            const on = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCat(cat.id)}
                className={`p-3 rounded-2xl text-start transition-all cursor-pointer space-y-1 ${
                  on ? "kaspi-orbit-active" : "kaspi-frosted-surface opacity-70"
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{cat.label}</span>
                  <span className="font-mono text-[10px] text-rose-500">{on ? "ON" : "OFF"}</span>
                </div>
                <div className="text-[11px] text-[var(--kaspi-text-muted)]">{cat.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            disabled={running || selected.length === 0}
            onClick={() => void startSuite()}
            className="kaspi-primary-cta-btn rounded-2xl px-5 py-3 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{running ? "Executing Live Tests..." : "Run Real Benchmark Suite"}</span>
          </button>

          {activeRun && (
            <button
              type="button"
              disabled={exporting}
              onClick={() => void exportFullZip()}
              className="kaspi-glass-btn rounded-2xl px-5 py-3 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-rose-500" />
              <span>{exporting ? "Building ZIP + XLSX..." : "Download HEYUKA_FULL_BENCHMARK.zip"}</span>
            </button>
          )}
        </div>

        {err && <div className="text-xs text-rose-500 font-semibold">{err}</div>}
      </section>

      {activeRun && (
        <section className="space-y-4">
          {/* Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="kaspi-glass-card rounded-2xl p-3.5">
              <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Run ID</div>
              <div dir="ltr" className="text-xs font-mono font-bold truncate">{activeRun.runId}</div>
            </div>
            <div className="kaspi-glass-card rounded-2xl p-3.5">
              <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Passed</div>
              <div className="text-xl font-black text-rose-500 font-mono">{activeRun.passedCount}</div>
            </div>
            <div className="kaspi-glass-card rounded-2xl p-3.5">
              <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Partial (No Binary)</div>
              <div className="text-xl font-black text-amber-500 font-mono">{activeRun.partialCount}</div>
            </div>
            <div className="kaspi-glass-card rounded-2xl p-3.5">
              <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Worker Required</div>
              <div className="text-xl font-black text-amber-500 font-mono">{activeRun.workerRequiredCount}</div>
            </div>
            <div className="kaspi-glass-card rounded-2xl p-3.5">
              <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Owner Cost Exposure</div>
              <div className="text-xl font-black text-rose-500 font-mono">$0.00</div>
            </div>
          </div>

          {/* Individual Test Cases */}
          <div className="space-y-3">
            {activeRun.tests.map((test) => (
              <div key={test.testId} className="kaspi-glass-card rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {test.status === "passed" ? (
                      <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                    ) : test.status === "failed" ? (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-black">{test.category}</div>
                      <div dir="ltr" className="text-[11px] font-mono text-[var(--kaspi-text-muted)]">
                        {test.endpoint} • {test.model} • {test.executionEnvironment}
                      </div>
                    </div>
                  </div>

                  <div dir="ltr" className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="px-2.5 py-0.5 rounded-full kaspi-frosted-surface font-bold">
                      {test.status.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full kaspi-frosted-surface">
                      HTTP {test.httpStatus}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full kaspi-frosted-surface">
                      {test.durationMs}ms
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full kaspi-frosted-surface">
                      {test.byteSize} B
                    </span>
                  </div>
                </div>

                {test.outputUrlOrPreview && (
                  <div className="kaspi-frosted-surface rounded-2xl p-3 text-xs whitespace-pre-wrap break-words">
                    {test.outputUrlOrPreview}
                  </div>
                )}

                {test.errorDetail && (
                  <div className="kaspi-frosted-surface rounded-2xl p-3 text-xs text-amber-500 font-semibold">
                    {test.errorDetail}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-[var(--kaspi-border)]">
                  <span dir="ltr" className="font-mono text-[var(--kaspi-text-muted)] truncate max-w-md">
                    SHA-256: {test.sha256 || "n/a"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--kaspi-text-muted)]">
                      Human Review ({test.humanReviewScores.promptAdherence ?? "Unrated"}/5):
                    </span>
                    {[3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => void rateTest(test.testId, score, score)}
                        className={`px-2 py-0.5 rounded-lg font-mono font-bold cursor-pointer ${
                          test.humanReviewScores.promptAdherence === score
                            ? "kaspi-orbit-active text-rose-500"
                            : "kaspi-glass-surface"
                        }`}
                      >
                        {score}/5
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {runs.length > 1 && (
        <section className="kaspi-glass-card rounded-3xl p-5 space-y-2">
          <div className="text-xs font-bold text-[var(--kaspi-text-muted)]">Recent Benchmark History</div>
          <div className="flex flex-wrap gap-2">
            {runs.map((r) => (
              <button
                key={r.runId}
                type="button"
                onClick={() => setActiveRun(r)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer ${
                  activeRun?.runId === r.runId ? "kaspi-orbit-active text-rose-500" : "kaspi-frosted-surface"
                }`}
              >
                {r.runId} ({r.passedCount} passed)
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
