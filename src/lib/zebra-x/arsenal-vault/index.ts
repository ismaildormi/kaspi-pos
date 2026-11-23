/**
 * X × Zebra — Standby Global Arsenal Vault (v7.0–v7.2 Isolated Domain Module)
 * STRICT ISOLATION RULES (Immutable POS Core Lock):
 * 1. NEVER imported inside cashier/POS transaction routes (/pos, /dashboard/products, /sales).
 * 2. POS daily operations stay deterministic code; `X × Zebra` never mutates Kaspi POS source files or DB layout.
 * 3. General tools (`v7.0 Power Boosters`) remain catalogued cleanly in this Standby Vault and safely expose
 *    SSRF-guarded unrestricted research + external project assistance inside the compact/expanded chat & API portal.
 */

export interface ArsenalVaultEntry {
  id: string;
  name: string;
  domain: string;
  posAllowed: boolean;
  executionTier: "standby_sandbox_sidecar" | "embedded_ai_slot" | "unrestricted_chat_web";
  source: string;
}

export const POS_IMMUTABLE_CORE_LOCK = true;

/**
 * Blocks any external or code-manipulation tool from targeting internal Kaspi POS codebase or DB files.
 */
export function assertPosCoreImmutable(targetPath: string): void {
  const normalized = String(targetPath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .toLowerCase();
  const posRelativePrefixes = ["src/", "prisma/", "src-tauri/", "scripts/"];
  const protectedMarkers = [
    "pos-saas-morocco",
    "kaspi-pos",
    "/src/app/",
    "/src/server/",
    "/src/domain/",
    "/prisma/",
    "/src-tauri/",
  ];

  if (
    posRelativePrefixes.some((prefix) => normalized.startsWith(prefix)) ||
    protectedMarkers.some((marker) => normalized.includes(marker))
  ) {
    throw new Error(
      "IMMUTABLE_POS_CORE_LOCK: Mutating internal Kaspi POS source code, UI layout, or database schema is blocked."
    );
  }
}

export const STANDBY_ARSENAL_VAULT_ITEMS: readonly ArsenalVaultEntry[] = [
  { id: "ts-morph", name: "ts-morph", domain: "Live Code & UI Mutation (External Only)", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "dsherret/ts-morph" },
  { id: "jscodeshift", name: "jscodeshift", domain: "AST Codemods (External Only)", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "facebook/jscodeshift" },
  { id: "lightningcss", name: "Lightning CSS / PostCSS AST", domain: "CSS/Tailwind Theme Transforms", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "parcel-bundler/lightningcss" },
  { id: "isomorphic-git", name: "isomorphic-git", domain: "In-Browser Git Snapshots", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "isomorphic-git/isomorphic-git" },
  { id: "rmbg-ben2", name: "RMBG-1.4 / BEN2 (ONNX WebGPU)", domain: "High-Precision Cutout AI Slot", posAllowed: true, executionTier: "embedded_ai_slot", source: "briaai/RMBG-1.4" },
  { id: "paddleocr-onnx", name: "PaddleOCR-ONNX-Web", domain: "Browser Multilingual Receipt OCR", posAllowed: true, executionTier: "embedded_ai_slot", source: "PaddlePaddle/PaddleOCR" },
  { id: "danfo-simple-stats", name: "Danfo.js + Simple-Statistics", domain: "Forecasting & Analytics Slot", posAllowed: true, executionTier: "embedded_ai_slot", source: "simple-statistics/simple-statistics" },
  { id: "transformers-webgpu", name: "Transformers.js v3 (WebGPU)", domain: "Headless Client Summarizer & Vision", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "huggingface/transformers.js" },
  { id: "pyodide-worker", name: "Pyodide + Micropip (Lazy Worker)", domain: "Isolated Python Science Runtime", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "pyodide/pyodide" },
  { id: "sqljs-alasql", name: "SQL.js + Alasql", domain: "In-Chat SQL over CSV/Excel/JSON", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "AlaSQL/alasql" },
  { id: "jsbarcode-qrcode", name: "qrcode-generator + JsBarcode", domain: "Printable EAN-13/Code128/QR Labels", posAllowed: true, executionTier: "embedded_ai_slot", source: "lindell/JsBarcode" },
  { id: "searxng-json", name: "SearXNG Public JSON Instances", domain: "Unrestricted Meta-Search (No-Key)", posAllowed: false, executionTier: "unrestricted_chat_web", source: "searxng/searxng" },
  { id: "allorigins-cors", name: "AllOrigins / CorsProxy-OSS", domain: "Public CORS-Safe Page Bridge", posAllowed: false, executionTier: "unrestricted_chat_web", source: "gnuns/allOrigins" },
  { id: "linkedom-cheerio", name: "Cheerio / Linkedom DOM Parser", domain: "Fast External HTML/Table Extraction", posAllowed: false, executionTier: "unrestricted_chat_web", source: "WebReflection/linkedom" },
  { id: "esbuild-wasm", name: "Esbuild-Wasm", domain: "50ms Sandbox TypeScript Verifier", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "evanw/esbuild" },
  // v7.5 — 4-App API Backend & Dedicated AI Portal Stack
  { id: "birefnet-rmbg", name: "RMBG-1.4 / BiRefNet + @imgly", domain: "BG Remover App (POST /api/v1/vision/remove-bg)", posAllowed: true, executionTier: "embedded_ai_slot", source: "briaai/RMBG-1.4" },
  { id: "triposr-instantmesh", name: "TripoSR + InstantMesh + glTF-Transform + PolyHaven/Objaverse", domain: "3D & PNG Hub for Blender (/api/v1/3d/*)", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "VAST-AI-Research/TripoSR" },
  { id: "faster-whisper-whisperx", name: "Faster-Whisper + WhisperX + yt-dlp + LanguageTool", domain: "Audio/Video Transcription (/api/v1/audio/transcribe)", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "SYSTRAN/faster-whisper" },
  { id: "demucs-uvr5-ffmpeg", name: "Demucs (Meta) + UVR5 + FFmpeg", domain: "Vocal & Stem Separator (/api/v1/audio/separate)", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "facebookresearch/demucs" },
  { id: "scalar-shiki-portal", name: "Scalar API Reference + Shiki + SHA-256 zx-live Keys", domain: "X × Zebra AI Platform Portal (/zebra-x)", posAllowed: false, executionTier: "unrestricted_chat_web", source: "scalar/scalar" },
  // v7.6 — Rapid & Creative Power Tools
  { id: "moneyprinter-shortgpt", name: "MoneyPrinterTurbo / ShortGPT + whisper-timestamped", domain: "Automated Shorts & Word Captions", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "harry0703/MoneyPrinterTurbo" },
  { id: "podcastfy-notebooklm", name: "Podcastfy / Open-NotebookLM", domain: "URL/PDF-to-Podcast Dialogue", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "souzatharsis/podcastfy" },
  { id: "pixijs-waifu2x-cobalt", name: "PixiJS Filters + waifu2x-ncnn-vulkan + Cobalt", domain: "Creative Filters, 4x Vulkan Upscale & Media Fetch", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "imputnet/cobalt" },
  { id: "phaser3-autoanimate", name: "Phaser 3 / Kaboom.js + AutoAnimate", domain: "Interactive Mini-Games & Micro-Motion UI", posAllowed: false, executionTier: "unrestricted_chat_web", source: "phaserjs/phaser" },
  { id: "grammy-whatsapp-lite", name: "grammY + whatsapp-web.js / Evolution-Lite", domain: "Lightweight Bot Automation Bridges", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "grammyjs/grammY" },
  // v7.7 -> v8.2 — Adobe Creative Suite, Blender, Smart App-Trigger HUD & In-Studio Builders
  { id: "adobe-creative-bridges", name: "Adobe UXP / CEP / ExtendScript (PS/AE/PR/AI/AU/ID) + ag-psd / psd-tools", domain: "Adobe Creative Cloud Automation & PSD Parsing", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "adobe/uxp" },
  { id: "blender-mcp-bpy", name: "Blender-MCP (223 Tools) + bpy + Infinigen + Goxel + Aseprite API", domain: "Procedural 3D World, Pixel/Voxel & Studio Builder", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "ahujasid/blender-mcp" },
  { id: "smart-app-trigger-hud", name: "Tauri HUD Spec (sysinfo + windows-rs + window-vibrancy + xcap + Alt+X)", domain: "Context-Aware Creative HUD (App-Triggered)", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "tauri-apps/window-vibrancy" },
  { id: "video-person-eraser", name: "ProPainter + E2FGVI / DiffuEraser + SAM 2 + LaMa", domain: "Video & Photo Object/Person Inpainting", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "sczhou/ProPainter" },
  { id: "creative-director-imitation", name: "Auto-Editor + PySceneDetect + OpenTimelineIO + OpenAdapt + PyIQA", domain: "Long-Form Auto-Editing & Workflow Imitation Learning", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "OpenAdaptAI/OpenAdapt" },
  // v8.3 -> v8.5 — Search-First Visual Reference, Smart City Urban OS & Universal Auto-Connector
  { id: "visual-reference-search", name: "Openverse API + Wikimedia/Met Museum + Objaverse + PolyHaven + SigLIP", domain: "Search-First Creative Reference & Live Inspiration", posAllowed: false, executionTier: "unrestricted_chat_web", source: "WordPress/openverse" },
  { id: "smart-city-urban-os", name: "Transitland/OTP/GTFS + OpenTraffic + Overpass City + OpenAQ + CesiumJS", domain: "Smart City Transit, Air Quality & 3D Urban Sensors", posAllowed: false, executionTier: "unrestricted_chat_web", source: "CesiumGS/cesium" },
  { id: "universal-auto-connector", name: "OpenAPI Auto-Parser + @modelcontextprotocol/sdk + Activepieces Webhook + @x-zebra/sdk", domain: "Dynamic External API/MCP Discovery & SDK Sync", posAllowed: false, executionTier: "unrestricted_chat_web", source: "modelcontextprotocol/typescript-sdk" },
  // v9.4 — 100x Distributed Node Mesh & Nador/Oriental Localization
  { id: "distributed-node-mesh-v94", name: "@x-zebra/node + NATS.io + Ray + IPFS/OrbitDB + SurrealDB", domain: "Opt-In 100x Multiplied Worker Mesh & Owner Root Priority", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "nats-io/nats-server" },
  { id: "nador-oriental-localization-v94", name: "Overpass/OSRM + Open-Meteo Marine + Beni Ansar/Nador West Med + Darija/Tarifit Normalizer", domain: "Nador & Oriental Region Local Routing, Marine & Linguistics", posAllowed: false, executionTier: "unrestricted_chat_web", source: "open-meteo/open-meteo" },
  // v10.0 — Unified HEYUKA Sovereign Architecture (Owned by KASPI)
  { id: "heyuka-cosmic-100", name: "HEYUKA 100 Cosmic Zero-Key Sources (Piston, Jina Reader, Pollinations, Kroki, QuickChart)", domain: "7-Domain Zero-Key Knowledge, Code & Media Hub", posAllowed: false, executionTier: "unrestricted_chat_web", source: "heyuka/kaspi-sovereign" },
  { id: "heyuka-cyber-20-feeds", name: "HEYUKA 20 Cyber-Defense Feeds (CISA KEV, NIST NVD 2.0, Google OSV.dev, FIRST EPSS, Cloudflare DoH)", domain: "DEFCON-1 Zero-Key Vulnerability & Threat Intelligence", posAllowed: false, executionTier: "unrestricted_chat_web", source: "cisa/kev" },
  { id: "heyuka-cloud-fleet-12", name: "HEYUKA 12 Zero-Key & Hybrid Cloud Fleet Gateways", domain: "Serverless Offloading, Latency Probes & Fallbacks", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "heyuka/cloud-fleet" },
  { id: "heyuka-5tier-memory", name: "HEYUKA 5-Tier Hybrid Memory (IndexedDB + Orama/Fuse + 128-dim Cosine + ChromaDB + AES-256-GCM)", domain: "Cross-Tier Semantic & Vector Persistence", posAllowed: false, executionTier: "unrestricted_chat_web", source: "chroma-core/chroma" },
  { id: "heyuka-webgl2-desktop", name: "HEYUKA Desktop OS (60 FPS WebGL2/GPGPU Fur, 32 Characters, Electron + PyAutoGUI + UIA + Ghost Cursor + TripoSR :8188)", domain: "Isolated Desktop Companion App (apps/heyuka-desktop)", posAllowed: false, executionTier: "standby_sandbox_sidecar", source: "kaspi/heyuka-desktop" },
];

export const HEYUKA_ROOT_IDENTITY = {
  modelName: "HEYUKA",
  ownerCompany: "KASPI",
  version: "v10.0",
  cosmicZeroKeySourcesCount: 100,
  cyberDefenseFeedsCount: 20,
  cloudFleetGatewaysCount: 12,
  characterProfilesCount: 32,
  hybridMemoryTiers: 5,
} as const;

export const DISTRIBUTED_NODE_MESH_SPEC = {
  version: "v9.4",
  architecture: "100x-n-fold-multiplied-mesh",
  provisioningModel: "Full Open-Source Arsenal Provisioning (Opt-In via zx-live API key + @x-zebra/node / Docker / Desktop Companion)",
  transportStack: ["NATS.io", "Ray", "IPFS/OrbitDB", "SurrealDB"] as const,
  ownerRootNodePriority: true,
  skillSyncLibrary: "Voyager Skill Library (SemHash + FSRS verified)",
  compliance: {
    explicitUserOptInRequired: true,
    standardOsUninstallerRequired: true,
    immutablePosCoreLock: true,
  },
  nadorLocalization: {
    city: "Nador",
    region: "Oriental Morocco",
    coordinates: { lat: 35.1688, lon: -2.9335 },
    hubs: ["Beni Ansar Port", "Nador West Med", "Marchica", "Selouane", "Al Aroui", "Zaio"],
    languages: ["Arabic", "Moroccan Darija", "Riffian Tarifit Amazigh", "French", "English"],
  },
} as const;

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|\[?fe80:|\[?fc00:|\[?fd00:|172\.(1[6-9]|2\d|3[0-1])\.)/i;

export function isSafePublicHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname.toLowerCase();
    if (!host || PRIVATE_HOST_RE.test(host)) return false;
    if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return false;
    if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes DuckDuckGo `/l/?uddg=...` redirect URLs into direct clickable URLs.
 */
function resolveDdgHref(rawHref: string): string {
  try {
    const full = rawHref.startsWith("//") ? `https:${rawHref}` : rawHref;
    const u = new URL(full, "https://duckduckgo.com");
    const uddg = u.searchParams.get("uddg");
    if (uddg && /^https?:\/\//i.test(uddg)) return uddg;
    if (/^https?:\/\//i.test(full)) return full;
    return "";
  } catch {
    return "";
  }
}

/**
 * Fetches live HTML search hits from DuckDuckGo HTML endpoint (no API key) for real Google-like SERP results.
 */
async function fetchDuckDuckGoWebSerp(
  query: string
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KaspiHeyukaStudio/3.0; +https://kaspi-pos.vercel.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(5500),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const anchorRe = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRe = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const snippets: string[] = [];
    let sm: RegExpExecArray | null;
    while ((sm = snippetRe.exec(html)) !== null && snippets.length < 10) {
      snippets.push(stripHtmlClean(sm[1] || sm[2] || ""));
    }
    let am: RegExpExecArray | null;
    let idx = 0;
    while ((am = anchorRe.exec(html)) !== null && results.length < 8) {
      const cleanUrl = resolveDdgHref(am[1]);
      const title = stripHtmlClean(am[2]);
      if (cleanUrl && title && isSafePublicHttpUrl(cleanUrl)) {
        results.push({
          title: title.slice(0, 160),
          url: cleanUrl,
          snippet: (snippets[idx] || "").slice(0, 280),
        });
      }
      idx += 1;
    }
    return results;
  } catch {
    return [];
  }
}

function stripHtmlClean(html: string): string {
  let out = String(html || "");
  let prev: string;
  do {
    prev = out;
    out = out.replace(/<[^<>]*>/g, " ");
  } while (out !== prev);
  return out
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SEARX_PUBLIC_INSTANCES = [
  "https://searx.be/search",
  "https://search.ononoki.org/search",
  "https://priv.au/search",
];

/**
 * Unrestricted Universal Web & Knowledge Research helper for Chat & API requests
 * (queries open SearXNG JSON instances -> falls back cleanly to DuckDuckGo + Wikipedia,
 * OR extracts clean readable text from an external public URL with strict SSRF guard).
 */
export async function runUnrestrictedWebResearch(params: {
  query?: string;
  url?: string;
  lang?: string;
}): Promise<{
  ok: boolean;
  mode: "url_extract" | "meta_search";
  source: string;
  results?: Array<{ title: string; url: string; snippet: string }>;
  extractedText?: string;
  error?: string;
}> {
  const lang = (params.lang || "en").slice(0, 2).toLowerCase();

  if (params.url) {
    if (!isSafePublicHttpUrl(params.url)) {
      return {
        ok: false,
        mode: "url_extract",
        source: params.url,
        error: "SSRF_BLOCKED: Private, local, or non-HTTP URLs are forbidden.",
      };
    }

    // Try Jina Reader (r.jina.ai) first for clean Markdown extraction of modern SPAs/articles
    try {
      const jinaUrl = `https://r.jina.ai/${params.url}`;
      const jinaRes = await fetch(jinaUrl, {
        headers: { "User-Agent": "KaspiPOS-HEYUKA-Research/3.0", Accept: "text/plain" },
        signal: AbortSignal.timeout(5000),
      });
      if (jinaRes.ok) {
        const mdText = (await jinaRes.text()).trim();
        if (mdText.length >= 120) {
          return {
            ok: true,
            mode: "url_extract",
            source: `jina:${new URL(params.url).hostname}`,
            extractedText: mdText.slice(0, 8000),
          };
        }
      }
    } catch {
      // Fallback gracefully to direct fetch
    }

    try {
      const res = await fetch(params.url, {
        headers: { "User-Agent": "KaspiPOS-HEYUKA-Research/3.0" },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      return {
        ok: true,
        mode: "url_extract",
        source: params.url,
        extractedText: stripHtmlClean(html).slice(0, 6000),
      };
    } catch (err: any) {
      return {
        ok: false,
        mode: "url_extract",
        source: params.url,
        error: err?.message || "Failed to fetch external public page",
      };
    }
  }

  const query = (params.query || "").trim();
  if (!query) {
    return { ok: false, mode: "meta_search", source: "none", error: "Missing query" };
  }

  // Try public SearXNG JSON instances first
  for (const instance of SEARX_PUBLIC_INSTANCES) {
    try {
      const u = `${instance}?q=${encodeURIComponent(query)}&format=json&language=${lang}`;
      const res = await fetch(u, {
        headers: {
          "User-Agent": "KaspiPOS-XZebra-Research/2.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as any;
      if (Array.isArray(json?.results) && json.results.length > 0) {
        return {
          ok: true,
          mode: "meta_search",
          source: new URL(instance).hostname,
          results: json.results.slice(0, 6).map((r: any) => ({
            title: String(r.title || ""),
            url: String(r.url || ""),
            snippet: String(r.content || "").slice(0, 280),
          })),
        };
      }
    } catch {
      // Try next open instance gracefully
    }
  }

  // Reliable public search cascade: DuckDuckGo Live SERP + Instant + Wikipedia
  try {
    const [ddgSerpRes, ddgRes, wikiRes] = await Promise.allSettled([
      fetchDuckDuckGoWebSerp(query),
      fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
        signal: AbortSignal.timeout(4500),
      }).then((r) => r.json()),
      fetch(
        `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          query
        )}&utf8=&format=json&srlimit=4&origin=*`,
        { signal: AbortSignal.timeout(4500) }
      ).then((r) => r.json()),
    ]);

    const items: Array<{ title: string; url: string; snippet: string }> = [];
    const seenUrls = new Set<string>();
    const pushUnique = (item: { title: string; url: string; snippet: string }) => {
      if (!item.url || seenUrls.has(item.url)) return;
      seenUrls.add(item.url);
      items.push(item);
    };

    if (ddgSerpRes.status === "fulfilled" && Array.isArray(ddgSerpRes.value)) {
      for (const hit of ddgSerpRes.value) pushUnique(hit);
    }
    if (ddgRes.status === "fulfilled" && ddgRes.value?.AbstractText) {
      pushUnique({
        title: String(ddgRes.value.Heading || query),
        url: String(ddgRes.value.AbstractURL || "https://duckduckgo.com"),
        snippet: String(ddgRes.value.AbstractText).slice(0, 320),
      });
    }
    if (wikiRes.status === "fulfilled" && Array.isArray(wikiRes.value?.query?.search)) {
      for (const hit of wikiRes.value.query.search) {
        pushUnique({
          title: String(hit.title),
          url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(hit.title).replace(/\s+/g, "_"))}`,
          snippet: stripHtmlClean(String(hit.snippet || "")),
        });
      }
    }

    return {
      ok: true,
      mode: "meta_search",
      source: items.length > 0 ? "web+duckduckgo+wikipedia" : "duckduckgo+wikipedia",
      results: items,
    };
  } catch (err: any) {
    return {
      ok: false,
      mode: "meta_search",
      source: "fallback",
      error: err?.message || "Web search temporarily unreachable",
    };
  }
}
