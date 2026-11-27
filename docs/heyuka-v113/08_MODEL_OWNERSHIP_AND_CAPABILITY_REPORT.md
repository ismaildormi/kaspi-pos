# 08. Model Ownership & Capability Report
- **HEYUKA Omni / Core / Vision:** Orchestration roles & specialized routing layers (`hf-token-pool.ts`, `model-capability-registry.ts`).
- **Owned Sovereign Weights / Checkpoint:** Local LoRA/GRPO/DPO checkpoint artifact `training/sovereign_models/checkpoints/heyuka_sovereign_v111_checkpoint.json` (evaluated standalone at `11/25 [44%]` in `benchmarks/v111/independent-25cat-benchmark.json`).
- **External Foundation Providers:** OpenRouter, Groq, Google Gemini, HuggingFace Inference, GitHub Models, Cerebras, SambaNova (`modelProfilesCount=20`). External APIs are never misrepresented as HEYUKA-owned base weights.
