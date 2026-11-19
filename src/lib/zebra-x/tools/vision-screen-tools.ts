"use client";

import { touchWasmResource } from "@/lib/zebra-x/core/wasm-watchdog";

/**
 * X × Zebra — Phase 2 Browser Vision, OCR, Barcode, Social Image Sizer,
 * Palette Extractor, Web Crypto Transformer & Live Guided Tour (`driver.js`).
 * Zero server cost: everything loads lazily with `dynamic import()` and registers
 * heavy workers with `wasm-watchdog.ts`.
 */

export interface OcrExtractionResult {
  text: string;
  confidence: number;
  language: string;
}

export async function runBrowserOcrOnImage(
  imageSrc: string,
  lang = "ara+fra+eng"
): Promise<OcrExtractionResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(lang);
  touchWasmResource("ocr-tesseract", `Tesseract OCR (${lang})`, async () => {
    await worker.terminate().catch(() => {});
  });

  const { data } = await worker.recognize(imageSrc);
  touchWasmResource("ocr-tesseract", `Tesseract OCR (${lang})`, async () => {
    await worker.terminate().catch(() => {});
  });

  return {
    text: (data?.text || "").trim(),
    confidence: Math.round(data?.confidence ?? 0),
    language: lang,
  };
}

export async function decodeBarcodeFromImage(imageSrc: string): Promise<{
  found: boolean;
  text?: string;
  format?: string;
}> {
  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const reader = new BrowserMultiFormatReader();
  try {
    const result = await reader.decodeFromImageUrl(imageSrc);
    return {
      found: true,
      text: result.getText(),
      format: String(result.getBarcodeFormat()),
    };
  } catch {
    return { found: false };
  }
}

export async function generateBarcodePngDataUrl(params: {
  bcid: "code128" | "ean13" | "qrcode" | "datamatrix";
  text: string;
  scale?: number;
  includetext?: boolean;
}): Promise<string> {
  const bwipMod = await import("bwip-js");
  const bwipjs = (bwipMod as any).default ?? bwipMod;
  const canvas = document.createElement("canvas");

  bwipjs.toCanvas(canvas, {
    bcid: params.bcid,
    text: params.text,
    scale: params.scale ?? 3,
    height: params.bcid === "qrcode" || params.bcid === "datamatrix" ? 28 : 12,
    includetext: params.includetext ?? (params.bcid !== "qrcode" && params.bcid !== "datamatrix"),
    textxalign: "center",
    backgroundcolor: "ffffff",
    barcolor: "0f172a",
  });

  return canvas.toDataURL("image/png");
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

export interface SocialCropOutput {
  platform: string;
  dimensions: string;
  dataUrl: string;
}

/**
 * Smart browser-side multi-platform social cropper (`social-image-sizer` style)
 * producing clean PNG exports for Instagram, Story/Reel, YouTube, LinkedIn, & Square.
 */
export async function resizeImageForSocialPlatforms(
  imageSrc: string
): Promise<SocialCropOutput[]> {
  const img = await loadImageElement(imageSrc);
  const presets = [
    { platform: "Instagram Post (4:5)", width: 1080, height: 1350 },
    { platform: "Reels / TikTok / Story (9:16)", width: 1080, height: 1920 },
    { platform: "YouTube 16:9 Thumbnail", width: 1280, height: 720 },
    { platform: "Catalog / Square (1:1)", width: 1080, height: 1080 },
    { platform: "X / LinkedIn Post (1.91:1)", width: 1200, height: 628 },
  ];

  const outputs: SocialCropOutput[] = [];
  for (const preset of presets) {
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    const srcRatio = img.width / img.height;
    const dstRatio = preset.width / preset.height;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (srcRatio > dstRatio) {
      sw = Math.round(img.height * dstRatio);
      sx = Math.round((img.width - sw) / 2);
    } else {
      sh = Math.round(img.width / dstRatio);
      // Center slightly high to avoid clipping faces/product tops
      sy = Math.round((img.height - sh) * 0.35);
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, preset.width, preset.height);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, preset.width, preset.height);
    outputs.push({
      platform: preset.platform,
      dimensions: `${preset.width}×${preset.height}`,
      dataUrl: canvas.toDataURL("image/png"),
    });
  }
  return outputs;
}

/**
 * Extracts dominant brand hex palette cleanly using quantized canvas pixel sampling.
 */
