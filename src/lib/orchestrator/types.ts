/**
 * KASPI GLOBAL RESOURCE FABRIC (كسب) — Universal Orchestrator Types
 * 
 * Defines standard interfaces for multi-provider resource aggregation,
 * capacity scheduling, and health telemetry.
 */

export type AllocationTier =
  | "GUARANTEED"          // SLA-backed dedicated production capacity
  | "RESERVED"            // Pre-allocated serverless/managed instance
  | "PAID"                // Pay-as-you-go elastic on-demand capacity
  | "FREE_TIER"           // Verified legitimate zero-cost provider quota
  | "TRIAL"               // Temporary promotional trial (never for primary prod)
  | "COMMUNITY_VOLUNTARY" // Explicit opt-in community/merchant desktop contributor node
  | "BEST_EFFORT"         // Non-critical background worker node
  | "DEV_ONLY";           // Local test & development environment

export type ResourceCapabilityType =
  | "CPU"      // Background calculations, data transformations, reporting
  | "RAM"      // In-memory caching, workers, transient buffer
  | "GPU"      // Hardware-accelerated ML inference & visual OCR
  | "STORAGE"  // Object storage, encrypted backups, archival data
  | "NETWORK"  // CDN edge delivery, Anycast routing, bandwidth
  | "AI";      // Specialized LLM / LPU language model inference

export type WorkloadCriticality =
  | "CRITICAL_TRANSACTIONAL" // Cashier checkouts, DGI invoices, financial payments
  | "HIGH_REALTIME"          // Kitchen Display System (KDS), stock alerts
  | "STANDARD_INTERACTIVE"   // AI Assistant queries, catalog browse, admin dashboard
  | "BACKGROUND_BATCH"       // End-of-day Z-reports, image compression, backup replication
  | "BEST_EFFORT_ANALYTICS"; // Long-term forecasting, aggregated trend calculations

export interface ResourceCapability {
  type: ResourceCapabilityType;
  availableCapacity: number; // In standardized units (e.g. vCPU cores, MB RAM, GB Storage, tokens/sec)
  totalCapacity: number;
  unit: string;
  isHardwareAccelerated?: boolean;
}

export interface ResourceNode {
  id: string;
  name: string;
  providerId: string;
  tier: AllocationTier;
  region: string;
  latencyMs: number;
  capabilities: ResourceCapability[];
  isHealthy: boolean;
  lastHeartbeat: string;
  contributorConsent?: {
    isExplicitOptIn: boolean;
    maxCpuPercent: number;
    maxRamMB: number;
    allowBatteryPower: boolean;
    canStopImmediately: boolean;
  };
}

export interface WorkloadSpec {
  id: string;
  name: string;
  criticality: WorkloadCriticality;
  requiredCapabilities: ResourceCapabilityType[];
  tenantId: string;
  preferredRegion?: string;
  payload: unknown;
  timeoutMs?: number;
}

export interface WorkloadExecutionResult {
  workloadId: string;
  executedOnNodeId: string;
  providerId: string;
  tier: AllocationTier;
  executionDurationMs: number;
  success: boolean;
  output?: unknown;
  error?: string;
}
