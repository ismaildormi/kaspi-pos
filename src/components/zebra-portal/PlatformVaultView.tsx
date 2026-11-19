"use client";

import React, { useEffect, useState } from "react";
import { Archive, CheckCircle2, Download, RefreshCw, ShieldCheck, Trash2, XCircle } from "lucide-react";
import type { OutputTruthClass, VaultOutputRecord } from "@/lib/heyuka/ecosystem/output-vault";

export function PlatformVaultView() {
  const [outputs, setOutputs] = useState<VaultOutputRecord[]>([]);
  const [filterClass, setFilterClass] = useState<"all" | OutputTruthClass>("all");
  const [busy, setBusy] = useState(false);

  const loadOutputs = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/v1/heyuka/outputs", { cache: "no-store" });
      if (!r.ok) return;
      const json = await r.json();
      setOutputs(Array.isArray(json.outputs) ? json.outputs : []);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadOutputs();
  }, []);

  const filtered =
    filterClass === "all"
      ? outputs
      : outputs.filter((o) => o.truthClass === filterClass);

  return (
    <div className="space-y-6">
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-rose-500">
            <Archive className="w-3.5 h-3.5" />
            <span>HEYUKA REAL OUTPUT VAULT • Verified Provenance</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadOutputs()}
              className="kaspi-glass-btn rounded-xl px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <a
              href="/api/v1/heyuka/outputs?downloadZip=1"
              className="kaspi-primary-cta-btn rounded-xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Vault (.zip)</span>
            </a>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black">
          Centralized Verified Outputs &amp; Execution Provenance
        </h1>
        <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl leading-relaxed">
          Strictly distinguishes real verified studio/lab outputs (`real_output`) from scripts/previews (`preview`), illustrative examples (`example`), and failed executions (`failed`) — complete with SHA-256 digests and actual engine metadata.
        </p>

        <div className="flex flex-wrap gap-2">
          {(["all", "real_output", "preview", "failed", "example"] as const).map((cls) => (
            <button
              key={cls}
              type="button"
              onClick={() => setFilterClass(cls)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                filterClass === cls ? "kaspi-orbit-active text-rose-500" : "kaspi-glass-surface"
              }`}
            >
              {cls.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="kaspi-glass-card rounded-3xl p-10 text-center space-y-2 text-xs text-[var(--kaspi-text-muted)]">
          <Archive className="w-6 h-6 mx-auto opacity-60" />
          <p>No outputs logged yet for this filter. Run any Studio tool or the Testing Lab to record real verified outputs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="kaspi-glass-card rounded-3xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold kaspi-frosted-surface ${
                        item.truthClass === "real_output"
                          ? "text-rose-500"
                          : item.truthClass === "failed"
                          ? "text-rose-500"
                          : "text-amber-500"
                      }`}
                    >
                      {item.truthClass.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono kaspi-glass-surface">
                      {item.productId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono kaspi-glass-surface">
                      .{item.format}
                    </span>
                  </div>
                  <h2 className="text-sm font-black truncate">{item.taskName}</h2>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/v1/heyuka/outputs?id=${encodeURIComponent(item.id)}`, {
                      method: "DELETE",
                    });
                    await loadOutputs();
                  }}
                  className="kaspi-glass-btn rounded-xl p-1.5 text-rose-500 cursor-pointer shrink-0"
                  aria-label="Delete artifact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] kaspi-frosted-surface rounded-2xl p-3">
                <div>
                  <span className="text-[var(--kaspi-text-muted)]">Model: </span>
                  <span className="font-mono font-semibold">{item.actualModel}</span>
                </div>
                <div>
                  <span className="text-[var(--kaspi-text-muted)]">Engine: </span>
                  <span className="font-semibold">{item.actualEngine}</span>
                </div>
                <div>
                  <span className="text-[var(--kaspi-text-muted)]">Duration: </span>
                  <span className="font-mono">{item.durationMs} ms</span>
                </div>
                <div>
                  <span className="text-[var(--kaspi-text-muted)]">Size: </span>
                  <span className="font-mono">
                    {item.byteSize} B {item.dimensions ? `(${item.dimensions})` : ""}
                  </span>
                </div>
              </div>

              {item.inlineTextPreview && (
                <pre
                  dir="ltr"
                  className="kaspi-frosted-surface rounded-2xl p-3 font-mono text-[11px] max-h-36 overflow-auto whitespace-pre-wrap"
                >
                  {item.inlineTextPreview}
                </pre>
              )}

              {item.accessUrl && (
                <a
                  href={item.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kaspi-glass-btn rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-rose-500" />
                  <span>Open Artifact URL</span>
                </a>
              )}

              {item.errorLog && (
                <div className="text-xs text-rose-500 font-semibold flex items-start gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{item.errorLog}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--kaspi-text-muted)] pt-1 border-t border-[var(--kaspi-border)]">
                <span className="inline-flex items-center gap-1">
                  {item.verified ? (
                    <CheckCircle2 className="w-3 h-3 text-rose-500" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 text-amber-500" />
                  )}
                  <span dir="ltr" className="font-mono">SHA-256: {item.sha256.slice(0, 18)}...</span>
                </span>
                <span>{new Date(item.executedAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
