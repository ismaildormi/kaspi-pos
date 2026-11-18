/**
 * ============================================================================
 * X × ZEBRA UNIFIED BRAIN & OLLAMA LOCAL CELL RUNTIME BRIDGE
 * Ported from C:\Users\hicha\Desktop\Zebra-X-V2\zebra-x-v2\src\:
 *   - sovereign-owner-root.mjs (Owner-only authority & zero privilege leakage)
 *   - local-open-model-pool.mjs (Local Ollama pool adapter)
 *   - decision-complexity-router.mjs (Complexity-based model routing)
 *
 * Security Invariants (PACK041 / PACK052):
 * 1. X + Zebra operate together as ONE unified Sovereign Brain.
 * 2. Regular merchants run their OWN local Ollama ("cell" on their device)
 *    and NEVER receive Owner-Reserved actions or view cross-tenant data.
 * 3. Only the verified SUPER_ADMIN Owner can query aggregated learning
 *    traces, export fine-tuning datasets, or run X × Zebra Owner Console.
 * ============================================================================
 */

export const X_ZEBRA_CORE_CONTRACT = Object.freeze({
  schema: "kaspi.x-zebra.unified.v1",
  unifiedBrain: true,
  modelsMerged: ["X (Sovereign Owner Root + Behavioral Learning)", "Zebra V2 (Complexity Router + Trace Evolution)"],
  ownerOnlyPrivileges: [
    "INSPECT_CROSS_DEVICE_TRACES",
    "EXPORT_FINETUNING_JSONL",
    "PROMOTE_OWNER_CORRECTIONS",
    "VIEW_PLATFORM_ANALYTICS",
    "MANAGE_SYSTEM_MODEL_POLICY",
  ] as const,
  merchantLocalCellRule: "Merchants execute locally via device Ollama; traces are secret-scrubbed before telemetry.",
});

export interface OllamaModelRecommendation {
  modelTag: string;
  approxSizeGb: number;
  minRamGb: number;
  minFreeDiskGb: number;
  label: string;
  supportsTools: boolean;
  languages: string[];
}

export const RECOMMENDED_OLLAMA_CELLS: OllamaModelRecommendation[] = [
  {
    modelTag: "qwen2.5:3b",
    approxSizeGb: 1.9,
    minRamGb: 6,
    minFreeDiskGb: 6,
    label: "Qwen 2.5 (3B) — Fast Store & Cash Register Cell (AR/FR/EN/Darija)",
    supportsTools: true,
    languages: ["ar", "darija", "fr", "en"],
  },
  {
    modelTag: "qwen2.5:7b",
    approxSizeGb: 4.7,
    minRamGb: 12,
    minFreeDiskGb: 10,
    label: "Qwen 2.5 (7B) — High-Accuracy Multilingual & Auto-Responder Cell",
    supportsTools: true,
    languages: ["ar", "darija", "fr", "en"],
  },
  {
    modelTag: "dolphin-llama3:latest",
    approxSizeGb: 4.7,
    minRamGb: 12,
    minFreeDiskGb: 10,
    label: "Dolphin Llama 3 — Direct Assistant Model",
    supportsTools: false,
    languages: ["en", "fr", "ar"],
  },
];

export function selectSafeOllamaModelForDevice(params: {
  installedModels?: string[];
  ramGb?: number;
  freeDiskGb?: number;
  preferOwnerCoding?: boolean;
}): string {
  const ram = params.ramGb ?? 12;
  const disk = params.freeDiskGb ?? 10;
  const installed = (params.installedModels || []).map((m) => m.trim()).filter(Boolean);
  const safeInstalled =
    ram < 24 ? installed.filter((m) => !/\b(32b|70b|72b)\b|:(?:32b|70b|72b)/i.test(m)) : installed;
  const pool = safeInstalled.length > 0 ? safeInstalled : installed;

  // 1. Prefer an already-installed multilingual/fast model fitting hardware RAM
  const priorityInstalled = [
    "qwen2.5:7b",
    "qwen2.5:3b",
    "qwen2.5:14b",
    "dolphin-llama3:latest",
    "qwen3:4b",
    "llama3.2:latest",
  ];
  for (const tag of priorityInstalled) {
    const found = pool.find((m) => m === tag);
    if (found) return found;
  }
  for (const tag of priorityInstalled) {
    const prefix = `${tag.split(":")[0]}:`;
    const found = pool.find((m) => m.startsWith(prefix));
    if (found) return found;
  }
  if (pool.length > 0) {
    return pool[0];
  }

  // 2. Otherwise pick hardware-safe download candidate (never auto-pull 19GB 32b on shop PCs)
  if (ram >= 12 && disk >= 10) return "qwen2.5:7b";
  if (disk >= 5) return "qwen2.5:3b";
  return "qwen2.5:1.5b";
}

