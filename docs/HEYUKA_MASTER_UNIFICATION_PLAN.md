# HEYUKA & KASPI POS — Master Unification & Unbounded Execution Blueprint (`v1.0` -> `v109.1`)

> **Generated from Direct Static & Import-Graph Audit** on `2026-11-23` across `src/lib/heyuka/` (`53` modules), `src/lib/zebra-x/` (`76` modules), `src/app/api/v1/` (`115` routes), `training/` (`14` scripts), `deploy/` (`9` infrastructure files), and `vault/vault-lock.json` (`2,795` classified entries).

---

## 1. Complete System Topology Audit & Classification

### Category (أ) — Core Active Production Modules (Wired & Serving Live)
| Subsystem | Active Files | Live Responsibility |
| :--- | :--- | :--- |
| **Multi-Gateway & 3-Model Router** | `src/lib/ai-router.ts`, `src/lib/heyuka/compute/hf-token-pool.ts` | Unified failover across free pools (Groq, Gemini, OpenRouter Vision, Mistral, GitHub Models `DeepSeek-R1`/`gpt-4o`, Cerebras, SambaNova, Hugging Face 4-token pool `zuvyrismail`, Pollinations zero-key, Ollama local compute, browser-session BYOK). Enforces `HEYUKA Omni` / `HEYUKA Core` / `HEYUKA Vision` role routing. |
| **Nervous Mesh & Cognitive Blueprint** | `src/lib/heyuka/global-nervous-mesh.ts`, `src/lib/heyuka/cognitive-frontier-blueprint.ts`, `src/lib/heyuka/unified-antigravity-cortex.ts` | Runs single unified pre/post-inference pipeline across Chat, Studio, Council, Solve-Any, and KASPI POS AI Advisor: Cyber-Immune shield, Intent->Plan->Execute->Deliver blueprint, adaptive temperature (`0.1` deterministic code/DGI tax vs `0.65` creative/strategy), deep source reading, AST/SoM/DeepDoc/Darija/DGI checks. |
| **Vault, Corpus & Cloud Radar** | `vault/vault-lock.json`, `src/lib/heyuka/vault/sovereign-permanent-vault.ts`, `src/lib/heyuka/training/knowledge-corpus-engine.ts`, `src/lib/heyuka/verified-harvest-counter.ts` | Stores and searches all `2,795` classified vault entries, live hot-synced crawl shards (`action: "hot_sync"`), compressed memory crystals, and real-time Hugging Face (`zuvyrismail/heyuka-omni-vault`), Common Crawl CDX, and GitHub Actions telemetry. |
| **Self-Awakening & Live Execution Gate** | `src/lib/heyuka/self-capability-awakening.ts`, `src/app/api/v1/cognition/awaken-and-test/route.ts` | Executes `8` hands-on probes (Code Sandbox, Morocco CGI Art. 145 TVA/Timbre, OS-Scale AST/Zero-Stub, EOQ & Nash BATNA, Solar PV, Zero-Trust MCP Guard, Sovereign Seed Crystal Round-Trip, Radar & 120-Shard Swarm Mesh) and persists verified proof directly into Studied Corpus. |
| **Live Production Endpoints & UI** | `src/app/api/v1/heyuka/chat-web/route.ts`, `src/app/api/ai/chat/route.ts`, `src/app/api/v1/studio/council/route.ts`, `src/app/api/v1/studio/ingest/route.ts`, `src/app/api/v1/dominance/solve-any/route.ts`, `src/components/studio/HeyukaUnifiedStudioWorkspace.tsx` | All interactive user surfaces consuming unified `runUnifiedFullPowerPipeline`, emitting NDJSON keep-alives, streaming Power Proof telemetry badges, and supporting session-only BYOK keys + Async Deep-Job execution. |
| **Distributed Swarm & Sovereign Model Factory** | `training/crawler/*.py`, `training/sync/auto_distributed_memory_sync.py`, `training/sovereign_models/merge_heyuka_flagship.py`, `training/sovereign_models/train_grpo_dpo_sovereign.py`, `deploy/swarm-nodes/*` | `20x` GitHub Actions matrix + `120`-shard P2P/Cloudflare/HF template swarm, automated Nervous Mesh hot-sync, MergeKit (`dare_ties`, `slerp`, `mixtral_moe`) configs for `zuvyrismail/heyuka-*`, and Kaggle 2xT4 Unsloth SFT/DPO/GRPO trainer. |

