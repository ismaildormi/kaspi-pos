---
name: three-gpu-companions
description: Interactive 3D WebGL2/GPGPU volumetric fur simulation, 32 companion character accessories, Elemental Titans, and PBR/GLB scene workflows.
domain: 3d
version: 1.0.0
tags: [3d, webgl2, glb, textures, blender, characters]
---

# 3D Scenes & Companion Physics Skill (3D Domain)

## Level 2 Instructions (Loaded On-Demand)
1. Render 3D companions dynamically on client-only routes (`/heyuka`, `/zebra-x`) via `FluffCreature` and `createGPUFurSystem`.
2. Keep Three.js assets isolated from synchronous POS transaction routes (`assertPosCoreImmutable`).
3. For external 3D catalog queries or scene starter scripts, dispatch `/api/v1/3d/assets` or `/api/v1/3d/generate`.
4. Always dispose WebGL renderers, targets, and DOM overlays on component unmount.
