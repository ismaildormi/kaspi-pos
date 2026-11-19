# HEYUKA AI — Multi-Product Ecosystem, Autonomous Testing Lab & Zero-Cost Architecture (v16.0 Delivery Report)

## 1. Architectural Overview (Future Glass 2050 + Modular Core)

HEYUKA AI (`/[locale]/zebra-x/*`) has been expanded from a developer API key portal into a modular multi-product AI platform built inside the existing KASPI POS repository without removing or breaking any existing POS, ERP, authentication, billing, or API capabilities.

### Key Architectural Layers
1. **Strict Zero-Cost Governance (`src/lib/heyuka/compute/zero-cost-policy.ts` + `src/lib/ai-router.ts`):**
   - Execution priority:
     1. User Device (`WebGPU`, `WASM`, `@imgly/background-removal`, `Canvas2D/MediaRecorder`)
     2. Connected User Workers (`workers-registry.ts` with explicit opt-in consent & revocable SHA-256 tokens)
     3. Tenant Encrypted BYOK (`AES-256-GCM` envelopes via `src/lib/security/integration-vault.ts`, isolated by `tenantId`)
     4. Bounded Zero-Cost Free Tier Gateways (capped per tenant/day at `120 req/day`)
   - Paid owner providers (`custom` global `SystemSetting`, `together`, `deepseek`) are **blocked** whenever `allowOwnerPaidProviders` is not explicitly `true`.

2. **Dynamic Capability Registry (`src/lib/heyuka/compute/capability-registry.ts`):**
   - Dynamically inspects runtime environment keys, zero-key catalogs (`PUBLIC_APIS_CATALOG_COUNT`), browser execution modules, and tenant-connected worker capabilities.
   - Explicitly separates statuses: `verified_live`, `browser_local_ready`, `worker_required`, and `not_yet_provisioned`.

3. **Distributed Compute Workers (`src/lib/heyuka/compute/workers-registry.ts` & `/api/v1/heyuka/workers`):**
   - SSRF-guarded public worker URL validation (`isSafePublicHttpUrl`), explicit opt-in consent enforcement, `/health` hardware telemetry inspection (reporting ONLY actually returned fields), and instant token revocation (`DELETE /api/v1/heyuka/workers?id=...`).
   - Browser telemetry probes real `navigator.gpu`, `WebAssembly`, `navigator.hardwareConcurrency`, `navigator.deviceMemory`, and `navigator.storage.estimate()`.

4. **12 Specialized AI Studios (`src/lib/heyuka/ecosystem/products-catalog.ts`):**
   - Each studio routes users to a dedicated workspace (`/[locale]/zebra-x/studios/[productId]`):
     - `3d-studio`: Interactive Three.js WebGL2 preview + PolyHaven live 3D/HDRI/texture catalog + executable Blender `bpy` scripts + Worker GLB hook.
     - `background-studio`: On-device `@imgly/background-removal` + border alpha PNG cutout with before/after preview and studio backdrop swatches.
     - `image-studio`: Zero-key studio prompt generation + Wikimedia search + browser brightness/contrast adjustment.
     - `video-studio`: 16:9 multi-scene storyboarder + real browser Canvas/MediaRecorder `.webm` encoder + honest FFmpeg Worker disclosure for cloud MP4.
     - `shorts-studio`: Distinct vertical 9:16 workflow + retention hook structuring + real `.srt` subtitle export + local 9:16 `.webm` clip recorder.
     - `coding-studio`: Multi-file explorer, line-level Diff viewer (`diff`), execution approval checkbox, execution timeline, and real Python/JS/TS/Go/Bash execution via `/api/v1/sandbox/execute` + real `.zip` export.
     - `audio-studio`: Browser mic/audio file upload transcription via `/api/v1/audio/transcribe` + Worker stem separation check.
     - `conversion-studio`: Real client-side format conversions (`CSV <-> JSON`, `SRT -> WebVTT`, `PNG <-> WEBP <-> JPEG`).
     - `data-studio`: Real CSV parser (`papaparse`), aggregate sum calculations, and `recharts` bar chart rendering.
     - `web-studio`: Multi-file HTML preview inside sandboxed `iframe` + real PKZIP download.
     - `document-studio`: Rich HTML/report composer + print/PDF export + PKZIP download.
     - `automation-studio`: SSRF-safe OpenAPI 3.1 auto-discovery tester.
   - All studios explicitly disclose that they share HEYUKA's unified intelligence engine with isolated domain system prompts, tool permissions, and workspace context (`StudioDomainChat`).

5. **Mini-Product Factory & External Website Embeds (`mini-products-store.ts`, `/zebra-x/products`, `/[locale]/embed/[productId]`, `/api/v1/heyuka/products`, `/api/v1/heyuka/widget`):**
   - Tenants can instantiate scoped domain products with custom system directives, accent color presets, pause/enable toggles, project-scoped `hk-live-...` keys, usage/error counters, and copyable `<iframe>` embed snippets.

6. **Real Output Vault & Autonomous Benchmark Lab (`output-vault.ts`, `benchmark-engine.ts`, `src/lib/heyuka/pkzip.ts`):**
   - `Real Output Vault` (`/zebra-x/vault`, `/api/v1/heyuka/outputs`) stores SHA-256 digests and provenance metadata separating `real_output`, `preview`, `example`, and `failed`.
   - `Autonomous Testing Lab` (`/zebra-x/lab`, `/api/v1/heyuka/lab`) executes real multi-category API checks without fabricating results or subjective scores (human review scores initialize `null`) and exports `HEYUKA_FULL_BENCHMARK.zip` with `COMPLETE_RESULTS.xlsx` (`exceljs`), `SUMMARY_REPORT.html`, `MANIFEST.json` (SHA-256), `TEST_LOGS/`, `API_CAPABILITIES/`, `PROMPTS/`, `ERRORS/`, `PERFORMANCE/`, and retrieved assets.