export function classifyComplexityRoute(prompt: string, isVerifiedOwner: boolean): {
  tier: "LOCAL_FAST" | "LOCAL_MULTILINGUAL" | "OWNER_X_ZEBRA";
  suggestedTemp: number;
  suggestedNumCtx: number;
} {
  const p = (prompt || "").toLowerCase();
  if (
    isVerifiedOwner &&
    /(zebra|system x|learning trace|jsonl|platform|tenants|mrr|audit|تطور|التعلم)/i.test(p)
  ) {
    return { tier: "OWNER_X_ZEBRA", suggestedTemp: 0.25, suggestedNumCtx: 8192 };
  }
  if (p.length > 260 || /(comment|auto.?reply|كومونتير|إحصائيات|تقرير|stock|sales|مبيعات)/i.test(p)) {
    return { tier: "LOCAL_MULTILINGUAL", suggestedTemp: 0.35, suggestedNumCtx: 8192 };
  }
  return { tier: "LOCAL_FAST", suggestedTemp: 0.45, suggestedNumCtx: 4096 };
}

/**
 * Generates a safe, hardware-aware PowerShell bootstrap script that:
 * 1) Verifies Windows RAM & free disk space before pulling weights.
 * 2) Installs Ollama silently via winget only if missing.
 * 3) Configures OLLAMA_ORIGINS so KASPI POS web/desktop connects directly on localhost.
 * 4) Pulls lightweight multilingual qwen2.5 (3b or 7b — never blocks cashier PCs with 19GB 32b).
 */
export function buildMerchantOllamaPowershellSetup(preferredModel = "auto"): string {
  return `# KASPI POS — Safe Local Ollama Cell Setup (Windows PowerShell)
$ErrorActionPreference = "Stop"
$ramGB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
$freeGB = [math]::Round((Get-PSDrive C).Free / 1GB, 1)
Write-Host "[KASPI AI] Detected RAM: $ramGB GB | Free Disk C: $freeGB GB" -ForegroundColor Cyan

if ($freeGB -lt 5.5) {
  Write-Host "[STOP] At least 5.5 GB free on C: is required to install local AI safely." -ForegroundColor Red
  exit 1
}

$model = "${preferredModel}"
if ($model -eq "auto") {
  if ($ramGB -ge 12 -and $freeGB -ge 10) { $model = "qwen2.5:7b" }
  elseif ($freeGB -ge 5.5) { $model = "qwen2.5:3b" }
  else { $model = "qwen2.5:1.5b" }
}

[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "https://kaspi-pos.vercel.app,http://localhost:3000,http://127.0.0.1:*", "User")
$env:OLLAMA_ORIGINS = "https://kaspi-pos.vercel.app,http://localhost:3000,http://127.0.0.1:*"

$ollamaExe = (Get-Command ollama -ErrorAction SilentlyContinue).Source
if (-not $ollamaExe -and (Test-Path "$env:LOCALAPPDATA\\Programs\\Ollama\\ollama.exe")) {
  $ollamaExe = "$env:LOCALAPPDATA\\Programs\\Ollama\\ollama.exe"
}
if (-not $ollamaExe) {
  Write-Host "[KASPI AI] Installing Ollama via winget..." -ForegroundColor Yellow
  winget install -e --id Ollama.Ollama --accept-package-agreements --accept-source-agreements
  $ollamaExe = "$env:LOCALAPPDATA\\Programs\\Ollama\\ollama.exe"
}

try {
  Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2 | Out-Null
} catch {
  Write-Host "[KASPI AI] Starting Ollama background service..." -ForegroundColor Cyan
  Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

Write-Host "[KASPI AI] Downloading multilingual local model ($model)..." -ForegroundColor Green
& $ollamaExe pull $model
Write-Host "[OK] KASPI Local AI Cell Ready ($model) on http://127.0.0.1:11434" -ForegroundColor Green`;
}

/**
 * Queries localhost Ollama directly from browser (when OLLAMA_ORIGINS allows)
 * OR via native Tauri Rust backend bridge (`invoke('run_local_ai_inference')`),
 * bypassing any browser CORS/CSP restriction.
 */
