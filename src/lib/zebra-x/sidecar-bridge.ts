import { assertPosCoreImmutable, isSafePublicHttpUrl } from "./arsenal-vault";
import { queryPublicApiHub } from "./tools/public-apis-hub";
import { transcribeAudioBuffer } from "./audio-transcribe-server";

/**
 * X × Zebra — Sidecar, Creative Suite & 4-App Media Factory Bridge (v7.5 → v8.2)
 *
 * Security & Honesty Rules:
 * - Strictly isolated from deterministic Kaspi POS cashier flows (never mutates POS files).
 * - Heavy GPU workloads (BiRefNet/TripoSR/Faster-Whisper/Demucs/ProPainter/E2FGVI/LaMa)
 *   execute ONLY when an external verified Sidecar GPU node (`X_ZEBRA_SIDECAR_URL`) is
 *   configured, or route honestly to zero-cost browser WebGPU slots / live Open-API catalogs
 *   (PolyHaven, Openverse, Groq Whisper) without ever fabricating fake binary outputs.
 */

export interface CreativeBridgeSpec {
  id: string;
  version: string;
  category: string;
  engines: string[];
  executionTarget: "sidecar_gpu" | "tauri_desktop_hud" | "browser_webgpu" | "api_hybrid";
  description: string;
}

export const CREATIVE_BRIDGE_SPECS: readonly CreativeBridgeSpec[] = [
  {
    id: "bg_remover_factory",
    version: "v7.5",
    category: "BG Remover App",
    engines: ["@imgly/background-removal", "RMBG-1.4", "BiRefNet"],
    executionTarget: "api_hybrid",
    description: "Zero-cost browser WebGPU cutout + Sidecar batch BiRefNet PNG transparency pipeline.",
  },
  {
    id: "blender_3d_png_factory",
    version: "v7.5",
    category: "3D & PNG Hub for Blender",
    engines: ["TripoSR", "InstantMesh", "glTF-Transform", "PolyHaven API", "Objaverse"],
    executionTarget: "api_hybrid",
    description: "Image-to-GLB/FBX/BLEND via Sidecar TripoSR + live No-Key PolyHaven 3D/PBR/HDRI search.",
  },
  {
    id: "audio_video_transcribe_factory",
    version: "v7.5",
    category: "Video/Audio Transcriber",
    engines: ["Faster-Whisper", "WhisperX", "yt-dlp", "LanguageTool", "Groq Whisper-large-v3-turbo"],
    executionTarget: "api_hybrid",
    description: "Multilingual audio/Darija transcription with Sidecar Faster-Whisper & Groq/Gemini fallback.",
  },
  {
    id: "vocal_stem_separator_factory",
    version: "v7.5",
    category: "Vocal/Stem Separator",
    engines: ["Demucs (Meta htdemucs)", "UVR5", "FFmpeg"],
    executionTarget: "sidecar_gpu",
    description: "Studio-grade separation into Vocals + Instrumental stems via GPU Sidecar.",
  },
  {
    id: "rapid_creative_v76",
    version: "v7.6",
    category: "Rapid & Creative Pack",
    engines: [
      "MoneyPrinterTurbo",
      "ShortGPT",
      "whisper-timestamped",
      "Podcastfy",
      "Open-NotebookLM",
      "Photopea Headless",
      "PixiJS Filters",
      "waifu2x-ncnn-vulkan",
      "RealESRGAN-ncnn",
      "Cobalt",
      "Phaser 3",
      "Kaboom.js",
      "AutoAnimate",
      "whatsapp-web.js",
      "grammY",
    ],
    executionTarget: "sidecar_gpu",
    description: "Short video assembly, word-level captions, audio podcasts, media fetching, upscaling & bots.",
  },
  {
    id: "adobe_blender_desktop_v77_v82",
    version: "v7.7-v8.2",
    category: "Adobe Creative Suite, Blender & Desktop Control Bridges",
    engines: [
      "Adobe UXP Developer Tool",
      "Photoshop MCP / ExtendScript (JSX)",
      "After Effects MCP / aerender.exe",
      "Premiere Pro UXP / PProPanel",
      "Illustrator JSX / SVG Bridge",
      "Audition / InDesign CEP / IDML",
      "psd-tools / ag-psd / pyaaf2",
      "Blender-MCP (223 Tools) + bpy",
      "PyAutoGUI / pywinauto",
      "Tauri v2 Always-on-Top HUD",
      "get-windows / active-win",
      "Tauri Global Shortcut (Alt+X)",
      "xcap Window Capture",
      "Rust sysinfo + windows-rs Auto-Summon",
      "window-vibrancy Acrylic/Mica",
      "ProPainter / E2FGVI / DiffuEraser + SAM 2",
      "LaMa Photo Inpainting",
      "Auto-Editor + PySceneDetect + OpenTimelineIO",
      "MoviePy + WhisperX Beat-Sync",
      "3D-GPT / SceneXplain + Geometry Nodes",
      "OpenAdapt + OmniParser + Action-History Listener",
      "PyIQA + Render-Preview Loop",
      "Aseprite API / Libresprite / Photoshop 1x1 Pixel Grid",
      "MagicaVoxel / Goxel",
      "Infinigen / AmbientCG / Godot MCP / Unreal Python",
    ],
    executionTarget: "tauri_desktop_hud",
    description: "Context-aware native HUD, full Adobe/Blender scripting, video person removal, imitation learning & procedural 3D.",
  },
];

