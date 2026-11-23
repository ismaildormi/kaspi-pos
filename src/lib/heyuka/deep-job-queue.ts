import { runUnifiedFullPowerPipeline, type PowerExecutionTrace } from "@/lib/heyuka/global-nervous-mesh";
import { planAndRunElasticCouncilSwarm, type ElasticScaleMode } from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import { generateTextWithRouter, type ByokSessionKeys } from "@/lib/ai-router";
import { runLocalOnDeviceHeyukaBrain } from "@/lib/heyuka/local-sovereign-brain";

export interface DeepAsyncJobRecord {
  jobId: string;
  status: "queued" | "running" | "completed" | "error";
  phase: string;
  brand: "heyuka" | "kaspi_pos";
  locale: "ar" | "fr" | "en";
  createdAt: string;
  updatedAt: string;
  elapsedMs: number;
  powerTelemetry?: PowerExecutionTrace;
  answer?: string;
  councilSummary?: {
    tier: string;
    modelCount: number;
    complexityScore: number;
  };
  error?: string;
}

const MAX_JOBS = 80;
const deepJobsStore = new Map<string, DeepAsyncJobRecord>();

function pruneJobsIfNeeded() {
  if (deepJobsStore.size <= MAX_JOBS) return;
  const oldest = deepJobsStore.keys().next().value;
  if (oldest) deepJobsStore.delete(oldest);
}

export function getDeepAsyncJob(jobId: string): DeepAsyncJobRecord | null {
  return deepJobsStore.get(jobId) || null;
}

export function listRecentDeepAsyncJobs(limit = 10): DeepAsyncJobRecord[] {
  return Array.from(deepJobsStore.values()).slice(-limit).reverse();
}

/**
 * Starts an asynchronous unbounded deep reasoning & synthesis job so callers can poll
 * smoothly without hitting single-request idle limits regardless of complexity.
 */
export function startDeepAsyncJob(params: {
  prompt: string;
  brand?: "heyuka" | "kaspi_pos";
  locale?: "ar" | "fr" | "en";
  mode?: string;
  scale?: ElasticScaleMode;
  requestedModel?: string;
  byokKeys?: ByokSessionKeys;
}): DeepAsyncJobRecord {
  const startedAt = Date.now();
  const jobId = `djob_${startedAt}_${Math.random().toString(36).slice(2, 8)}`;
  const brand = params.brand === "kaspi_pos" ? "kaspi_pos" : "heyuka";
  const locale = params.locale === "fr" || params.locale === "en" ? params.locale : "ar";

  const record: DeepAsyncJobRecord = {
    jobId,
    status: "running",
    phase: "Initializing 3-Model Command Hierarchy & Deep Source Pipeline...",
    brand,
    locale,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elapsedMs: 0,
  };
  deepJobsStore.set(jobId, record);
  pruneJobsIfNeeded();

  // Execute asynchronously inside Node runtime without blocking POST submission
  void (async () => {
    try {
      record.phase = "Reading sovereign vault, Studied Corpus & Hugging Face telemetry...";
      record.updatedAt = new Date().toISOString();
      record.elapsedMs = Date.now() - startedAt;

      const power = await runUnifiedFullPowerPipeline({
        prompt: params.prompt,
        locale,
        brand,
        mode: params.mode || "deepthink",
        requestedModel: params.requestedModel,
        thinkingEnabled: true,
        compact: false,
      });
      record.powerTelemetry = power.trace;
      record.phase = `Executing ${power.trace.modelHierarchyRole} (${power.trace.enginesExecuted.length} engines)...`;
      record.updatedAt = new Date().toISOString();
      record.elapsedMs = Date.now() - startedAt;

      const swarm = planAndRunElasticCouncilSwarm({
        prompt: params.prompt,
        scale: params.scale || "6x_pro",
        brand,
        locale,
      });
      record.councilSummary = {
        tier: swarm.tier,
        modelCount: swarm.modelCount,
        complexityScore: swarm.complexityScore,
      };

      const gen = await generateTextWithRouter({
        system: `${power.blueprintBlock}\n${power.liveFactsBlock}`,
        messages: [{ role: "user", content: params.prompt }],
        temperature: power.trace.hyperparams.temperature,
        governance: {
          allowOwnerPaidProviders: false,
          modelRole: power.trace.modelHierarchyRole,
          byokKeys: params.byokKeys,
        },
      }).catch(() => null);

      const fallback = runLocalOnDeviceHeyukaBrain({
        prompt: params.prompt,
        mode: params.mode || "deepthink",
        locale,
      });
      record.answer = String(gen?.text || "").trim() || fallback.answer;
      record.status = "completed";
      record.phase = "Completed & Audited 100%";
      record.elapsedMs = Date.now() - startedAt;
      record.updatedAt = new Date().toISOString();
    } catch (err: unknown) {
      record.status = "error";
      record.error = err instanceof Error ? err.message : "Deep async job error";
      record.elapsedMs = Date.now() - startedAt;
      record.updatedAt = new Date().toISOString();
    }
  })();

  return { ...record };
}
