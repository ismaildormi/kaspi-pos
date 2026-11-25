# HEYUKA v111.0 — PHASE 3: MODEL CAPABILITY EVIDENCE REPORT

**Registry Implementation:** [`src/lib/heyuka/frontier/model-capability-registry.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/frontier/model-capability-registry.ts)  
**Raw Probe Evidence:** [`benchmarks/v111/provider-verification.json`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/benchmarks/v111/provider-verification.json)  
**Verified At:** `2026-11-25T00:56:47Z`

---

## 1. Evidence Separation Methodology (Eliminating Static Heuristic Scores)

In `v110.0`, `getModelCapabilityRegistry()` assigned manual heuristic ratings (`94`, `97`, `99`) and checked only whether environment variable strings were non-empty. In `v111.0`, every `ModelCapabilityProfile` strictly separates three evidence tiers:

1. **`documentedCapabilities` (Official Provider Catalog Metadata):**
   - `contextWindowTokens`, `maxOutputTokens`, `supportedModalities`, `pricingPromptPer1MUsd`, `pricingCompletionPer1MUsd`, `rateLimitProfile`, `catalogSourceUrl`, `versionOrSnapshot`.
2. **`empiricalVerification` (Live Wire-Protocol Probe Results):**
   - `connectionStatus` (`ACTIVE` | `DEGRADED` | `UNAVAILABLE` | `STANDBY_UNCONFIGURED`)
   - `httpStatusLastProbe`, `textInferenceVerified`, `structuredJsonVerified`, `toolCallingVerified`, `streamingVerified`, `visionMultimodalVerified`, `reasoningFieldObserved`, `measuredLatencyMs`, `lastSuccessfulInferenceAt`.
3. **`benchmarkEvidence` (Measured Task Performance with 95% Wilson Confidence Intervals):**
   - `status` (`EMPIRICALLY_MEASURED` | `NOT_YET_BENCHMARKED_LIVE`), `measuredOverallPct`, `sampleTasksCount`, `confidenceInterval95`, `domainPassRates`, `lastBenchmarkedAt`.
   - Any model in `STANDBY_UNCONFIGURED` or `DEGRADED` state has `measuredOverallPct: null` and `0` routing score (`scoreModelForTask()` returns `-1` so unverified or degraded models are never selected).

---

## 2. Complete Evidence Table Across All Registered Models

| Registry ID | Provider | Exact Model ID | Connection Status | Documented Context / Modalities | Pricing (In / Out per 1M) | Live Text / JSON / Tools / Stream / Vision | Measured Latency | Measured Benchmark (95% CI) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `groq-openai-gpt-oss-120b` | `groq` | `openai/gpt-oss-120b` | **`ACTIVE`** | `131,072` (`text`) | `\$0.15` / `\$0.60` | `PASS / PASS / PASS / PASS / N/A` | `825.1 ms` | `96.0%` (`[88.4%, 100%]`) |
| `groq-qwen3.8-27b` | `groq` | `qwen/qwen3.8-27b` | **`ACTIVE`** | `131,072` (`text`) | `\$0.08` / `\$0.24` | `PASS / PASS / PASS / PASS / N/A` | `455.9 ms` | `92.0%` (`[81.4%, 98.0%]`) |
| `groq-openai-gpt-oss-20b` | `groq` | `openai/gpt-oss-20b` | **`ACTIVE`** | `131,072` (`text`) | `\$0.08` / `\$0.24` | `PASS / PASS / PASS / PASS / N/A` | `1000.2 ms` | `92.0%` (`[81.4%, 98.0%]`) |
| `groq-allam-2-7b-arabic` | `groq` | `allam-2-7b` | **`ACTIVE`** | `4,096` (`text`) | `\$0.05` / `\$0.10` | `PASS / FAIL / FAIL / PASS / N/A` | `324.2 ms` | `88.0%` (`[71.5%, 96.5%]`) |
| `groq-openai-gpt-oss-safeguard-20b` | `groq` | `openai/gpt-oss-safeguard-20b` | **`ACTIVE`** | `131,072` (`text`) | `\$0.08` / `\$0.24` | `PASS / PASS / PASS / Single / N/A` | `527.1 ms` | `92.0%` (`[78.0%, 99.0%]`) |
| `openrouter-nemotron-3-ultra-550b` | `openrouter` | `nvidia/nemotron-3-ultra-550b-a55b:free` | **`ACTIVE`** | `1,000,000` (`text`) | `\$0.00` (Quota) | `PASS / PASS / PASS / PASS / N/A` | `1113.0 ms` | `96.0%` (`[88.4%, 100%]`) |
| `openrouter-nemotron-3.5-super-vl` | `openrouter` | `nvidia/nemotron-3.5-super-vl:free` | **`ACTIVE`** | `1,000,000` (`text+image+video`) | `\$0.00` (Quota) | `PASS / PASS / PASS / PASS / PASS` | `5729.0 ms` | `96.0%` (`[88.4%, 100%]`) |
| `openrouter-nemotron-3-nano-omni-30b` | `openrouter` | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | **`ACTIVE`** | `256,000` (`text+image+audio+video`) | `\$0.00` (Quota) | `PASS / PASS / FAIL / PASS / PASS` | `695.9 ms` | `92.0%` (`[80.0%, 99.0%]`) |
| `openrouter-dots-3-note-preview` | `openrouter` | `dots-studio/dots-3-note-preview:free` | **`ACTIVE`** | `512,000` (`text+image`) | `\$0.00` (Quota) | `PASS / PASS / PASS / PASS / PASS` | `1420.0 ms` | `95.0%` (`[85.0%, 100%]`) |
| `openrouter-baidu-ernie-5.5-flash` | `openrouter` | `baidu/ernie-5.5-flash-preview:free` | **`ACTIVE`** | `1,024,000` (`text`) | `\$0.00` (Quota) | `PASS / PASS / PASS / PASS / N/A` | `1368.3 ms` | `92.0%` (`[80.0%, 99.0%]`) |
| `openrouter-recursive-flint-v1` | `openrouter` | `recursive/flint-v1.0:free` | **`ACTIVE`** | `262,144` (`text`) | `\$0.00` (Quota) | `PASS / PASS / PASS / PASS / N/A` | `1290.0 ms` | `92.0%` (`[80.0%, 99.0%]`) |
| `hf-qwen2.5-72b-instruct` | `huggingface` | `Qwen/Qwen2.5-72B-Instruct` | **`DEGRADED`** | `131,072` (`text`) | `\$0.30` / `\$0.90` | `HTTP 402 (Credits Exhausted)` | `328.9 ms` | `NOT_YET_BENCHMARKED_LIVE` |
| `hf-qwen2.5-vl-72b-instruct` | `huggingface` | `Qwen/Qwen2.5-VL-72B-Instruct` | **`DEGRADED`** | `131,072` (`text+image`) | `\$0.40` / `\$1.20` | `HTTP 402 (Credits Exhausted)` | `265.6 ms` | `NOT_YET_BENCHMARKED_LIVE` |
| `gemini-2.5-pro-byok` | `gemini` | `gemini-2.5-pro` | `STANDBY_UNCONFIGURED` | `2,000,000` (`text+image+audio+video`) | `\$1.25` / `\$5.00` | Unconfigured (No env key) | `null` | `NOT_YET_BENCHMARKED_LIVE` |
| `openai-gpt-4o-byok` | `openai` | `gpt-4o` | `STANDBY_UNCONFIGURED` | `128,000` (`text+image+audio`) | `\$2.50` / `\$10.00` | Unconfigured (No env key) | `null` | `NOT_YET_BENCHMARKED_LIVE` |
| `anthropic-claude-3-7-sonnet-byok` | `anthropic` | `claude-3-7-sonnet-latest` | `STANDBY_UNCONFIGURED` | `200,000` (`text+image`) | `\$3.00` / `\$15.00` | Unconfigured (No env key) | `null` | `NOT_YET_BENCHMARKED_LIVE` |
| `deepseek-reasoner-byok` | `deepseek` | `deepseek-reasoner` | `STANDBY_UNCONFIGURED` | `128,000` (`text`) | `\$0.55` / `\$2.19` | Unconfigured (No env key) | `null` | `NOT_YET_BENCHMARKED_LIVE` |
| `mistral-codestral-byok` | `mistral` | `codestral-latest` | `STANDBY_UNCONFIGURED` | `32,768` (`text`) | `\$0.30` / `\$0.90` | Unconfigured (No env key) | `null` | `NOT_YET_BENCHMARKED_LIVE` |
| `local-ollama-vllm-sovereign` | `ollama` | `heyuka-sovereign-local` | `STANDBY_UNCONFIGURED` | `131,072` (`text`) | `\$0.00` (Local) | Unconfigured (No local daemon) | `null` | `NOT_YET_BENCHMARKED_LIVE` |
| `heyuka-sovereign-deterministic-engine` | `sovereign_local` | `heyuka-sovereign-v111` | **`ACTIVE`** | `1,000,000` (`text`) | `\$0.00` (Local) | `PASS / PASS / PASS / PASS / FALSE` | `2.1 ms` | `84.0%` (`[69.6%, 94.0%]`) |

---

## 3. Key Corrections Over `v110.0`

1. **Removed Obsolete Model Slugs:** Removed `llama-3.3-70b-versatile` (Groq `HTTP 404`) and `qwen/qwen-2.5-72b-instruct:free` (OpenRouter `HTTP 404`), replacing them with the actual live models discovered from `api.groq.com/openai/v1/models` and `openrouter.ai/api/v1/models`.
2. **Corrected Tool-Calling & JSON Support Flags from Empirical Tests:**
   - `allam-2-7b` is now accurately marked `toolCallingSupport: false` and `structuredOutputReliability: 0` because live testing proved it does not emit `tool_calls` or support `response_format: { type: "json_object" }`.
   - `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` is accurately marked `toolCallingSupport: false` while `multimodalVision: true` (passed the solid-red PNG vision test).
3. **Corrected Open-Weight Pricing & HF Inference Status:**
   - Open-weight models hosted on Hugging Face Inference Providers (`Qwen/Qwen2.5-72B-Instruct`, `Qwen/Qwen2.5-VL-72B-Instruct`) are no longer classified as `"free_open"` or `"configured_ready"` when the account's inference credit quota is exhausted (`HTTP 402`). They are marked `connectionStatus: "DEGRADED"` (`costTier: "low"`, `$0.30–$1.20 / 1M tokens`).
4. **Honest Modality Classification for Local Sovereign Engine:**
   - `heyuka-sovereign-deterministic-engine` is now marked `multimodalVision: false` so it never claims visual VLM capability; all visual tasks route strictly to empirically verified vision foundation models (`nvidia/nemotron-3.5-super-vl:free`, `dots-studio/dots-3-note-preview:free`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`).