export function getConfiguredSidecarUrl(): string | null {
  const raw = (process.env.X_ZEBRA_SIDECAR_URL || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname.toLowerCase();
    // Explicitly forbid cloud metadata endpoints even when configured
    if (host === "169.254.169.254" || host === "metadata.google.internal") return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

async function callSidecarEndpoint<T = any>(
  path: string,
  payload: unknown
): Promise<{ ok: true; data: T } | { ok: false; reason: string }> {
  const baseUrl = getConfiguredSidecarUrl();
  if (!baseUrl) {
    return {
      ok: false,
      reason: "NO_SIDECAR_CONFIGURED",
    };
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = process.env.X_ZEBRA_SIDECAR_TOKEN?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      return { ok: false, reason: `Sidecar HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, reason: err?.message || "Sidecar unreachable" };
  }
}

export async function executeRemoveBgTask(params: {
  imageUrl?: string;
  imageBase64?: string;
  model?: "rmbg-1.4" | "birefnet" | "imgly-webgpu";
}) {
  if (params.imageUrl && !isSafePublicHttpUrl(params.imageUrl)) {
    return {
      ok: false,
      error: "SSRF_BLOCKED: Private, local, or invalid imageUrl rejected.",
    };
  }

  const sidecarTry = await callSidecarEndpoint("/vision/remove-bg", params);
  if (sidecarTry.ok) {
    return {
      ok: true,
      mode: "sidecar_gpu",
      engine: params.model || "BiRefNet / RMBG-1.4",
      result: sidecarTry.data,
    };
  }

  return {
    ok: true,
    mode: "browser_webgpu_slot",
    engine: "@imgly/background-removal (ONNX WebGPU / WASM)",
    sidecarStatus: sidecarTry.reason,
    clientExecutionHint: {
      library: "@imgly/background-removal",
      helperSymbol: "removeImageBackgroundLocal",
      supportsZeroCostBrowserCutout: true,
      sidecarPipeline: "pip install rembg transformers torch && rembg i input.png output.png",
    },
  };
}

export async function fetchThreeDAssetsCatalog(params: {
  query?: string;
  type?: "models" | "textures" | "hdris";
  limit?: number;
}) {
  const q = (params.query || "").trim();
  const assetType = params.type || "models";
  const poly = await queryPublicApiHub({
    category: "polyhaven_3d",
    query: q ? `${assetType}:${q}` : assetType,
    limit: params.limit || 12,
  });

  const openversePngs = q
    ? await queryPublicApiHub({
        category: "openverse_media",
        query: `${q} transparent png`,
        limit: 6,
      })
    : null;

  return {
    ok: poly.ok,
    source: "PolyHaven Open API + Openverse CC Assets",
    assetType,
    assets: (poly.data as any)?.items || [],
    pngReferences: (openversePngs?.data as any)?.results || [],
    error: poly.ok ? undefined : poly.error,
  };
}

export async function executeThreeDGenerateTask(params: {
  prompt?: string;
  imageUrl?: string;
  format?: "glb" | "fbx" | "blend";
  targetPath?: string;
}) {
  if (params.targetPath) {
    assertPosCoreImmutable(params.targetPath);
  }
  if (params.imageUrl && !isSafePublicHttpUrl(params.imageUrl)) {
    return {
      ok: false,
      error: "SSRF_BLOCKED: Private or invalid imageUrl rejected.",
    };
  }

  const sidecarTry = await callSidecarEndpoint("/3d/generate", params);
  if (sidecarTry.ok) {
    return {
      ok: true,
      mode: "sidecar_gpu",
      engine: "TripoSR / InstantMesh + glTF-Transform",
      result: sidecarTry.data,
    };
  }

  const matchedCatalog = await fetchThreeDAssetsCatalog({
    query: params.prompt || "furniture",
    type: "models",
    limit: 6,
  });

  const format = params.format || "glb";
  return {
    ok: true,
    mode: "procedural_blender_and_catalog",
    engine: "PolyHaven Open Catalog + Blender bpy Generator (Sidecar TripoSR ready)",
    sidecarStatus: sidecarTry.reason,
    matchedReadyModels: matchedCatalog.assets,
    blenderBpyStarter: [
      "import bpy, bmesh",
      "# Clean scene for X x Zebra 3D Hub generation",
      "bpy.ops.wm.read_factory_settings(use_empty=True)",
      "bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.0)",
      "obj = bpy.context.active_object",
      `# Export ready target: .${format}`,
      format === "glb"
        ? "bpy.ops.export_scene.gltf(filepath='output_xzebra.glb', export_format='GLB')"
        : format === "fbx"
        ? "bpy.ops.export_scene.fbx(filepath='output_xzebra.fbx')"
        : "bpy.ops.wm.save_as_mainfile(filepath='output_xzebra.blend')",
    ].join("\n"),
  };
}

export async function executeAudioTranscribeTask(params: {
  audioBuffer?: Buffer;
  mimeType?: string;
  mediaUrl?: string;
  language?: string;
}) {
  if (params.mediaUrl && !isSafePublicHttpUrl(params.mediaUrl)) {
    return {
      ok: false,
      error: "SSRF_BLOCKED: Private or invalid mediaUrl rejected.",
    };
  }

  if (params.mediaUrl) {
    const sidecarTry = await callSidecarEndpoint("/audio/transcribe", {
      mediaUrl: params.mediaUrl,
      language: params.language,
    });
    if (sidecarTry.ok) {
      return {
        ok: true,
        mode: "sidecar_faster_whisper_ytdlp",
        engine: "Faster-Whisper / WhisperX + yt-dlp",
        result: sidecarTry.data,
      };
    }
    return {
      ok: true,
      mode: "sidecar_worker_required_for_url",
      engine: "yt-dlp + Faster-Whisper + whisper-timestamped",
      sidecarStatus: sidecarTry.reason,
      commandTemplate: `yt-dlp -x --audio-format mp3 "${params.mediaUrl}" -o audio.mp3 && whisperx audio.mp3 --model large-v3`,
    };
  }

  if (params.audioBuffer && params.audioBuffer.byteLength > 0) {
    const cloudResult = await transcribeAudioBuffer({
      buffer: params.audioBuffer,
      mimeType: params.mimeType || "audio/webm",
    });
    return {
      ok: true,
      mode: cloudResult.fallback ? "client_web_speech_fallback" : "zebra_vision_whisper_api",
      engine: cloudResult.engine || "HEYUKA Multilingual Whisper",
      text: cloudResult.text,
      fallback: Boolean(cloudResult.fallback),
      message: cloudResult.message,
    };
  }

  return {
    ok: false,
    error: "Provide either multipart audio 'file' or public 'mediaUrl'.",
  };
}

export async function executeAudioSeparateTask(params: {
  mediaUrl?: string;
  stems?: "2stems" | "4stems";
}) {
  if (params.mediaUrl && !isSafePublicHttpUrl(params.mediaUrl)) {
    return {
      ok: false,
      error: "SSRF_BLOCKED: Private or invalid mediaUrl rejected.",
    };
  }

  const stems = params.stems || "2stems";
  const sidecarTry = await callSidecarEndpoint("/audio/separate", {
    mediaUrl: params.mediaUrl,
    stems,
  });
  if (sidecarTry.ok) {
    return {
      ok: true,
      mode: "sidecar_demucs_gpu",
      engine: "Demucs (Meta htdemucs) + UVR5 + FFmpeg",
      stems,
      result: sidecarTry.data,
    };
  }

  return {
    ok: true,
    mode: "sidecar_worker_required",
    engine: "Meta Demucs (htdemucs) / UVR5 + FFmpeg",
    sidecarStatus: sidecarTry.reason,
    stems,
    pipelineSpec: {
      twoStemsFlag: stems === "2stems" ? "--two-stems=vocals" : "",
      command: `demucs -n htdemucs ${stems === "2stems" ? "--two-stems=vocals " : ""}input_audio.mp3 && ffmpeg -i separated/htdemucs/input_audio/vocals.wav vocals.mp3`,
    },
  };
}
