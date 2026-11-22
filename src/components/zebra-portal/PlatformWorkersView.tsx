"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  HardDrive,
  KeyRound,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { DistributedWorkerRecord, WorkerOsTarget } from "@/lib/heyuka/compute/workers-registry";
import type { ByokProviderKind, TenantByokConfig } from "@/lib/heyuka/compute/zero-cost-policy";

interface BrowserTelemetry {
  webGpuSupported: boolean;
  webGpuAdapterName: string;
  wasmSupported: boolean;
  cpuCores: number | null;
  deviceMemoryGb: number | null;
  storageQuotaMb: number | null;
  platform: string;
}

export function PlatformWorkersView() {
  const [browserHw, setBrowserHw] = useState<BrowserTelemetry | null>(null);
  const [workers, setWorkers] = useState<DistributedWorkerRecord[]>([]);
  const [byoks, setByoks] = useState<TenantByokConfig[]>([]);
  const [budget, setBudget] = useState<{ day: string; count: number; limit: number } | null>(null);

  // Worker Form
  const [wName, setWName] = useState("");
  const [wOs, setWOs] = useState<WorkerOsTarget>("linux");
  const [wUrl, setWUrl] = useState("");
  const [wToken, setWToken] = useState("");
  const [wConsent, setWConsent] = useState(false);
  const [wCaps, setWCaps] = useState("ffmpeg_video,3d_generate,audio_separate,vision_remove_bg");
  const [wErr, setWErr] = useState<string | null>(null);
  const [wBusy, setWBusy] = useState(false);

  // BYOK Form
  const [bKind, setBKind] = useState<ByokProviderKind>("groq");
  const [bLabel, setBLabel] = useState("");
  const [bKey, setBKey] = useState("");
  const [bModel, setBModel] = useState("openai/gpt-oss-120b");
  const [bBase, setBBase] = useState("");
  const [bErr, setBErr] = useState<string | null>(null);

  const probeBrowser = async () => {
    if (typeof window === "undefined") return;
    const nav = navigator as any;
    let webGpuSupported = false;
    let webGpuAdapterName = "Not available in this browser";
    if (nav.gpu) {
      try {
        const adapter = await nav.gpu.requestAdapter();
        if (adapter) {
          webGpuSupported = true;
          const info = adapter.info || (await adapter.requestAdapterInfo?.()) || {};
          webGpuAdapterName =
            [info.vendor, info.architecture, info.description].filter(Boolean).join(" ") ||
            "WebGPU Hardware Adapter Ready";
        }
      } catch {}
    }

    let storageQuotaMb: number | null = null;
    if (nav.storage?.estimate) {
      try {
        const est = await nav.storage.estimate();
        if (typeof est.quota === "number") {
          storageQuotaMb = Math.round(est.quota / (1024 * 1024));
        }
      } catch {}
    }

    setBrowserHw({
      webGpuSupported,
      webGpuAdapterName,
      wasmSupported: typeof WebAssembly === "object",
      cpuCores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
      deviceMemoryGb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
      storageQuotaMb,
      platform: nav.userAgentData?.platform || nav.platform || "Unknown Browser OS",
    });
  };

  const loadServerState = async () => {
    try {
      const [wRes, bRes] = await Promise.all([
        fetch("/api/v1/heyuka/workers", { cache: "no-store" }),
        fetch("/api/v1/heyuka/byok", { cache: "no-store" }),
      ]);
      if (wRes.ok) {
        const wj = await wRes.json();
        setWorkers(Array.isArray(wj.workers) ? wj.workers : []);
      }
      if (bRes.ok) {
        const bj = await bRes.json();
        setByoks(Array.isArray(bj.providers) ? bj.providers : []);
        if (bj.dailyBudget) setBudget(bj.dailyBudget);
      }
    } catch {}
  };

  useEffect(() => {
    void probeBrowser();
    void loadServerState();
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setWErr(null);
    if (!wConsent) {
      setWErr("Explicit opt-in authorization is mandatory before registering any compute worker.");
      return;
    }
    setWBusy(true);
    try {
      const res = await fetch("/api/v1/heyuka/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: wName,
          osTarget: wOs,
          endpointUrl: wUrl,
          workerToken: wToken || undefined,
          explicitConsentAccepted: true,
          capabilities: wCaps
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setWErr(json?.error?.message || "Worker registration failed");
        return;
      }
      setWName("");
      setWUrl("");
      setWToken("");
      await loadServerState();
    } finally {
      setWBusy(false);
    }
  };

  const handleSaveByok = async (e: React.FormEvent) => {
    e.preventDefault();
    setBErr(null);
    const res = await fetch("/api/v1/heyuka/byok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerKind: bKind,
        label: bLabel || bKind,
        apiKey: bKey,
        modelId: bModel,
        baseUrl: bBase || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setBErr(json?.error?.message || "Failed saving encrypted BYOK key");
      return;
    }
    setBKey("");
    setBLabel("");
    await loadServerState();
  };

  return (
    <div className="space-y-6">
      {/* Zero-Cost Financial Architecture Banner */}
      <section className="rounded-2xl bg-[#161618] border border-white/[0.08] p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-rose-500">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ZERO-COST DISTRIBUTED COMPUTE • STRICT $0.00 OWNER EXPOSURE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          Distributed Compute, Device Hardware &amp; Tenant BYOK Providers
        </h1>
        <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl leading-relaxed">
          Priority order: (1) Your Browser WebGPU/WASM → (2) Your Registered Worker Servers → (3) Your Encrypted BYOK AI Keys → (4) Bounded Free Public Tiers. Paid owner accounts never act as a silent fallback.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="kaspi-frosted-surface rounded-2xl p-3">
            <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">WebGPU Status</div>
            <div className={`text-xs font-black mt-1 ${browserHw?.webGpuSupported ? "text-rose-500" : "text-amber-500"}`}>
              {browserHw?.webGpuSupported ? "DETECTED READY" : "Unavailable"}
            </div>
          </div>
          <div className="kaspi-frosted-surface rounded-2xl p-3">
            <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">WebAssembly</div>
            <div className="text-xs font-black text-rose-500 mt-1">
              {browserHw?.wasmSupported ? "READY" : "No"}
            </div>
          </div>
          <div className="kaspi-frosted-surface rounded-2xl p-3">
            <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Logical CPU Cores</div>
            <div className="text-sm font-black font-mono mt-0.5">
              {browserHw?.cpuCores ?? "Unexposed"}
            </div>
          </div>
          <div className="kaspi-frosted-surface rounded-2xl p-3">
            <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Browser Memory API</div>
            <div className="text-sm font-black font-mono mt-0.5">
              {browserHw?.deviceMemoryGb ? `~${browserHw.deviceMemoryGb} GB` : "Privacy Masked"}
            </div>
          </div>
          <div className="kaspi-frosted-surface rounded-2xl p-3">
            <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Daily Free Tier</div>
            <div className="text-sm font-black font-mono mt-0.5 text-rose-500">
              {budget ? `${budget.count}/${budget.limit}` : "0/120"} ($0.00)
            </div>
          </div>
        </div>

        {browserHw && (
          <div className="text-[11px] font-mono text-[var(--kaspi-text-muted)]">
            Adapter: {browserHw.webGpuAdapterName} • OS Platform: {browserHw.platform} • Storage Quota:{" "}
            {browserHw.storageQuotaMb ? `${browserHw.storageQuotaMb} MB` : "N/A"}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Distributed Worker Registration */}
        <section className="kaspi-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black flex items-center gap-2">
              <Server className="w-4 h-4 text-rose-500" />
              <span>User Worker Servers (Revocable)</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--kaspi-text-muted)]">
              {workers.filter((w) => w.status === "connected_verified").length} online
            </span>
          </div>

          <form onSubmit={handleAddWorker} className="space-y-3">
            <input
              type="text"
              required
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder="Worker label (e.g. Home RTX 4090 Node)"
              className="w-full rounded-2xl kaspi-glass-surface px-3.5 py-2.5 text-xs focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {(["linux", "windows", "macos", "docker", "cloud_gpu"] as WorkerOsTarget[]).map((os) => (
                <button
                  key={os}
                  type="button"
                  onClick={() => setWOs(os)}
                  className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold cursor-pointer ${
                    wOs === os ? "kaspi-orbit-active text-rose-500" : "kaspi-glass-surface"
                  }`}
                >
                  {os}
                </button>
              ))}
            </div>
            <input
              dir="ltr"
              type="url"
              required
              value={wUrl}
              onChange={(e) => setWUrl(e.target.value)}
              placeholder="https://worker.yourdomain.com (SSRF-safe public HTTPS endpoint)"
              className="w-full rounded-2xl kaspi-glass-surface px-3.5 py-2.5 text-xs font-mono focus:outline-none"
            />
            <input
              dir="ltr"
              type="text"
              value={wCaps}
              onChange={(e) => setWCaps(e.target.value)}
              placeholder="Capabilities comma-separated"
              className="w-full rounded-2xl kaspi-glass-surface px-3.5 py-2.5 text-xs font-mono focus:outline-none"
            />
            <label className="flex items-start gap-2 text-xs text-[var(--kaspi-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={wConsent}
                onChange={(e) => setWConsent(e.target.checked)}
                className="mt-1 accent-rose-500"
              />
              <span>
                I explicitly authorize HEYUKA to probe &amp; dispatch only my tenant&apos;s jobs to this Worker (I can revoke instantly anytime).
              </span>
            </label>
            {wErr && <div className="text-xs text-rose-500 font-semibold">{wErr}</div>}
            <button
              type="submit"
              disabled={wBusy}
              className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{wBusy ? "Registering & Probing..." : "Connect & Probe Worker"}</span>
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t border-[var(--kaspi-border)]">
            {workers.map((w) => (
              <div key={w.id} className="kaspi-frosted-surface rounded-2xl p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold">{w.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        w.status === "connected_verified"
                          ? "text-rose-500"
                          : w.status === "revoked"
                          ? "text-rose-500"
                          : "text-amber-500"
                      }`}
                    >
                      {w.status}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch("/api/v1/heyuka/workers", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "probe", workerId: w.id }),
                        });
                        await loadServerState();
                      }}
                      className="kaspi-glass-btn rounded-lg p-1 cursor-pointer"
                      title="Re-probe /health"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/v1/heyuka/workers?id=${encodeURIComponent(w.id)}`, {
                          method: "DELETE",
                        });
                        await loadServerState();
                      }}
                      className="kaspi-glass-btn rounded-lg p-1 text-rose-500 cursor-pointer"
                      title="Disconnect & Revoke Token"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div dir="ltr" className="text-[11px] font-mono text-[var(--kaspi-text-muted)] truncate">
                  {w.endpointUrl} • {w.tokenHint}
                </div>
                {w.lastError && <div className="text-[11px] text-amber-500">{w.lastError}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Tenant-Isolated Encrypted BYOK Providers */}
        <section className="kaspi-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-500" />
              <span>Your Encrypted BYOK AI Keys (AES-256-GCM)</span>
            </h2>
            <span className="text-[11px] font-mono text-rose-500">Zero Owner Billing</span>
          </div>

          <form onSubmit={handleSaveByok} className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(["groq", "google", "openrouter", "openai_compatible", "mistral", "local_ollama"] as ByokProviderKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setBKind(k)}
                  className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold cursor-pointer ${
                    bKind === k ? "kaspi-orbit-active text-rose-500" : "kaspi-glass-surface"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={bLabel}
              onChange={(e) => setBLabel(e.target.value)}
              placeholder="Label (e.g. My Groq Production Key)"
              className="w-full rounded-2xl kaspi-glass-surface px-3.5 py-2.5 text-xs focus:outline-none"
            />
            <input
              dir="ltr"
              type="password"
              required
              value={bKey}
              onChange={(e) => setBKey(e.target.value)}
              placeholder="Paste your provider API key (encrypted immediately at rest)"
              className="w-full rounded-2xl kaspi-glass-surface px-3.5 py-2.5 text-xs font-mono focus:outline-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                dir="ltr"
                type="text"
                required
                value={bModel}
                onChange={(e) => setBModel(e.target.value)}
                placeholder="Model ID (e.g. gemini-flash-latest)"
                className="rounded-2xl kaspi-glass-surface px-3.5 py-2 text-xs font-mono focus:outline-none"
              />
              <input
                dir="ltr"
                type="text"
                value={bBase}
                onChange={(e) => setBBase(e.target.value)}
                placeholder="Optional custom baseURL"
                className="rounded-2xl kaspi-glass-surface px-3.5 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
            {bErr && <div className="text-xs text-rose-500 font-semibold">{bErr}</div>}
            <button
              type="submit"
              className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Encrypt &amp; Prioritize My Provider</span>
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t border-[var(--kaspi-border)]">
            {byoks.map((b) => (
              <div key={b.id} className="kaspi-frosted-surface rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold truncate">
                    {b.label} <span className="font-mono text-[10px] text-rose-500">({b.modelId})</span>
                  </div>
                  <div dir="ltr" className="text-[11px] font-mono text-[var(--kaspi-text-muted)]">
                    {b.providerKind} • {b.maskedKey}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/v1/heyuka/byok?id=${encodeURIComponent(b.id)}`, {
                      method: "DELETE",
                    });
                    await loadServerState();
                  }}
                  className="kaspi-glass-btn rounded-lg p-1.5 text-rose-500 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