export async function extractDominantColorPalette(
  imageSrc: string,
  maxColors = 5
): Promise<Array<{ hex: string; sharePercent: number }>> {
  const img = await loadImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, 64, 64);

  const { data } = ctx.getImageData(0, 0, 64, 64);
  const buckets = new Map<string, number>();
  let total = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = Math.round(data[i] / 24) * 24;
    const g = Math.round(data[i + 1] / 24) * 24;
    const b = Math.round(data[i + 2] / 24) * 24;
    const hex = `#${[r, g, b]
      .map((c) => Math.min(255, c).toString(16).padStart(2, "0"))
      .join("")}`;
    buckets.set(hex, (buckets.get(hex) || 0) + 1);
    total++;
  }

  return Array.from(buckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([hex, count]) => ({
      hex: hex.toUpperCase(),
      sharePercent: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

let driverCssInjected = false;
function ensureDriverCss(): void {
  if (typeof document === "undefined" || driverCssInjected) return;
  driverCssInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .driver-active .driver-overlay{position:fixed;inset:0;z-index:10000;pointer-events:none}
    .driver-popover{position:fixed;z-index:10001;max-width:300px;border-radius:14px;background:#0f172a;color:#f8fafc;border:1px solid rgba(16,185,129,.45);padding:12px 14px;box-shadow:0 16px 40px rgba(0,0,0,.45);font-family:inherit}
    .driver-popover-title{font-weight:700;font-size:13px;color:#34d399;margin-bottom:4px}
    .driver-popover-description{font-size:12px;color:#e2e8f0;line-height:1.5}
    .driver-popover-footer{display:flex;justify-content:flex-end;gap:6px;margin-top:10px}
    .driver-popover-footer button{background:#10b981;color:#052e16;border:0;border-radius:8px;padding:4px 10px;font-weight:700;font-size:11px;cursor:pointer}
    .driver-popover-close-btn{position:absolute;top:8px;right:8px;background:transparent;border:0;color:#94a3b8;cursor:pointer;font-size:14px}
  `;
  document.head.appendChild(style);
}

/**
 * Interactive on-screen spotlight walkthrough via lazy `driver.js`.
 */
export async function launchLiveUiGuide(
  steps: Array<{ selector?: string; title: string; description: string }>
): Promise<void> {
  if (typeof document === "undefined") return;
  ensureDriverCss();
  const { driver } = await import("driver.js");

  const resolvedSteps = steps.map((s) => {
    const el = s.selector ? document.querySelector(s.selector) : null;
    return {
      ...(el ? { element: el } : {}),
      popover: {
        title: s.title,
        description: s.description,
      },
    };
  });

  const tour = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    steps: resolvedSteps,
  });
  tour.drive();
}

/**
 * Lightweight browser Web Crypto & encoding utilities (CyberChef-style fast local transforms).
 */
export async function runCryptoOrFormatTransform(
  mode: "sha256" | "base64_encode" | "base64_decode" | "hex_encode" | "uuid" | "json_pretty",
  input: string
): Promise<string> {
  if (mode === "uuid") {
    return crypto.randomUUID();
  }
  if (mode === "json_pretty") {
    return JSON.stringify(JSON.parse(input), null, 2);
  }
  if (mode === "base64_encode") {
    const bytes = new TextEncoder().encode(input);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }
  if (mode === "base64_decode") {
    const bin = atob(input.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  if (mode === "hex_encode") {
    return Array.from(new TextEncoder().encode(input))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * v8.3 Search-First Visual Reference Fetcher:
 * Queries No-Key Openverse + Wikimedia/Met Museum + PolyHaven before design execution.
 */
export async function fetchVisualReferencePack(query: string) {
  const { queryPublicApiHub } = await import("./public-apis-hub");
  const [openverse, museum, models3d] = await Promise.allSettled([
    queryPublicApiHub({ category: "openverse_media", query, limit: 6 }),
    queryPublicApiHub({ category: "met_museum", query, limit: 4 }),
    queryPublicApiHub({ category: "polyhaven_3d", query: `models:${query}`, limit: 4 }),
  ]);

  return {
    query,
    openverse: openverse.status === "fulfilled" ? openverse.value.data : null,
    museum: museum.status === "fulfilled" ? museum.value.data : null,
    models3d: models3d.status === "fulfilled" ? models3d.value.data : null,
  };
}
