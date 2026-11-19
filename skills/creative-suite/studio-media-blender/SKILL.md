---
name: studio-media-blender
description: Studio image diffusion, transparent PNG cutouts, Adobe/Blender creative workflows, speech transcription, and audio stem separation.
domain: creative-suite
version: 1.0.0
tags: [images, background-removal, audio, transcribe, stems]
---

# Studio Media, Image & Audio Skill (Creative Suite Domain)

## Level 2 Instructions (Loaded On-Demand)
1. For generating visuals, invoke `generateProductImage` and preserve the returned `[KASPI_IMAGE:...]` marker verbatim.
2. For web reference photos, use `searchWebImages` prior to synthesis.
3. For programmatic background removal, transcription, or audio stems via developer APIs, call `/api/v1/vision/remove-bg`, `/api/v1/audio/transcribe`, or `/api/v1/audio/separate`.
4. Ensure temporary canvas/WASM buffers are registered with `wasm-watchdog` and released immediately after execution.
