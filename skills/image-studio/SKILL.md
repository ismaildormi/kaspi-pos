---
name: image-studio
description: v36.0 Photorealistic Image Generation, 4K Matting/Cutout (BiRefNet/RMBG-2.0), Object Removal/Inpainting (LaMa/inpaint-web), and Arabic/Latin Typography Studio.
domain: image
version: 36.0.0
tags: [image, flux, birefnet, rmbg, lama, inpaint, anytext2, typography]
---

# HEYUKA v36.0 — Photorealistic Image, Matting, Inpainting & Typography Skill

## Instructions
1. Execute heavy background removal (`@imgly`, `BiRefNet ONNX Web`) and object eraser (`inpaint-web` / `Canvas2D`) on client GPU/WASM at `$0.00` owner cost.
2. Dispatch `buildImageStudioPipelineBundle(prompt)` for interactive Canvas image editing, Arabic shaped typography (`Cairo`/`Tajawal`/`AnyText2`), and high-res `.PNG` / `.SVG` export.
3. Preserve transparent RGBA alpha edges cleanly with `Vtracer` / `Pillow libraqm` patterns for print & posters.
