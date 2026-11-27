# 09. Learning, Ingestion & Training Separation Report
- **A. Knowledge Acquisition:** `knowledge-corpus-engine.ts` + `internet-discovery-engine.ts` (provenance + SHA-256 deduplication; does NOT claim weight updates).
- **B. Operational Learning:** `self-evolution-engine.ts` + `persistent-episodic-memory.ts` (7-layer memory & Reflexion rules).
- **C. Model Training:** `training/sovereign_models/train_grpo_dpo_sovereign.py` producing `heyuka_sovereign_v111_checkpoint.json` with separate train/validation/holdout benchmark evaluation.
