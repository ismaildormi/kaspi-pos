# HEYUKA v111.0 — PHASE 2: FRONTIER PROVIDER VERIFICATION REPORT

**Verification Artifact:** [`benchmarks/v111/provider-verification.json`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/benchmarks/v111/provider-verification.json)  
**Verification Harness:** [`scripts/v111/verify-frontier-providers.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/scripts/v111/verify-frontier-providers.ts)  
**Adapter Implementation:** [`src/lib/heyuka/frontier/frontier-provider-adapters.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/frontier/frontier-provider-adapters.ts)  
**Verified At:** `2026-11-25T00:56:47Z`

---

## 1. Frontier Provider Adapter Architecture & Wire-Protocol Compliance

[`src/lib/heyuka/frontier/frontier-provider-adapters.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/heyuka/frontier/frontier-provider-adapters.ts) implements native protocol adapters without silent model substitution:

1. **OpenAI Native Adapter (`openai`):**
   - Endpoint: `https://api.openai.com/v1/chat/completions` (and `/v1/models` catalog discovery)
   - Supports: `messages`, `response_format: { type: "json_object" }`, `tools`, multimodal `image_url`, SSE `stream: true`, usage & cost accounting.
   - Current Runtime Status: **`STANDBY_UNCONFIGURED`** (`OPENAI_API_KEY` not present in `.env.local`; supports user BYOK or owner key injection).
2. **Anthropic Native Messages Adapter (`anthropic`):**
   - Endpoint: `https://api.anthropic.com/v1/messages` (`anthropic-version: 2023-06-01`)
   - Supports: native `image` base64 content blocks, `thinking` blocks, `tool_use` blocks, `input_tokens` / `output_tokens` accounting.
   - Current Runtime Status: **`STANDBY_UNCONFIGURED`** (`ANTHROPIC_API_KEY` not present in `.env.local`; supports user BYOK).
3. **Google Gemini Native Adapter (`gemini`):**
   - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent`
   - Supports: native `inlineData` multimodal image/document parts, `systemInstruction`, `responseMimeType: "application/json"`, `thoughtsTokenCount` reasoning token accounting.
   - Current Runtime Status: **`STANDBY_UNCONFIGURED`** (`GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` not present in `.env.local`; supports user BYOK).
4. **Groq LPU Native Adapter (`groq`):**
   - Endpoint: `https://api.groq.com/openai/v1/chat/completions` + catalog `https://api.groq.com/openai/v1/models`
   - Current Runtime Status: **`ACTIVE` (`2` rotated API keys in `GROQ_API_KEYS`, `5` active chat LLMs verified live).**
5. **OpenRouter Multi-Provider Gateway Adapter (`openrouter`):**
   - Endpoint: `https://openrouter.ai/api/v1/chat/completions` + catalog `https://openrouter.ai/api/v1/models` (`441` models catalogued, `13` zero-price models tested live)
   - Current Runtime Status: **`ACTIVE` (`9` active models verified live, including `4` verified multimodal vision models).**
6. **Hugging Face Hub & Inference Providers Adapter (`huggingface`):**
   - Hub API (`https://huggingface.co/api/whoami-v2`): **`ACTIVE` across all 4 tokens (`HF_TOKEN`, `HF_TOKEN_2`, `HF_TOKEN_3`, `HF_TOKEN_4` -> user `zuvyrismail`, read/write verified).**
   - Inference Providers (`https://router.huggingface.co/v1/chat/completions`): **`DEGRADED` (`HTTP 402` — `"Purchase pre-paid credits to continue using Inference Providers"`).**

---

## 2. Notice on Frontier Reference Display Names (`GPT-6.2 Astra`, `Claude Opus 5.5`, `Gemini 4 Argon`)

Per Section 2 of the directive (*"Never assume that a display name is an API model ID. Retrieve exact current model IDs... from official provider documentation"*):
- `GPT-6.2 Astra`, `GPT-6.2 Sol`, `Claude Fable 5.2`, `Claude Opus 5.5`, `Claude Sonnet 5.5`, `Gemini 4 Argon`, `Gemini 4 Hydrogen`, and `Gemini 4 Neon` are target frontier reference names.
- Because `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `GEMINI_API_KEY` are not configured in this environment, those three providers are marked **`STANDBY_UNCONFIGURED`**, no wire model IDs were fabricated for them, and no simulated API calls were made pretending to be GPT, Claude, or Gemini.

---

## 3. Live Empirical Connection & Capability Matrix (20 Models Tested Live)

Every row below comes directly from [`benchmarks/v111/provider-verification.json`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/benchmarks/v111/provider-verification.json) executed via [`scripts/v111/verify-frontier-providers.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/scripts/v111/verify-frontier-providers.ts):

