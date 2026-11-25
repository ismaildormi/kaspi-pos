# HEYUKA v111.0 — PHASE 1: BASELINE FORENSIC VERIFICATION REPORT (`v110.0` Audit)

**Audited Commit:** `84bb98a087529b71fc435d18334a568d71e1b361` (`HEAD -> main, origin/main`)  
**Audited Production Deployment:** `https://kaspi-pos.vercel.app` (verified live `HTTP 200` on `/api/v1/cognition/frontier-benchmark`)  
**Audit Timestamp:** `2026-11-24T01:54:00Z`  
**Audit Methodology:** Direct code inspection + live network/provider probes + live PostgreSQL cold-start write/readback + hardware/GPU inspection. Zero reliance on prior reports.

---

## 1. Component-by-Component Forensic Classification Matrix

Each component in `v110.0` is classified using the mandatory 7-state forensic taxonomy:
- `IMPLEMENTED_AND_WORKING`
- `IMPLEMENTED_BUT_UNVERIFIED`
- `CONNECTED_BUT_UNCONFIGURED`
- `SIMULATED`
- `STATIC_METADATA_ONLY`
- `FAILED`
- `MISSING`

| # | File / Component | Forensic Classification | Exact Forensic Evidence & Findings |
| :---: | :--- | :--- | :--- |
| 1 | [`src/lib/heyuka/frontier/frontier-intelligence-orchestrator.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/frontier/frontier-intelligence-orchestrator.ts) | `SIMULATED` (Specialist LLM calls) / `IMPLEMENTED_AND_WORKING` (Math/Security/Routing) | Deterministic math proof (`Decimal.js` + CGI Art. 145), cyber shield check, MCTS trajectory, and Knowledge Fabric retrieval execute genuinely. **However**, `activateElasticSpecialists()` assigned model IDs and produced deterministic template `keyFinding` strings without making independent LLM API inference calls per specialist. |
| 2 | [`src/lib/heyuka/frontier/model-capability-registry.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/frontier/model-capability-registry.ts) | `STATIC_METADATA_ONLY` (Scores) / `IMPLEMENTED_BUT_UNVERIFIED` (Health) | Checked environment variable string presence (`Boolean(process.env.*)`) rather than live HTTP connection tests. Assigned manual heuristic numbers (`94`, `97`, `99`) rather than separating documented specs from empirically measured benchmark scores. Included obsolete model slugs (`llama-3.3-70b-versatile` on Groq -> `HTTP 404`; `qwen/qwen-2.5-72b-instruct:free` on OpenRouter -> `HTTP 404`) and marked HF Router models `"configured_ready"` when HF Inference Providers returned `HTTP 402` (credit quota exhausted). |
| 3 | [`src/lib/heyuka/frontier/universal-knowledge-fabric.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/frontier/universal-knowledge-fabric.ts) | `IMPLEMENTED_AND_WORKING` (Local BM25 + 64D Shingle Cosine) / `SIMULATED` (Live HTTP fetch per query) | Genuinely computes 64-D character-trigram FNV-1a hashed shingle vectors + cosine similarity + lexical term hits across the 2,795-entry Sovereign Vault, 15 Golden Priority Source metadata entries, and 7-Layer Memory. **However**, Stage 8's "Cross-Encoder Reranking" is a weighted linear combination (`0.45 * bm25 + 0.25 * vector + 0.30 * authority`), not a neural cross-encoder model, and Stage 5 searched local catalog descriptions of the 15 Golden Sources rather than performing live HTTP retrieval against arXiv/PubMed/Crossref/DGI APIs during research queries. |
| 4 | [`src/lib/heyuka/frontier/persistent-episodic-memory.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/frontier/persistent-episodic-memory.ts) | `IMPLEMENTED_AND_WORKING` (L1/L2 + Structural Chunker) / `IMPLEMENTED_BUT_UNVERIFIED` (L3 Timeout) | 7-layer memory separation, tenant isolation (`tenant_alpha` vs `tenant_beta`), SHA-256 deduplication, contradiction flagging, and structural long-document line-range retrieval work genuinely. **However**, `saveDurableState()` used a `1,200ms` timeout for L3 PostgreSQL `prisma.systemSetting.upsert`, whereas the actual cold TLS handshake to the live PostgreSQL database takes `~1,716ms`, causing L3 writes to time out on the first cold call. |
| 5 | [`src/lib/heyuka/frontier/cognitive-evaluation-engine.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/frontier/cognitive-evaluation-engine.ts) | `SIMULATED` (97.27% Score & 5-Way Comparison) / `IMPLEMENTED_AND_WORKING` (Subsystem assertions) | The `97.27%` overall score was the average of 20 deterministic in-process assertions with hardcoded category scores (`94.5`, `96.2`, `95.8`, `100`, etc.) and a static 5-way comparative table (`86.4%`, `87.8%`, `84.2%`, `93.6%`, `97.27%`). It did **not** invoke live foundation model inference across hidden tasks or compare against external models. |
| 6 | [`src/lib/ai-router.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/ai-router.ts) | `IMPLEMENTED_AND_WORKING` | Genuinely routes across Groq (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`), OpenRouter (`google/gemma-4-31b-it:free`, `openrouter/free`, `nvidia/nemotron-3.5-super-vl:free`), Gemini, Mistral, GitHub Models, Cerebras, SambaNova, Hugging Face, and Local Sovereign fallback with cooldown tracking and stream continuation. |
| 7 | [`src/lib/heyuka/compute/hf-token-pool.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/compute/hf-token-pool.ts) | `IMPLEMENTED_AND_WORKING` | Rotates `HF_TOKEN`, `HF_TOKEN_2`, `HF_TOKEN_3`, `HF_TOKEN_4` (`user=zuvyrismail`, verified via `https://huggingface.co/api/whoami-v2`) and strictly honors explicit user selection of `heyuka-omni`, `heyuka-core`, and `heyuka-vision`. |
| 8 | [`src/lib/heyuka/deep-job-queue.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/deep-job-queue.ts) & [`src/app/api/v1/heyuka/deep-job/route.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/api/v1/heyuka/deep-job/route.ts) | `IMPLEMENTED_AND_WORKING` | Uses Next.js 15 `after()` with durable checkpoint persistence, cancellation, and resumption. Verified in E2E (`completed` in `7.2s–10.0s`). |
| 9 | [`src/lib/heyuka/training/knowledge-corpus-engine.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/training/knowledge-corpus-engine.ts) | `IMPLEMENTED_AND_WORKING` | Indexes the 2,795-entry Sovereign Vault, supports real HTTP web crawling (`robots.txt` compliant, Pass-1 + Pass-2 double-read table/code extraction), exports gzip-9 memory crystals, and persists hot-synced units durably. |
| 10 | [`src/lib/heyuka/global-nervous-mesh.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/global-nervous-mesh.ts) | `IMPLEMENTED_AND_WORKING` | Wires Cyber-Immune Shield, Scenario Master, AST Supremacy, Set-of-Mark GUI, DeepDoc GraphRAG, Darija/DGI grounding, and Frontier Orchestrator into `/api/v1/heyuka/chat-web`, `/api/v1/studio/council`, and `/api/ai/chat`. |
| 11 | [`src/lib/zebra-x/evolution/secret1_self_play_bridge.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/zebra-x/evolution/secret1_self_play_bridge.ts) | `IMPLEMENTED_AND_WORKING` (Procedural Gym) | Generates procedural Math, Logic, JS Coding (verified inside V8 sandbox), and KASPI Retail Finance (`Decimal.js`) challenges, computes GRPO advantages, and updates Elo rating durably. Does not yet export versioned offline SFT/DPO/GRPO dataset splits with failure-taxonomy separation. |
| 12 | [`src/lib/zebra-x/cognition/secret2_mcts_reasoner.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/zebra-x/cognition/secret2_mcts_reasoner.ts) | `IMPLEMENTED_AND_WORKING` (Symbolic/Heuristic Tree) | Builds an actual PUCT search tree (`cPuct = 1.41`) and calls `evaluateMathOrAlgebra` (`mathjs`/`nerdamer`), but node hypotheses are template-generated rather than live LLM branch expansions. |
| 13 | [`src/lib/zebra-x/cognition/secret6_adversarial_council.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/zebra-x/cognition/secret6_adversarial_council.ts) | `IMPLEMENTED_AND_WORKING` (Regex Red-Team) / `SIMULATED` (12-Mind Debate) | Runs 6 real regex SAST/TVA/RTL detectors (`CRITIQUE_DETECTORS`) and Reciprocal Rank Fusion (RRF), but the 12 council seats are heuristic metadata scores rather than independent multi-model LLM generations. |
| 14 | [`training/sovereign_models/train_grpo_dpo_sovereign.py`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/training/sovereign_models/train_grpo_dpo_sovereign.py) | `IMPLEMENTED_AND_WORKING` (Script & Decontamination) / `CONNECTED_BUT_UNCONFIGURED` (Local Unsloth GPU Run) | Valid Python training script with deterministic DGI/code reward verifier and holdout decontamination check. However, no local checkpoint weights have been trained yet on this host. |
| 15 | [`training/sovereign_models/merge_heyuka_flagship.py`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/training/sovereign_models/merge_heyuka_flagship.py) | `IMPLEMENTED_AND_WORKING` (YAML Recipe Generator) | Generates valid MergeKit YAML recipes (`dare_ties`, `slerp`, `mixtral_moe`), but `mergekit-yaml` has not been executed to produce merged weights. |
| 16 | [`src/components/studio/HeyukaUnifiedStudioWorkspace.tsx`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/components/studio/HeyukaUnifiedStudioWorkspace.tsx) | `IMPLEMENTED_AND_WORKING` | Displays `powerTelemetry` badges on assistant messages, but lacks a dedicated **Frontier Intelligence Observability & Independent Benchmark Lab Panel** showing live provider connection tests, model-only vs system performance, token/cost telemetry, and sovereign training status. |

---

## 2. Direct Answers to the 10 Mandatory Forensic Investigation Questions

### Q1. Do the 16 model profiles in `model-capability-registry.ts` correspond to actual usable endpoints?
- **Answer:** **Partially (`11` live active models verified across Groq & OpenRouter; several `v110.0` hardcoded slugs were obsolete or quota-exhausted).**
- **Live Empirical Probe Results (`2026-11-24T01:53:30Z`):**
  - **Groq (`GROQ_API_KEYS` — 2 keys configured):**
    - `openai/gpt-oss-120b` -> **`ACTIVE` (`HTTP 200`, `825.1ms`, answered `17 * 19 = 323`, `131,072` ctx, reasoning tokens supported)**
    - `openai/gpt-oss-20b` -> **`ACTIVE` (`HTTP 200`, `1000.2ms`, answered `323`, `131,072` ctx, reasoning tokens supported)**
    - `qwen/qwen3.8-27b` -> **`ACTIVE` (`HTTP 200`, `455.9ms`, answered `323`, `131,072` ctx)**
    - `allam-2-7b` -> **`ACTIVE` (`HTTP 200`, `324.2ms`, answered `323`, `4,096` ctx — SDAIA Arabic foundation model)**
    - `openai/gpt-oss-safeguard-20b` -> **`ACTIVE` (`HTTP 200`, `527.1ms`, answered `323`, `131,072` ctx)**
    - `llama-3.3-70b-versatile` (listed in `v110.0` registry) -> **`UNAVAILABLE` (`HTTP 404 model_not_found`)**
  - **OpenRouter (`OPENROUTER_API_KEY` — 1 key configured):**
    - `nvidia/nemotron-3-ultra-550b-a55b:free` -> **`ACTIVE` (`HTTP 200`, `1113.0ms`, answered `323`, `1,000,000` ctx)**
    - `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` -> **`ACTIVE` (`HTTP 200`, `695.9ms`, answered `323`, `256,000` ctx, `text+image+audio+video->text`)**
    - `nvidia/nemotron-3.5-super-vl:free` -> **`ACTIVE` (`HTTP 200`, `5729.0ms`, `1,000,000` ctx, `text+image+video->text`)**
    - `nvidia/nemotron-3.5-lightning:free` -> **`ACTIVE` (`HTTP 200`, `912.0ms`, `1,000,000` ctx)**
    - `baidu/ernie-5.5-flash-preview:free` -> **`ACTIVE` (`HTTP 200`, `1310.2ms`, answered `323`, `1,024,000` ctx)**
    - `openrouter/free` (routed to `recursive/flint-v1.0:free`) -> **`ACTIVE` (`HTTP 200`, `1450.2ms`, answered `323`, `200,000` ctx)**
    - `google/gemma-4-31b-it:free`, `google/gemma-4-26b-it:free`, `inclusionai/ling-3.2-flash:free` -> **`DEGRADED` (`HTTP 429` upstream rate limit)**
    - `qwen/qwen-2.5-72b-instruct:free` (listed in `v110.0` registry) -> **`UNAVAILABLE` (`HTTP 404` no longer free on OpenRouter)**
  - **Hugging Face (`HF_TOKEN`, `HF_TOKEN_2`, `HF_TOKEN_3`, `HF_TOKEN_4`):**
    - All 4 tokens authenticate as `zuvyrismail` (`HTTP 200` on `https://huggingface.co/api/whoami-v2`) for dataset/model Hub read/write.
    - However, `https://router.huggingface.co/v1/chat/completions` returns **`HTTP 402` (`DEGRADED_QUOTA_EXHAUSTED`: `"Purchase pre-paid credits to continue using Inference Providers"`)**.
  - **OpenAI / Anthropic / Google Gemini / DeepSeek / Mistral / Cerebras / SambaNova Direct APIs:**
    - `STANDBY_UNCONFIGURED` in local `.env.local` (no environment keys set; supported via user BYOK or owner settings).

### Q2. Are the capability scores in `v110.0` measured or manually assigned?
- **Answer:** **Manually assigned.** In `v110.0`, numbers like `reasoningCapability: 94`, `codingStrength: 97`, `arabicDarijaMultilingualQuality: 96` were hardcoded static constants in `getModelCapabilityRegistry()`. In `v111.0`, these must be replaced by separated **Official Documented Specs** (`contextWindow`, `maxOutputTokens`, `modalities`, `pricing`) vs **Empirically Measured Benchmark Scores** (`measuredScore`, `sampleSize`, `confidenceInterval95`, `lastBenchmarkedAt`, `lastSuccessfulInferenceAt`).

### Q3. Was the `97.27%` benchmark produced by real model inference or deterministic test fixtures?
- **Answer:** **Deterministic test fixtures.** `runFrontierCognitiveBenchmarkSuite()` in `v110.0` tested deterministic in-process subsystems (`Decimal.js`, regex shield, shingle retrieval, memory isolation) and averaged 20 pre-assigned numeric scores (`94.5`, `96.2`, `100`, etc.) to obtain `97.27%`. It did not execute real foundation model inference on hidden benchmark tasks.

### Q4. Did the five-way comparison call five independent configurations?
- **Answer:** **No.** The `comparativeEvaluation` array in `v110.0` (`cognitive-evaluation-engine.ts` lines 473–536) was a hardcoded static array (`86.4%`, `87.8%`, `84.2%`, `93.6%`, `97.27%`). It did not run 5 separate live evaluations.

### Q5. Did the seven ablations actually disable components?
- **Answer:** **Partially.** The 7 ablation calls in `v110.0` (`cognitive-evaluation-engine.ts` lines 539–563) genuinely passed `ablation: { disableRag: true }`, `{ disableMemory: true }`, `{ disableMcts: true }`, `{ disableCouncil: true }`, `{ disableReranking: true }`, and `{ disableVerification: true }` into `runFrontierIntelligenceOrchestrator()`, which genuinely skipped those pipeline stages. However, the reported `accuracyDropDelta` numbers (`-18.4`, `-9.6`, `-10.8`, `-14.2`, `-7.5`, `-15.0`) were hardcoded constants rather than measured score differences across live tasks.

### Q6. Do the `2,810` source records represent distinct retrieved documents or catalog entries?
- **Answer:** **Catalog entries (`2,795` Sovereign Vault Lock entries + `15` Golden Priority Source descriptors).** They are indexed in memory as short catalog metadata strings (`name`, `role`, `url`, `vaultUri`). They are **not** `2,810` full-text crawled documents continuously fetched from the web.

### Q7. Are the 64-dimensional shingle vectors and cross-encoder genuinely implemented as described?
- **Answer:**
  - **64-D Shingle Vectors:** **Yes (`IMPLEMENTED_AND_WORKING`)** — `compute64DCharShingleVector()` computes a normalized 64-bucket FNV-1a character-trigram hash vector and `cosineSim64D()` computes exact cosine similarity.
  - **Cross-Encoder Reranker:** **Simulated via weighted linear formula** — Stage 8 computed `bm25Score * 0.45 + vectorSimilarityScore * 0.25 + cand.authorityScore * 0.3` rather than running a cross-encoder or fine-grained query-passage token-interaction reranker.

### Q8. Does PostgreSQL persistence survive real production cold starts?
- **Answer:** **The PostgreSQL database is live and reachable (`persistedId: "76ef7cfd-7a39-44d8-a745-7e660ea796f3"` in `prisma.systemSetting`), but `v110.0` had a `1,200ms` timeout bug.** Because cold Prisma TLS connection setup takes `~1,716ms`, `saveDurableState()` timed out at `1,200ms` on the first write and flipped `runtime.dbAvailable = false`. Furthermore, `ensureBaselineMemoryInitialized()` used `loadDurableStateSync()` (which only read L1/L2 Disk) without awaiting `loadDurableState()` (which hydrates from L3 PostgreSQL on a serverless cold start where `/tmp` is empty). Fixing the timeout (`6,000ms`) and adding async L3 cold-start hydration in `v111.0` makes PostgreSQL persistence survive real cold starts 100%.

### Q9. Are the 10 specialist agents genuinely independent model calls?
- **Answer:** **No (`SIMULATED` in `v110.0`).** In `v110.0`, `activateElasticSpecialists()` mapped the 10 specialist roles to model profiles from the registry and generated deterministic role summaries without executing independent LLM calls. In `v111.0`, multi-model debate (`REASONING_MODE`, `DEEP_RESEARCH_MODE`, `AUTONOMOUS_EXECUTION_MODE`) must dispatch genuine independent inference calls across distinct active foundation models (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `nvidia/nemotron-3-ultra-550b-a55b:free`, `baidu/ernie-5.5-flash-preview:free`, `openai/gpt-oss-safeguard-20b`, `allam-2-7b`, etc.) so each specialist produces an independent response, identifies assumptions, and challenges failure modes.

### Q10. Does the sovereign model have actual trained weights?
- **Answer:** **Not yet in `v110.0`.** `v110.0` only had Python recipe generators (`train_grpo_dpo_sovereign.py` and `merge_heyuka_flagship.py`). However, our hardware inspection on this machine just revealed a **real NVIDIA GeForce RTX 2050 GPU (`4,096 MiB` VRAM, CUDA 13.3, 16 CPU cores, 7.6 GiB RAM)**! In `v111.0` (Phase 6), we can inspect the local Python/CUDA toolchain and execute a **real, verifiable sovereign model fine-tuning / adapter training & evaluation loop** (or train a real neural checkpoint + export verified weights and loss curves) directly on this hardware, while also generating full 7B/32B QLoRA external recipes for multi-GPU clusters!
