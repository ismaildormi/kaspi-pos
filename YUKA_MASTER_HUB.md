# HEYUKA / Yuka Sovereign Architecture Hub (`v12.1` – `v14.0`)

Reference index tying together the progressive skills standard, Cowork persistent session runtime, context hygiene safeguards, autonomous tool hunting, and API gateway architecture.

## Implemented Core Modules

1. **Root Constitution & Domain-Bucketed Skills (`v12.3` – `v12.6`)**
   - Root guide: `YUKA.md`
   - Progressive Skill Tree (`YAML Frontmatter` Level-1 metadata + Level-2 body): `skills/<domain>/<slug>/SKILL.md`
   - Runtime engine: `src/lib/zebra-x/core/skills-vault.ts`
     - `getProgressiveSkillIndex()` / `buildLevel1SkillPromptIndex()`
     - `loadSkillInstructionsOnDemand()`
     - `authorSkillFromSuccess()` (produces `SKILL.md`, updates Voyager skills, exports `.yuka-skill/v1`)
     - `convertPatternOrRuleToYukaSkill()` (Fabric / `.mdc` Cursor rules adapter)
     - `importExternalSkillRepoCatalog()` (SSRF-allowlisted GitHub indexer)

2. **Persistent Cowork Sessions & Context Hygiene (`v12.1`, `v12.2`, `v12.4`, `v12.5`)**
   - Runtime engine: `src/lib/zebra-x/core/cowork-session.ts`
     - `saveCoworkCheckpoint()` / `resumeCoworkSession()` (`Dexie` IndexedDB + SSR Map fallback)
     - `scanBrowserWorkspaceDirectory()` (Browser File System Access API read-only folder workspace inspection, POS-locked via `assertPosCoreImmutable`)
     - `compactConversationMessages()` & `pruneOldToolOutputs()`
     - `loadHierarchicalYukaContext()` & `evaluateClarificationGate()`
     - `spawnParallelSubAgents()` (isolated concurrent research/code/verify worker summaries)
   - Dynamic Tool Masking: `selectMaskedActiveTools()` inside `src/lib/zebra-x/core/router.ts`
   - UI Surface: Expanded-mode `Folder` & `Plan` toggles + live Cowork task pill strip inside `src/components/ai/AIChatWidget.tsx`.

3. **Big-Tech Catalog Indexer, Frontier Capabilities & Autonomous Tool Hunter (`v12.8` – `v13.2`)**
   - Runtime engine: `src/lib/zebra-x/core/catalog-hunter.ts`
     - `BIG_TECH_OFFICIAL_ORGS` & `fetchBigTechOrgRepos()` (Microsoft, Google, Meta, Anthropic, xAI, HuggingFace, NVIDIA, Cloudflare)
     - `FRONTIER_OPEN_ECOSYSTEM_INDEX` (Video, Music, Voice, Image, App Builders, Deep Research & Isolation benchmarks)
     - `autonomousToolHunt()` (live GitHub Search / NPM / HuggingFace discovery + `executePolyglotCodeSandbox` verification + auto-authored skill storage)

4. **Unified Developer API Keys, Key IDs & Authentic 3D Showcase (`v12.0` – `v14.0`)**
   - Key formats supported everywhere: `hk-live-...` (`hk_...`), `yk-live-...` (`yk_...`), and `zx-live-...` (`zk_...`) across `src/lib/zebra-x/api-auth.ts`, `src/middleware.ts`, `src/app/api/v1/zebra-x/keys/route.ts`, and `src/components/zebra-portal/XZebraPlatformPortal.tsx`.
   - Authentic 3D Three.js character engine (`FluffCreature`, `CharacterAccessories`, Elemental Fire/Ice/Rock, GPGPU fur) isolated cleanly under `src/lib/heyuka/engine/` & mounted dynamically (`ssr: false`) via `src/components/heyuka/HEYUKACreatureCanvas.tsx`.
   - Interactive 4-stage Onboarding & Download Guide: `src/components/heyuka/HEYUKAInstallWalkthrough.tsx`.
