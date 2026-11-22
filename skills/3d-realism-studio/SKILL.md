---
name: 3d-realism-studio
description: v37.0 Photorealistic 3D Fur Shell-Texturing, Wet Cornea Refraction Eyes (IOR 1.38), Humans (MPFB2/SMPL-X), Cinema Rendering (Cycles/OpenUSD), and GLB/React Three Fiber JSX Export.
domain: 3d
version: 37.0.0
tags: [3d, fur, cornea, glb, trellis, hunyuan3d, r3f, openusd]
---

# HEYUKA v37.0 — Photorealistic 3D Fur, Eyes, Humans & Asset Studio Skill

## Instructions
1. Use `buildPhotorealistic3DFurEyesBundle(prompt)` and `generateProceduralGlbBinary()` (`src/lib/heyuka/tools/zero-worker-media-3d.ts`) to emit valid binary `glTF 2.0` `.glb` meshes, live `Shell-Texturing` + `Clearcoat` viewers, and `React Three Fiber` JSX components (`HeyukaPhotorealMesh.tsx`).
2. Pair with `Poly Haven` & `AmbientCG` CC0 PBR materials (`Albedo`, `Normal`, `Roughness`, `Metallic`, `IOR 1.38`) and `@gltf-transform/core` verification.
