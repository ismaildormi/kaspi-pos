/**
 * KASPI GLOBAL RESOURCE FABRIC (كسب) — Master Orchestrator Export
 */

export * from "./types";
export * from "./registry";
export * from "./scheduler";
export * from "./adapters";

import { GlobalResourceRegistry } from "./registry";
import { UniversalWorkloadScheduler } from "./scheduler";

export function getGlobalOrchestrator(): {
  registry: GlobalResourceRegistry;
  scheduler: UniversalWorkloadScheduler;
} {
  const registry = GlobalResourceRegistry.getInstance();
  const scheduler = new UniversalWorkloadScheduler(registry);
  return { registry, scheduler };
}