| # | Provider | Exact Wire Model ID | Status | HTTP | Text (`17*19=323`) | JSON Mode | Tool Call (`compute_vat`) | SSE Stream (Chunks / TTFT) | Vision (Red PNG) | Latency |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `groq` | `openai/gpt-oss-120b` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`14` chunks) | N/A (Text) | `825 ms` |
| 2 | `groq` | `openai/gpt-oss-20b` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`12` chunks) | N/A (Text) | `1000 ms` |
| 3 | `groq` | `qwen/qwen3.8-27b` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`11` chunks) | N/A (Text) | `456 ms` |
| 4 | `groq` | `allam-2-7b` | **`ACTIVE`** | `200` | **PASS** (`323`) | FAIL (No JSON mode) | FAIL (No tool call) | **PASS** (`9` chunks) | N/A (Text) | `324 ms` |
| 5 | `groq` | `openai/gpt-oss-safeguard-20b` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | Single-chunk | N/A (Text) | `527 ms` |
| 6 | `openrouter` | `nvidia/nemotron-3-ultra-550b-a55b:free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`4` chunks) | N/A (Text) | `1113 ms` |
| 7 | `openrouter` | `nvidia/nemotron-3.5-super-vl:free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`5` chunks) | **PASS (`"Red"`)** | `5729 ms` |
| 8 | `openrouter` | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | FAIL | **PASS** (`4` chunks) | **PASS (`"Red"`)** | `696 ms` |
| 9 | `openrouter` | `dots-studio/dots-3-note-preview:free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`4` chunks) | **PASS (`"Red"`)** | `1420 ms` |
| 10 | `openrouter` | `baidu/ernie-5.5-flash-preview:free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`3` chunks / `1582ms`) | N/A (Text) | `1368 ms` |
| 11 | `openrouter` | `recursive/flint-v1.0:free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`4` chunks) | N/A (Text) | `1290 ms` |
| 12 | `openrouter` | `nvidia/nemotron-3.5-lightning:free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | FAIL | **PASS** (`3` chunks) | N/A (Text) | `912 ms` |
| 13 | `openrouter` | `particle-ai/particle-1:free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | **PASS** | **PASS** (`4` chunks) | FAIL | `1510 ms` |
| 14 | `openrouter` | `openrouter/free` | **`ACTIVE`** | `200` | **PASS** (`323`) | **PASS** | FAIL | **PASS** (`4` chunks) | **PASS (`"Red"`)** | `1450 ms` |
| 15 | `openrouter` | `google/gemma-4-31b-it:free` | `DEGRADED` | `429` | Upstream 429 | — | — | — | — | `481 ms` |
| 16 | `openrouter` | `google/gemma-4-26b-a4b-it:free` | `DEGRADED` | `429` | Upstream 429 | — | — | — | — | `312 ms` |
| 17 | `openrouter` | `inclusionai/ling-3.2-flash:free` | `DEGRADED` | `429` | Upstream 429 | — | — | — | — | `545 ms` |
| 18 | `openrouter` | `liquid/lfm-3-1.7b:free` | `DEGRADED` | `429` | Upstream 429 | — | — | — | — | `247 ms` |
| 19 | `huggingface` | `Qwen/Qwen2.5-72B-Instruct` | `DEGRADED` | `402` | `402_CREDITS_EXHAUSTED` | — | — | — | — | `329 ms` |
| 20 | `huggingface` | `Qwen/Qwen2.5-VL-72B-Instruct` | `DEGRADED` | `402` | `402_CREDITS_EXHAUSTED` | — | — | — | — | `266 ms` |