### Category (ب) — Previously Isolated Modules Newly Wired Directly in `v109.1`
Prior to `v109.1`, our automated import-graph audit identified functional modules present in tests or standalone catalogs without live runtime wiring:
1. **`src/lib/zebra-x/tools/bot-factory-engine.ts`** (`compileCustomBotBlueprint`, `buildAutonomousSeoBundle`) -> Wired directly into `global-nervous-mesh.ts` & `unified-antigravity-cortex.ts` toolkit (`botFactoryPlan`) so WhatsApp/Telegram/SEO/bot prompts produce runnable bot architectures live.
2. **`src/lib/zebra-x/tools/mobile-diagnostics-engine.ts`** (`analyzeAndroidAdbTelemetry`, `analyzeIosIdeviceTelemetry`, `buildMobileRepairReceiptTicket`) -> Wired into `unified-antigravity-cortex.ts` live tool dispatch for mobile hardware/repair & thermal receipt queries.
3. **`src/lib/zebra-x/superpowers/`**:
   - `deep_doc_graph_rag.ts` (`parseLayoutAwareDocAndGraph`) -> Wired into `global-nervous-mesh.ts` whenever prompts include tables or structured technical docs (`DeepDocGraphRAG-v91`).
   - `vision_gui_som_operator.ts` (`indexInteractiveElementsSetOfMark`) -> Wired into `global-nervous-mesh.ts` when workspace HTML files are present (`SoM-GUI-v91`).
   - `parallel_map_reduce_swarm.ts`, `autonomous_daemon_worker.ts`, and `domain_brain_factory.ts` -> Unified behind `global-nervous-mesh.ts` / `self-capability-awakening.ts` & `/api/v1/heyuka/deep-job`.
4. **`vault/vault-lock.json` Direct Reader**: Added `readVaultLockSummary()` in `verified-harvest-counter.ts` so every `runUnifiedFullPowerPipeline` execution reflects verified lock totals (`2,795` classified entries across `v34.0`–`v100.0`) directly alongside Hugging Face (`zuvyrismail/heyuka-omni-vault`) & `/api/v1/omniscience/live-stats`.

### Category (ج) — Redundant / Transitional Helpers Consolidated
- **`src/app/api/ai/chat/route.ts` Stacked System Prompt Bloat**: Consolidated duplicate `closedLoopMasterDirective` noise under `buildCognitiveFrontierBlueprint({ compact: true })` + live `runUnifiedFullPowerPipeline` facts.
- **`src/lib/heyuka/shield/tmp-storage.ts`**: Redundant wrapper superseded cleanly by Node OS temp directory isolation (`os.tmpdir()`) in active export & shield paths (`suite-core` Layer 1 verified). Documented as legacy helper rather than duplicated in new code.
- **`src/lib/heyuka/engine/three/furShaders.ts`**: TypeScript mirror of `src/lib/heyuka/engine/furShaders.js` (`FluffCreature` WebGL path uses `furShaders.js`); retained strictly for static backwards compatibility while WebGL runtime uses the `.js` shader source.

---

## 2. Unbounded Thinking & Zero-Timeout Architecture (`v109.1`)

Before `v109.1`, multiple short runtime ceilings cut off deep reasoning (`DeepSeek-R1`, `MCTS`, full multi-source RAG) prematurely on production:
- `chat-web/route.ts` & `ai/chat/route.ts` capped `maxDuration = 60`
- `ai-router.ts` imposed `firstActivityTimer = 14s/18s` (aborting slow thinking models before first token), `failoverHorizonMs = 24s`, and `totalStreamBudgetMs = 52s` on Vercel
- `global-nervous-mesh.ts`, `council/route.ts`, and `chat-web/route.ts` had `900ms`, `1000ms`, and `1200ms` `Promise.race` cutoffs on `collectVerifiedHarvestStats()`
- `HeyukaUnifiedStudioWorkspace.tsx` aborted client reads at `62s` (`stallBudgetMs`) on Vercel

