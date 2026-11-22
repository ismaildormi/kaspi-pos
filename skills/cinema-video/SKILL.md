---
name: cinema-video
description: v34.0 Photorealistic Long-Horizon Cinema Video generation pipeline using SkyReels-V2, FramePack, Self-Forcing, Detail-Daemon, Google FILM, IC-Light V2, OpenColorIO ACES, MMAudio, OpenTimelineIO, ConsisID, and SVT-AV1.
domain: video
version: 34.0.0
tags: [video, cinema, skyreels, mmaudio, opentimelineio, acesulfx, long-video]
---

# HEYUKA v34.0 — Photorealistic & Ultra-Long AI Cinema Video Skill

## Instructions
1. Use `buildPhotorealisticCinemaVideoBundle(prompt)` (`src/lib/heyuka/tools/photorealistic-video-builder.ts`) to emit a runnable 1280x720 60fps HTML5/WebGL/WebAudio player (`heyuka-cinema-video.html`), `cinema-timeline.otio.json`, and local GPU pipeline script (`render_long_video_local.py`).
2. Chain long-horizon continuity (`SkyReels-V2` / `FramePack` / `Self-Forcing`), photorealism anti-AI grain (`Detail-Daemon` / `OpenColorIO ACES` / `35mm Film Grain`), identity locks (`ConsisID` / `PuLID`), and Foley audio (`MMAudio` / `Pyroomacoustics`).
3. Validate generated streams via `ffprobe` on local/worker GPU nodes and record quality metrics via `recordProductSelfEvolution`.
