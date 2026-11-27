# HEYUKA AI — Current Verified Technical Architecture (`v113.0`)

## 1. Application & Runtime Stack
- **Web & API Framework:** Next.js `15.5.28` App Router (`81` compiled pages & API routes; `tsc --noEmit` = `0` errors; `next build` = exit `0`).
- **Database & Persistence:** PostgreSQL 16 (Neon.tech `eu-central-1` pooler) via Prisma (`prisma/schema.prisma`, `1,521` LOC) + 3-tier durable state (`SystemSetting` DB -> `/tmp/heyuka-vault/durable-state-v110.json` -> L1 RAM cache).
- **Desktop Hardware Shell:** Tauri v2 (`src-tauri/`, Rust `x86_64-pc-windows-msvc`, `cargo check` = `0` errors, `0` warnings).

## 2. Core HEYUKA Intelligence Modules (`src/lib/heyuka/` & `src/lib/zebra-x/`)
- **Orchestrator:** `src/lib/heyuka/frontier/frontier-intelligence-orchestrator.ts` (4 execution modes: `FAST_MODE`, `REASONING_MODE`, `DEEP_RESEARCH_MODE`, `AUTONOMOUS_EXECUTION_MODE`; V8 `vm` code verifier, `Decimal.js` math adjudicator, MCTS PUCT reasoner, 10-specialist council).
- **Model Capability Registry & Provider Adapters:** `src/lib/heyuka/frontier/model-capability-registry.ts` & `frontier-provider-adapters.ts` (tracks `documentedCapabilities`, `empiricalVerification`, and `benchmarkEvidence`; separates owned checkpoint from external APIs).
- **Multi-Gateway Router:** `src/lib/ai-router.ts` & `src/lib/heyuka/compute/hf-token-pool.ts` (supports local Ollama/vLLM, tenant BYOK, Groq, OpenRouter, Gemini, Mistral, GitHub Models, Cerebras, SambaNova, HuggingFace Inference, and zero-key `runLocalOnDeviceHeyukaBrain()` fallback).
- **Unified Source-to-Memory Fabric & Relationship Graph:** `src/lib/heyuka/frontier/unified-source-memory-fabric.ts` (deduplicates `2,810` raw entries into `2,280` canonical sources, enriches with license/IO/OS/hardware metadata, routes results to 7-layer persistent memory, fuses across Omni/Core/Vision, and builds `270` typed compatibility edges).
- **Continuous Internet Discovery:** `src/lib/heyuka/frontier/internet-discovery-engine.ts` (SSRF-safe incremental discovery across HuggingFace Hub, GitHub Search API, OpenAlex, and npm Registry).
- **Confidentiality & Security Shield:** `src/lib/heyuka/frontier/confidentiality-guard.ts`, `src/lib/zebra-x/omega/secret9_cyber_immune.ts`, `src/middleware.ts` (CVE-2025-29927 + WAF/IPS + Geo-IP locale detection).
- **User Chat & Owner-Only Studio Separation:**
  - Public/Merchant Chat: `src/app/api/v1/heyuka/chat-web/route.ts` + `src/components/heyuka/HeyukaChatWorkspace.tsx` + `src/components/ai/AIChatWidget.tsx` (emits only clean cognitive thinking steps; redacts `vault://`, source counts, workspace paths, and keys).
  - Owner-Only Studio/Platform: `src/components/layout/Sidebar.tsx` gates `HEYUKA Studio`, `HEYUKA Platform`, and `KASPI POS Studio` to `isSuperAdmin === true`.
