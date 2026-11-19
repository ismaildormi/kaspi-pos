# @x-zebra/sdk

Official zero-dependency TypeScript/JavaScript SDK for the **X × Zebra AI Platform Portal** (`X-Core` & `Zebra-Vision`).

## Installation / Copy-In
Drop `packages/x-zebra-sdk/index.ts` into any React, Next.js, or Node.js app (or build with any TypeScript toolchain) and pass your `zx-live-...` API key generated at `/zebra-x`.

## Quickstart
```ts
import { XZebraClient } from "./packages/x-zebra-sdk";

const xz = new XZebraClient({
  apiKey: process.env.X_ZEBRA_API_KEY!,
  baseUrl: "https://kaspi-pos.vercel.app",
});

// 1. Browse free PolyHaven + Openverse 3D/PNG assets for Blender
const assets = await xz.threeD.listAssets({ q: "chair", type: "models" });

// 2. Remove background / invoke GPU BiRefNet or browser WebGPU cutout hint
const cutout = await xz.vision.removeBackground({ imageUrl: "https://example.com/product.jpg" });

// 3. Generate Blender bpy / TripoSR 3D output
const model3d = await xz.threeD.generate({ prompt: "modern minimalist lamp", format: "glb" });

// 4. Transcribe audio/video via Faster-Whisper / Whisper-Turbo
const transcript = await xz.audio.transcribeUrl({ mediaUrl: "https://example.com/talk.mp3", language: "ar" });

// 5. Separate vocals vs music stems via Demucs / UVR5 Sidecar
const stems = await xz.audio.separate({ mediaUrl: "https://example.com/song.mp3", stems: "2stems" });
```

## Optional Local Background Daemon Standards
When deploying `x-zebra-node` / desktop Sidecar workers as a local system service, always use explicit user opt-in during installation and register a standard OS-native uninstaller.