7. **Strict Separation of Apps Center vs Models Center:**
   - **Models & Capabilities Center:** `/[locale]/zebra-x/models`
   - **Apps & Download Center:** `/[locale]/zebra-x/apps` (transparently lists live Web/PWA and Windows `.bat` launcher without fake APK/IPA/compiled `.exe` download links).

---

## 2. API Reference Summary (`/api/v1/heyuka/*`)

| Endpoint | Methods | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/v1/heyuka/capabilities` | `GET`, `OPTIONS` | Optional (enriched if signed in) | Dynamic Capability Registry + Specialized Products |
| `/api/v1/heyuka/workers` | `GET`, `POST`, `DELETE`, `OPTIONS` | Session Required (`tenantId`) | Register, health-probe, list, revoke Worker Nodes |
| `/api/v1/heyuka/byok` | `GET`, `POST`, `DELETE`, `OPTIONS` | Session Required (`tenantId`) | Encrypt (`AES-256-GCM`), list, delete Tenant BYOK keys & view daily free quota |
| `/api/v1/heyuka/products` | `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS` | Session Required (`tenantId`) | Manage Tenant Custom Mini-Products & issue scoped keys |
| `/api/v1/heyuka/widget` | `GET`, `POST`, `OPTIONS` | Public Embed (`widgetId`) | Render & execute enabled embedded mini-product widgets |
| `/api/v1/heyuka/outputs` | `GET`, `POST`, `DELETE`, `OPTIONS` | Session Required (`tenantId`) | Manage Real Output Vault artifacts & download ZIP |
| `/api/v1/heyuka/lab` | `GET`, `POST`, `PATCH`, `OPTIONS` | Session Required (`tenantId`) | Execute live benchmarks, save human ratings, export ZIP/XLSX |
| `/api/v1/heyuka/studio-chat` | `POST`, `OPTIONS` | Session Required (`tenantId`) | Domain-isolated studio chat & Command Center intent recommendations |

---

## 3. Ready vs Worker-Required / Unfinished Features (Honest Audit)

### Production-Ready Now
- Multi-page Future Glass 2050 Console (`/zebra-x/*`) supporting Pearl Light, Fjord Twilight, configurable accent tints, Arabic (RTL), French, and English.
- Zero-cost policy guard + Tenant AES-256-GCM BYOK encryption + Cross-tenant isolation across keys, mini-products, workers, outputs, and benchmark runs.
- Live API Chat Completions, 7-point Live Debugger, Code Sandbox (Python/JS/TS/Bash/PHP/Go/C++), Live FX/Public APIs, Image Diffusion URLs, on-device ONNX Background Removal, browser WebM Canvas composition, SRT/VTT conversion, CSV analytics/charts, Web iframe sandbox, and real PKZIP + ExcelJS benchmark exports.

### Worker-Required / Pending External Assets (Explicitly Marked in UI & Registry)
- **Cloud H.264 MP4 Video Transcoding (`worker_ffmpeg_video_transcode`):** No `ffmpeg` binary exists in Vercel Serverless/Linux sandbox (`NO_LOCAL_FFMPEG`). Users must connect their own Worker node with FFmpeg installed; local browser Canvas `.webm` rendering is provided in the meantime.
- **3D Binary Mesh Reconstruction (`.glb`/`.fbx`):** Endpoint returns live PolyHaven catalog assets + executable Blender `bpy` scripts cleanly without faking binary 3D files unless a user GPU Worker is connected.
- **Audio Vocal Stem Separation (`Demucs`):** Explicitly requires a connected user Worker (`worker_required`).
- **Compiled Standalone Desktop Installers (`.exe`, `.dmg`, `.AppImage`) & Mobile Binaries (`APK`, `IPA`):** Source wrappers exist (`src-tauri/`, `apps/heyuka-desktop/`), while compiled release binaries are not yet published (legacy `public/downloads/kaspi-pos-setup.exe` 41-byte stub is ignored cleanly and never surfaced as a fake download inside HEYUKA Apps Center).
- **Tauri Rust `cargo check` on Linux Sandbox:** Blocked by missing OS GTK/WebKit dev libraries (`pkg-config`, `gdk-3.0`, `libsoup-3.0`), while Windows MSVC CI handles Tauri bundle compilation per `src-tauri/Cargo.toml`.

---

## 4. Security & Financial Protection Guarantee
1. **Secret Hygiene:** All developer API keys are stored strictly as SHA-256 hashes; tenant BYOK provider keys and worker tokens are encrypted via per-tenant scrypt-derived `AES-256-GCM` envelopes; public listings return only masked hints (`...xxxx`).
2. **SSRF & Sandbox Protections:** Outbound Web Research, Auto-Connect OpenAPI probes, Media image proxy, and Worker registration enforce `isSafePublicHttpUrl` blocking loopback/RFC1918/link-local cloud metadata (`169.254.169.254`).
3. **Owner Zero-Cost Guarantee:** `evaluateZeroCostPolicy` and `getRouterCandidates({ allowOwnerPaidProviders: false })` ensure third-party user API/studio/lab calls cannot fall back onto paid owner credentials (`together`, `deepseek`, global `SystemSetting`) and enforce bounded daily free quotas.
