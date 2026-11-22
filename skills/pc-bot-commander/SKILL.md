---
name: pc-bot-commander
description: v52.0 Full PC Keyboard/Mouse Hardware ScanCode Control (pynput/PyDirectInput/Enigo/AutoHotkey), Multi-Desktop Autonomous Bot Farm (KasmVNC/Neko/Webtop), Live Screen Sight (DXcam/OmniParser/SoM), and System Audio Hearing (WASAPI/PipeWire).
domain: desktop-bots
version: 52.0.0
tags: [keyboard, mouse, pynput, kasmvnc, neko, omniparser, wasapi, desktop-bots]
---

# HEYUKA v52.0 — PC Control & Multi-Desktop Bot Farm Commander Skill

## Instructions
1. Route virtual desktop & hardware input tasks strictly through `/api/v1/desktops/spawn` and `src/lib/heyuka/os/sovereign-pc-commander.ts` + `apps/heyuka-desktop/backend/agent_server.py`.
2. Isolate autonomous bots in virtual desktop containers (`KasmVNC` / `Neko WebRTC` / `Webtop`) so the user's primary display stays uninterrupted, with 1-click Take-Over (`Esc+Esc` Panic Stop ready at 0ms).
3. Ground visual targeting via `OmniParser-V2` + `Set-of-Mark (SoM)` overlays and pair with `WASAPI / PipeWire` system audio transcripts.
