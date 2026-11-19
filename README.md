<div align="center">

# HEYUKA (`Yuka`) — Autonomous Multimodal AI & Desktop Companion Engine

**Owned & Engineered by KASPI** • Sovereign Reasoning • 3-Tier Progressive `SKILL.md` Architecture • Persistent Cowork Sessions • Real-Time 3D Companions

[![Live Web Portal](https://img.shields.io/badge/Live%20Portal-kaspi--pos.vercel.app-10b981?style=for-the-badge)](https://kaspi-pos.vercel.app)
[![Developer API Studio](https://img.shields.io/badge/API%20Keys%20%26%20Console-%2Fzebra--x-0f172a?style=for-the-badge)](https://kaspi-pos.vercel.app/en/zebra-x)
[![HEYUKA 3D & Desktop](https://img.shields.io/badge/HEYUKA%20Desktop-%2Fheyuka-059669?style=for-the-badge)](https://kaspi-pos.vercel.app/en/heyuka)
[![OpenAPI 3.1](https://img.shields.io/badge/Spec-OpenAPI%203.1-38bdf8?style=for-the-badge)](https://kaspi-pos.vercel.app/api/v1/zebra-x/openapi)
[![Skills Standard](https://img.shields.io/badge/Standard-Agent%20Skills%20(SKILL.md)-f59e0b?style=for-the-badge)](#3-tier-progressive-skillmd-directory)
[![POS Core Lock](https://img.shields.io/badge/KASPI%20POS-Immutable%20Core%20Lock-ef4444?style=for-the-badge)](#architecture-overview)

</div>

---

## Architecture Overview

**HEYUKA (`Yuka`)** unifies strategic reasoning (`heyuka-core`), multimodal studio intelligence (`heyuka-vision`), and full-stack orchestration (`heyuka-omni`) under a strict **Immutable POS Core Lock** that keeps deterministic KASPI POS checkout, ledger, and database schemas isolated from external AI workspaces.

```mermaid
flowchart TD
  U["User / Developer Client<br/>Web Chat • Desktop App • REST / OpenAI SDK"] --> GW["Unified HEYUKA Gateway (/api/v1/*)<br/>hk-live / yk-live / zx-live + X-API-Key-Id"]

  GW --> CORE["HEYUKA-Core & Omni<br/>Multilingual Reasoning, Finance, Web & Code"]
  GW --> VISION["HEYUKA-Vision & 3D Studio<br/>32 WebGL2 Characters, Images, Cutouts, Audio, 3D"]

  CORE --> HYGIENE["Context Hygiene & Cowork Engine<br/>Persistent Checkpoints • Auto-Compaction • Plan Mode • Sub-Agents"]
  CORE --> SKILLS["3-Tier Progressive SKILL.md Vault<br/>Level 1 Index (~50t) → Level 2 Body → Level 3 Execute & Release"]
  CORE --> HUNTER["Autonomous Tool Hunter & Catalog Indexer<br/>Big-Tech Orgs • Frontier Video/Audio/Dev Index • Sandbox Verify"]

  VISION --> CANVAS["Authentic Three.js Fur & Companion Engine<br/>FluffCreature • 54 Accessories • Elemental Shaders"]
  CORE -. "Strict Read/Plan Only • Blocked from Mutation" .-> POS["KASPI POS Deterministic Core<br/>POS Checkout • Prisma Schema • Financial Ledger"]
```

---

## 3-Tier Progressive `SKILL.md` Directory

Compatible with `agentskills.io`, **Anthropic Agent Skills**, **Fabric Patterns**, and **OpenSkills**: only ~50 tokens of YAML Frontmatter (`name` + `description`) are indexed per turn; complete instructions (`SKILL.md`) load lazily on demand.

| Domain Folder | Skill ID | Focus Area & Capabilities | Link |
| :--- | :--- | :--- | :--- |
| `skills/commerce/` | `pos-retail-analytics` | Retail metrics, MAD/VAT finance, stock velocity & receipts | [`SKILL.md`](skills/commerce/pos-retail-analytics/SKILL.md) |
| `skills/creative-suite/` | `studio-media-blender` | Studio imagery, transparent cutouts, audio transcription & stems | [`SKILL.md`](skills/creative-suite/studio-media-blender/SKILL.md) |
| `skills/3d/` | `three-gpu-companions` | 32 Three.js 3D companions, fur physics & GLB/PBR pipelines | [`SKILL.md`](skills/3d/three-gpu-companions/SKILL.md) |
| `skills/web/` | `unrestricted-research-apis` | Zero-key public APIs, cyber threat feeds & SSRF-safe web research | [`SKILL.md`](skills/web/unrestricted-research-apis/SKILL.md) |
| `skills/science/` | `math-physics-agro-health` | Symbolic math, solar/Hijri astronomy & biomedical/agri datasets | [`SKILL.md`](skills/science/math-physics-agro-health/SKILL.md) |
| `skills/document-factory/` | `pdf-docx-xlsx-pptx` | Arabic RTL & FR/EN PDF, Word, Excel, PowerPoint & Mermaid export | [`SKILL.md`](skills/document-factory/pdf-docx-xlsx-pptx/SKILL.md) |
| `skills/engineering/` | `code-sandbox-audit` | Polyglot isolated sandbox execution, self-discovery & AST safety | [`SKILL.md`](skills/engineering/code-sandbox-audit/SKILL.md) |

---

## Key Capabilities (`v12.1` – `v14.0`)

| Module | Capability | Core Location |
| :--- | :--- | :--- |
| **Developer API Keys (`IPK`) & Key IDs** | Cryptographically unique `hk-live-` / `yk-live-` / `zx-live-` bearer keys + `hk_`/`yk_` Key IDs, SHA-256 at rest, scoped enforcement, real usage tracking | `src/lib/zebra-x/api-auth.ts` |
| **Persistent Cowork Sessions** | Saved Dexie checkpoints (`CoworkSessionState`), Live Task Checklist (`[✓]` / `[⏳]`), Browser Workspace Folder inspection (`File System Access API`), Plan Mode | `src/lib/zebra-x/core/cowork-session.ts` |
| **Context Hygiene Engine** | `YUKA.md` root constitution, hierarchical domain context, auto-compaction, stale tool output pruning, clarification gate & dynamic tool masking | `src/lib/zebra-x/core/cowork-session.ts` & `router.ts` |
| **Progressive `SKILL.md` Vault** | 3-tier `SKILL.md` loader, auto-skill authoring after complex wins, `.yuka-skill` export & GitHub skill indexers | `src/lib/zebra-x/core/skills-vault.ts` |
| **Autonomous Tool Hunter & Frontier Catalogs** | Zero-key discovery via GitHub/NPM/HuggingFace, Big-Tech org indexers (Microsoft, Google, Meta, xAI, NVIDIA, Cloudflare) & Video/Music/Audio/Dev studio registry | `src/lib/zebra-x/core/catalog-hunter.ts` |
| **10-Layer Production Shield & Zero-Worker WASM (`v15.3–v15.4`)** | `/tmp` Ephemeral Storage (`EROFS`-safe), 3-Tier Circuit-Breaker Fetch (`/api/proxy/fetch`), Magic-Byte Artifact Gate (`%PDF-`, `glTF`, `PK`), Real Binary `.glb` (`GLTFExporter` + `@gltf-transform/core`), Single-Thread `@ffmpeg/ffmpeg` & `fflate` Compression | `src/lib/heyuka/shield/` & `src/lib/heyuka/tools/zero-worker-media-3d.ts` |
| **Planetary Edge, Polyglot & First-Shot Engine (`v16.0–v19.0`)** | Edge-First + Local-First `Yjs` CRDT sync targeting `100M+` concurrent scale (`99.999%` failover), Auto-Geo & Dialect ID (`1,100+` languages, `MADAR`/`GlotLID` patterns), Cascading `$0.00` Micro-Router, `BM25` + `ColBERT` late-interaction reranker, Formal Accounting Verifier & Automated Multi-OS CI Releases (`.exe/.msi`, `.dmg`, `.AppImage`, `.apk`, unsigned `.ipa`) | `src/lib/heyuka/planetary/` & `.github/workflows/release-all-binaries.yml` |
| **Authentic 3D Companions** | Pure Three.js multi-shell volumetric fur + 54 accessories + Elemental Fire/Ice/Rock shaders + interactive 32-character showcase + `webglcontextlost` recovery | `src/lib/heyuka/engine/` |
| **Interactive Onboarding Stages** | 4-stage visual Download & Integration Walkthrough modal (`Windows` / `macOS` / `Linux` / `Node.js` / `Python` / `cURL`) | `src/components/heyuka/HEYUKAInstallWalkthrough.tsx` |

---

## 1-Click Quickstart & API Integration

### 1. Issue Your Unique Key & Key ID
1. Visit the **Developer Portal**: [https://kaspi-pos.vercel.app/en/zebra-x](https://kaspi-pos.vercel.app/en/zebra-x)
2. Click **Create secret key** to issue a unique **`Secret API Key`** (`hk-live-...` or `yk-live-...`) and verifiable **`Key ID`** (`hk_...` / `yk_...`).

### 2. Connect with cURL
```bash
curl -X POST "https://kaspi-pos.vercel.app/api/v1/chat/completions" \
  -H "Authorization: Bearer hk-live-YOUR_UNIQUE_SECRET_KEY" \
  -H "X-API-Key-Id: hk_YOUR_KEY_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "heyuka-omni",
    "enableTools": true,
    "messages": [
      { "role": "user", "content": "Summarize global EUR to MAD rates and security advisories." }
    ]
  }'
```

### 3. Connect with Node.js / TypeScript (OpenAI SDK Compatible)
```ts
import OpenAI from "openai";

const heyuka = new OpenAI({
  apiKey: process.env.HEYUKA_API_KEY,
  baseURL: "https://kaspi-pos.vercel.app/api/v1",
  defaultHeaders: {
    "X-API-Key-Id": process.env.HEYUKA_KEY_ID || "",
  },
});

const completion = await heyuka.chat.completions.create({
  model: "heyuka-omni",
  messages: [{ role: "user", content: "Generate a technical architecture checklist." }],
});
console.log(completion.choices[0].message.content);
```

### 4. Connect with Python (OpenAI SDK Compatible)
```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["HEYUKA_API_KEY"],
    base_url="https://kaspi-pos.vercel.app/api/v1",
    default_headers={"X-API-Key-Id": os.environ.get("HEYUKA_KEY_ID", "")},
)

res = client.chat.completions.create(
    model="heyuka-omni",
    messages=[{"role": "user", "content": "Compute quarterly tax projections cleanly."}],
)
print(res.choices[0].message.content)
```

---

## REST Endpoints Overview

| Method | Endpoint | Purpose | Auth Scope |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/models` | List available HEYUKA models (`heyuka-omni`, `heyuka-core`, `heyuka-vision`) | Public |
| `POST` | `/api/v1/chat/completions` | OpenAI-compatible Chat Completions (JSON or SSE stream) with tools | `chat:universal` |
| `POST` | `/api/v1/public-apis` | Query normalized global FX, weather, science, transit & cyber threat feeds | `public-apis:query` |
| `POST` | `/api/v1/sandbox/execute` | Isolated polyglot code sandbox (`python`, `javascript`, `typescript`, `go`, `php`, `c++`, `bash`) | `sandbox:execute` |
| `POST` | `/api/v1/web/research` | Open web search and SSRF-safe public URL extraction | `web:research` |
| `POST` | `/api/v1/images/generate` | Studio image generation & curated media lookup | `images:generate` |
| `POST` | `/api/v1/vision/remove-bg` | High-precision transparent PNG foreground extraction | `vision:remove-bg` |
| `GET`/`POST` | `/api/v1/3d/assets`, `/api/v1/3d/generate` | 3D catalog lookup & mesh pipeline triggers | `3d:assets` / `3d:generate` |
| `POST` | `/api/v1/audio/transcribe`, `/api/v1/audio/separate` | Multilingual speech transcription & vocal/instrumental separation | `audio:transcribe` / `audio:separate` |

For detailed system blueprints and module inventories, see [`YUKA.md`](YUKA.md), [`YUKA_MASTER_HUB.md`](YUKA_MASTER_HUB.md), and [`HEYUKA_MASTER_ARSENAL_AND_BLUEPRINT.md`](HEYUKA_MASTER_ARSENAL_AND_BLUEPRINT.md).