export async function probeAndChatLocalOllama(params: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  preferredModel?: string;
  baseUrl?: string;
}): Promise<{
  ok: boolean;
  text: string;
  model: string;
  backend: "tauri_ollama" | "http_ollama" | "unavailable";
  installedModels: string[];
  error?: string;
}> {
  const endpoint = (params.baseUrl || "http://127.0.0.1:11434").replace(/\/$/, "");

  // 1. Prefer native Tauri v2 IPC command when inside KASPI Desktop .exe
  const tauriInvoke =
    typeof window !== "undefined"
      ? (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.core?.invoke
      : null;

  if (typeof tauriInvoke === "function") {
    try {
      const status = await tauriInvoke("check_ollama_status").catch(() => null);
      const installed: string[] = Array.isArray(status?.models) ? status.models : [];
      if (status?.reachable) {
        const chosenModel =
          params.preferredModel ||
          selectSafeOllamaModelForDevice({ installedModels: installed, ramGb: 12, freeDiskGb: 10 });
        const lastUser = [...params.messages].reverse().find((m) => m.role === "user")?.content || "";
        const systemMsg = params.messages.find((m) => m.role === "system")?.content || "";
        const res = await tauriInvoke("run_local_ai_inference", {
          request: {
            prompt: lastUser,
            systemPrompt: systemMsg,
            messages: params.messages,
            modelPath: chosenModel,
            maxTokens: 1200,
            temperature: 0.35,
          },
        });
        if (res && !res.error && typeof res.text === "string" && res.text.trim()) {
          return {
            ok: true,
            text: res.text.trim(),
            model: chosenModel,
            backend: "tauri_ollama",
            installedModels: installed,
          };
        }
      }
    } catch {
      // Fall through to direct browser localhost check
    }
  }

  // 2. Direct browser localhost HTTP call (works when OLLAMA_ORIGINS allows origin)
  try {
    const tagsRes = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!tagsRes.ok) {
      return {
        ok: false,
        text: "",
        model: "",
        backend: "unavailable",
        installedModels: [],
        error: `Ollama HTTP ${tagsRes.status}`,
      };
    }
    const tagsData = await tagsRes.json().catch(() => ({}));
    const installed: string[] = Array.isArray(tagsData?.models)
      ? tagsData.models.map((m: any) => String(m?.name || "")).filter(Boolean)
      : [];

    if (installed.length === 0) {
      return {
        ok: false,
        text: "",
        model: "",
        backend: "unavailable",
        installedModels: [],
        error: "Ollama is running but no models are downloaded yet (run setup).",
      };
    }

    const chosenModel =
      params.preferredModel && installed.includes(params.preferredModel)
        ? params.preferredModel
        : selectSafeOllamaModelForDevice({ installedModels: installed, ramGb: 12, freeDiskGb: 10 });

    const chatRes = await fetch(`${endpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: chosenModel,
        messages: params.messages,
        stream: false,
        options: { temperature: 0.35, num_ctx: 8192 },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!chatRes.ok) {
      return {
        ok: false,
        text: "",
        model: chosenModel,
        backend: "unavailable",
        installedModels: installed,
        error: `Ollama chat returned HTTP ${chatRes.status}`,
      };
    }

    const chatData = await chatRes.json().catch(() => null);
    const replyText = String(chatData?.message?.content || chatData?.response || "").trim();
    if (!replyText) {
      return {
        ok: false,
        text: "",
        model: chosenModel,
        backend: "unavailable",
        installedModels: installed,
        error: "Empty completion from local Ollama",
      };
    }

    return {
      ok: true,
      text: replyText,
      model: chosenModel,
      backend: "http_ollama",
      installedModels: installed,
    };
  } catch (err: any) {
    return {
      ok: false,
      text: "",
      model: "",
      backend: "unavailable",
      installedModels: [],
      error: String(err?.message || "Local Ollama unreachable on 127.0.0.1:11434"),
    };
  }
}

export async function probeLocalOllamaModels(
  baseUrl = "http://127.0.0.1:11434"
): Promise<{ reachable: boolean; models: string[]; via: "tauri" | "http" | "none" }> {
  const tauriInvoke =
    typeof window !== "undefined"
      ? (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.core?.invoke
      : null;

  if (typeof tauriInvoke === "function") {
    try {
      const status = await tauriInvoke("check_ollama_status");
      if (status?.reachable) {
        return {
          reachable: true,
          models: Array.isArray(status.models) ? status.models : [],
          via: "tauri",
        };
      }
    } catch {
      // Fallback to direct HTTP probe
    }
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: AbortSignal.timeout(1800),
    });
    if (!res.ok) return { reachable: false, models: [], via: "none" };
    const data = await res.json().catch(() => ({}));
    const models = Array.isArray(data?.models)
      ? data.models.map((m: any) => String(m?.name || "")).filter(Boolean)
      : [];
    return { reachable: true, models, via: "http" };
  } catch {
    return { reachable: false, models: [], via: "none" };
  }
}