### `v109.1` Remediation Implemented:
1. **`maxDuration = 300` Across All Core AI & Swarm Routes**: Enabled on `chat-web`, `ai/chat`, `studio/council`, `studio/ingest`, `dominance/solve-any`, `cognition/awaken-and-test`, and `heyuka/deep-job`.
2. **Removed Artificial Cutoffs in Router & Mesh**:
   - Eliminated `firstActivityTimer` (`14s/18s`) abort in `streamStudioNdjsonWithRouter`.
   - Raised deep execution horizons to `285_000ms` (with infinite bypass flag `HEYUKA_UNBOUNDED_TIMEOUT=1` for self-hosted VPS/Docker), `maxContinuationHops = 16`, and raised external HTTP probe tolerance cleanly (`12s`–`45s`).
   - Removed `900ms`/`1000ms`/`1200ms` truncations on `collectVerifiedHarvestStats()` so telemetry & Hugging Face `zuvyrismail/heyuka-omni-vault` finish reading accurately.
3. **8-Second Streaming Keep-Alive Heartbeats (`NDJSON Keep-Alive`)**:
   - `chat-web/route.ts` & `streamStudioNdjsonWithRouter` emit `{ type: "keepalive", ts, elapsedMs }` every `8,000ms` while thinking, querying tools, or auto-continuing, preventing TCP/proxy idle drops.
   - `HeyukaUnifiedStudioWorkspace.tsx` handles `ev.type === "keepalive"` to reset `stallTimer` (`300_000ms` idle ceiling per pulse -> practically unbounded total duration) and supports up to `6` client continuation passes.
4. **Async Deep-Job Queue & Poll Channel (`/api/v1/heyuka/deep-job`)**:
   - Provides non-blocking `POST` submission (`jobId`) + `GET ?jobId=...` polling for massive multi-stage research, council synthesis, and full-repo generation that span any duration asynchronously.

---

## 3. Unified 3-Model Command Hierarchy (`HEYUKA Omni`, `HEYUKA Core`, `HEYUKA Vision`)

| Role ID | Command Function | Dedicated HF Token Lane | Primary Free Model Stack |
| :--- | :--- | :--- | :--- |
| **`heyuka-omni`** | Strategic Supreme Commander, Executive Architecture & Cross-Domain Synthesis | `model_1_omni` (`HF_TOKEN`) | `Qwen/Qwen2.5-72B-Instruct`, `deepseek-ai/DeepSeek-R1`, `meta-llama/Llama-3.3-70B-Instruct`, `openai/gpt-oss-120b` |
| **`heyuka-core`** | Engineering, Coding, Mathematical & Moroccan DGI Tax Proof Engine (`T=0.1`) | `model_2_core` (`HF_TOKEN_2`) | `deepseek-ai/DeepSeek-R1`, `Qwen/Qwen2.5-Coder-32B-Instruct`, `qwen/qwen3.8-27b`, `Qwen/Qwen2.5-72B-Instruct` |
| **`heyuka-vision`** | Multimodal Image/Screen Analysis, SoM GUI, 3D WebGL & Media Architect | `model_3_vision` (`HF_TOKEN_3`/`HF_TOKEN_4`) | `gemini-3.8-flash`, `nvidia/nemotron-3.5-super-vl:free`, `google/gemma-4-31b-it:free`, `gpt-4o`, `Qwen/Qwen2.5-72B-Instruct` |

All surfaces follow **Blueprint + Execute-Before-Answer**:
`Intent Deconstruction -> Stepwise Plan -> Mandatory Tool/Sandbox/DGI Verification -> Complete Audited Delivery`.
