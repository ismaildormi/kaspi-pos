# HEYUKA AI — Next Engineering Priorities (`v114.0+`)

Based strictly on the verified `v113.0` repository state (`2cdb74e`), the highest-priority next tasks are:

1. **P1 — Sovereign Model Weight Training & Holdout Benchmarking (`HEYUKA Omni / Core / Vision`):**
   - *Why:* Standalone sovereign checkpoint currently scores `11/25 (44%)` vs `24/25 (96%)` orchestrated.
   - *Target Files:* `training/sovereign_models/train_grpo_dpo_sovereign.py`, `benchmarks/v111/independent-25cat-benchmark.json`.
   - *Goal:* Run GPU fine-tuning on clean, non-contaminated datasets (keeping train/val/test strictly separated) and benchmark the resulting checkpoint against the same 25-category holdout suite.

2. **P2 — Scheduled Continuous Discovery & Stale-Source Rechecking (`16` Degraded Sources):**
   - *Why:* `internet-discovery-engine.ts` currently runs on-demand (`18` new sources found in latest run) and `16` catalog entries showed transient `DEGRADED` status.
   - *Target Files:* `src/lib/heyuka/frontier/internet-discovery-engine.ts`, `.github/workflows/eternal-public-study-loop.yml`, `benchmarks/v113/discovery-state.json`.
   - *Goal:* Wire incremental discovery + automatic retry/mirror promotion for `DEGRADED` sources into a scheduled API/CI loop.

3. **P3 — Live Video / Audio / Image End-to-End Media Worker Verification:**
   - *Why:* Deterministic PDF/XLSX/DOCX/PKZIP/GLB generation is verified, while native `ffmpeg` video/audio rendering depends on client WASM or an optional external media worker.
   - *Target Files:* `src/lib/heyuka/tools/zero-worker-media-3d.ts`, `src/lib/heyuka/ecosystem/products-catalog.ts`.
   - *Goal:* Add automated browser/WASM or CI-worker verification for `.webm`/`.wav`/`.png` pipelines.

4. **P4 — Production Deployment & Hardware Smoke Verification:**
   - *Goal:* Verify Vercel deployment of `2cdb74e` + `e6dbef3` (Geo-IP locale, OTP password reset, owner-only Studio gating, billing branch topology) and test physical TPE/printer attachment on Windows when hardware is available.
