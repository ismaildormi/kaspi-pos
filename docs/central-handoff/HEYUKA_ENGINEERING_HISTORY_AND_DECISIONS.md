# HEYUKA AI — Engineering History & Key Decisions

## Verified Git Milestone Timeline (Branch `main`)
1. **`970c5bb` (`v109.1`):** Created `HEYUKA_STANDARD_FILE_2_MODELS_COGNITION_AND_SOURCES.md` (`3,035+` lines) and updated `YUKA_FINAL_100_PERCENT_TEST_RESULTS.md`.
2. **`84bb98a` (`v110.0`):** Implemented Frontier Intelligence layer (`frontier-intelligence-orchestrator.ts`, `model-capability-registry.ts`, `universal-knowledge-fabric.ts`, `persistent-episodic-memory.ts`, `cognitive-evaluation-engine.ts`), `82/82` E2E pass.
3. **`ba12b8f` (`v111.0`):** Forensic verification, live provider probing (`benchmarks/v111/provider-verification.json`), `25`-category live benchmark (`24/25` Full System vs `11/25` Sovereign Alone), Sovereign LoRA checkpoint (`heyuka_sovereign_v111_checkpoint.json`), `83/83` E2E pass.
4. **`25fba9d` (KASPI POS Recovery & Hardening):** Fixed `SEC-P0-01`..`04` unauthenticated `prisma.tenant.findFirst()` fallbacks (`401`), verified Workflows `A`–`G` against Neon PostgreSQL, resolved Rust `cargo check` warnings (`0` warnings), computed `cloc 2.12` stats (`284,899` source LOC across `882` files).
5. **`cc61e1e` (`v112.0`):** Sanitized chat thinking steps (`chat-web/route.ts`, `HeyukaChatWorkspace.tsx`), built `unified-source-memory-fabric.ts`, and verified all `2,280` canonical sources (`verify-all-2810-sources.ts`).
6. **`e6dbef3` (KASPI UI/UX & Geo-IP):** Fixed Pack popover z-index portal, Product `...` menu clipping, Owner-only Studio/Platform sidebar gating, OTP password reset flow, live Dashboard KPI sparklines, wide Register & Branch Topology billing UI, button `whitespace-nowrap`, and Geo-IP locale auto-detection.
7. **`2cdb74e` (`v113.0`):** Added `confidentiality-guard.ts`, enriched canonical registry with license/IO/OS/hardware metadata & `buildSourceRelationshipGraph()` (`270` edges), implemented `internet-discovery-engine.ts`, and generated all 13 `docs/heyuka-v113/` deliverables.

## Key Architectural Decisions Preserved
- **Dual-Brand Preservation:** KASPI POS (multi-tenant Moroccan POS SaaS with PostgreSQL RLS, `Decimal(12,2)`, DGI Art. 145 sequences) and HEYUKA AI coexist safely in the same repository without interference.
- **Honest Model Attribution:** External foundation APIs are never disguised as HEYUKA-owned weights; `heyuka_sovereign_v111_checkpoint.json` is tracked separately from external provider orchestration.
- **Zero-Mandatory-Cost Core:** `$0.00` mandatory cost for users via local deterministic brain, client WASM/three.js/pkzip, and zero-key public APIs.
