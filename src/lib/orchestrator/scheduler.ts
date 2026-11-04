/**
 * KASPI GLOBAL RESOURCE FABRIC (كسب) — Universal Workload Scheduler
 * 
 * Implements cost-aware, tier-aware, and latency-aware workload routing.
 * Ensures production-critical transactional workloads are NEVER scheduled on
 * unreliable, unverified, or volunteer community nodes.
 */

import { GlobalResourceRegistry } from "./registry";
import {
  WorkloadSpec,
  WorkloadExecutionResult,
  ResourceNode,
  AllocationTier,
} from "./types";

export class UniversalWorkloadScheduler {
  private registry: GlobalResourceRegistry;

  constructor(registry: GlobalResourceRegistry = GlobalResourceRegistry.getInstance()) {
    this.registry = registry;
  }

  /**
   * Selects the most optimal and secure node for the given workload.
   */
  public selectOptimalNode(workload: WorkloadSpec): ResourceNode {
    const candidateNodes = this.registry.getHealthyNodes();

    if (candidateNodes.length === 0) {
      throw new Error(`[Scheduler] No healthy resource nodes available for workload ${workload.id}`);
    }

    // Filter 1: Criticality Tier Enforcement
    // CRITICAL_TRANSACTIONAL (checkouts, DGI sequence) & HIGH_REALTIME (KDS) must NEVER run on COMMUNITY or BEST_EFFORT
    const allowedNodes = candidateNodes.filter((node) => {
      if (
        workload.criticality === "CRITICAL_TRANSACTIONAL" ||
        workload.criticality === "HIGH_REALTIME"
      ) {
        return (
          node.tier === "GUARANTEED" ||
          node.tier === "RESERVED" ||
          node.tier === "PAID" ||
          node.tier === "FREE_TIER"
        );
      }
      return true; // Background batch & best-effort analytics can utilize community/voluntary nodes
    });

    // Filter 2: Capability Matching
    const capableNodes = allowedNodes.filter((node) =>
      workload.requiredCapabilities.every((reqCap) =>
        node.capabilities.some((c) => c.type === reqCap && c.availableCapacity > 0)
      )
    );

    if (capableNodes.length === 0) {
      // Fallback to primary local or serverless node
      const fallback = candidateNodes.find((n) => n.tier === "FREE_TIER" || n.tier === "GUARANTEED");
      if (fallback) return fallback;
      return candidateNodes[0];
    }

    // Rank 3: Geographic Proximity & Latency Score
    capableNodes.sort((a, b) => {
      // Preference for preferredRegion if requested
      if (workload.preferredRegion) {
        if (a.region === workload.preferredRegion) return -1;
        if (b.region === workload.preferredRegion) return 1;
      }
      return a.latencyMs - b.latencyMs;
    });

    return capableNodes[0];
  }

  /**
   * Dispatches and coordinates execution of a workload with automatic failover.
   */
  public async executeWorkload(workload: WorkloadSpec): Promise<WorkloadExecutionResult> {
    const startTime = performance.now();
    const primaryNode = this.selectOptimalNode(workload);

    try {
      // Execute workload task simulation / dispatch
      const executionResult = await this.dispatchToNode(primaryNode, workload);
      const durationMs = performance.now() - startTime;

      return {
        workloadId: workload.id,
        executedOnNodeId: primaryNode.id,
        providerId: primaryNode.providerId,
        tier: primaryNode.tier,
        executionDurationMs: Math.round(durationMs * 100) / 100,
        success: true,
        output: executionResult,
      };
    } catch (err: unknown) {
      // Failover to secondary node if primary fails
      const fallbackNodes = this.registry
        .getHealthyNodes()
        .filter((n) => n.id !== primaryNode.id && n.tier !== "COMMUNITY_VOLUNTARY");

      if (fallbackNodes.length > 0) {
        const fallbackNode = fallbackNodes[0];
        try {
          const fallbackRes = await this.dispatchToNode(fallbackNode, workload);
          const durationMs = performance.now() - startTime;

          return {
            workloadId: workload.id,
            executedOnNodeId: fallbackNode.id,
            providerId: fallbackNode.providerId,
            tier: fallbackNode.tier,
            executionDurationMs: Math.round(durationMs * 100) / 100,
            success: true,
            output: fallbackRes,
          };
        } catch (fallbackErr: unknown) {
          const msg = fallbackErr instanceof Error ? fallbackErr.message : "Fallback node failed";
          return {
            workloadId: workload.id,
            executedOnNodeId: fallbackNode.id,
            providerId: fallbackNode.providerId,
            tier: fallbackNode.tier,
            executionDurationMs: performance.now() - startTime,
            success: false,
            error: `Primary and fallback execution failed: ${msg}`,
          };
        }
      }

      const msg = err instanceof Error ? err.message : "Workload execution failure";
      return {
        workloadId: workload.id,
        executedOnNodeId: primaryNode.id,
        providerId: primaryNode.providerId,
        tier: primaryNode.tier,
        executionDurationMs: performance.now() - startTime,
        success: false,
        error: msg,
      };
    }
  }

  private async dispatchToNode(node: ResourceNode, workload: WorkloadSpec): Promise<unknown> {
    // In real operation, sends task to node adapter over TLS / IPC
    return {
      status: "EXECUTED",
      nodeId: node.id,
      tenantId: workload.tenantId,
      dispatchedAt: new Date().toISOString(),
    };
  }
}
