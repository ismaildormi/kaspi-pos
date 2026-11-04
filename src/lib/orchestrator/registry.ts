/**
 * KASPI GLOBAL RESOURCE FABRIC (كسب) — Universal Resource Registry
 * 
 * Aggregates all verified cloud providers, serverless endpoints, physical edge nodes,
 * and optional community contributor workers into a single telemetry registry.
 */

import { ResourceNode, AllocationTier } from "./types";

export class GlobalResourceRegistry {
  private static instance: GlobalResourceRegistry;
  private nodes: Map<string, ResourceNode> = new Map();

  private constructor() {
    this.registerDefaultExistingNodes();
  }

  public static getInstance(): GlobalResourceRegistry {
    if (!GlobalResourceRegistry.instance) {
      GlobalResourceRegistry.instance = new GlobalResourceRegistry();
    }
    return GlobalResourceRegistry.instance;
  }

  /**
   * Initializes all verified existing KASPI infrastructure resources.
   * NEVER removes or replaces existing operational nodes.
   */
  private registerDefaultExistingNodes(): void {
    // 1. Neon Serverless PostgreSQL (Frankfurt / Primary Database)
    this.registerNode({
      id: "node-neon-primary",
      name: "Neon Serverless PostgreSQL (Primary DB)",
      providerId: "neon",
      tier: "FREE_TIER",
      region: "de-frankfurt",
      latencyMs: 42,
      isHealthy: true,
      lastHeartbeat: new Date().toISOString(),
      capabilities: [
        { type: "STORAGE", availableCapacity: 450, totalCapacity: 512, unit: "MB" },
        { type: "CPU", availableCapacity: 1.0, totalCapacity: 1.0, unit: "vCPU" },
        { type: "RAM", availableCapacity: 3500, totalCapacity: 4096, unit: "MB" },
      ],
    });

    // 2. Vercel Serverless & Edge Engine (Paris / Frankfurt Anycast)
    this.registerNode({
      id: "node-vercel-edge",
      name: "Vercel Edge & Serverless Functions",
      providerId: "vercel",
      tier: "FREE_TIER",
      region: "fr-paris",
      latencyMs: 35,
      isHealthy: true,
      lastHeartbeat: new Date().toISOString(),
      capabilities: [
        { type: "NETWORK", availableCapacity: 85, totalCapacity: 100, unit: "GB/mo" },
        { type: "CPU", availableCapacity: 2.0, totalCapacity: 2.0, unit: "vCPU" },
        { type: "RAM", availableCapacity: 1024, totalCapacity: 1024, unit: "MB" },
      ],
    });

    // 3. Supabase Cloud Storage & Realtime Channels (Frankfurt)
    this.registerNode({
      id: "node-supabase-storage-realtime",
      name: "Supabase S3 Storage & WebSocket Realtime",
      providerId: "supabase",
      tier: "FREE_TIER",
      region: "de-frankfurt",
      latencyMs: 44,
      isHealthy: true,
      lastHeartbeat: new Date().toISOString(),
      capabilities: [
        { type: "STORAGE", availableCapacity: 920, totalCapacity: 1024, unit: "MB" },
        { type: "NETWORK", availableCapacity: 180, totalCapacity: 200, unit: "sockets" },
      ],
    });

    // 4. Cloudflare Anycast Edge CDN & R2 Backup Pool (Casablanca PoP)
    this.registerNode({
      id: "node-cloudflare-edge-r2",
      name: "Cloudflare Edge & R2 Cold Storage",
      providerId: "cloudflare",
      tier: "FREE_TIER",
      region: "ma-casablanca",
      latencyMs: 1.5,
      isHealthy: true,
      lastHeartbeat: new Date().toISOString(),
      capabilities: [
        { type: "NETWORK", availableCapacity: 999999, totalCapacity: 999999, unit: "GB/mo (Unlimited)" },
        { type: "STORAGE", availableCapacity: 9.8, totalCapacity: 10.0, unit: "GB" },
      ],
    });

    // 5. Google AI Studio & Groq LPU Inference Pods (US / Global)
    this.registerNode({
      id: "node-ai-accelerator-pool",
      name: "Google Gemini 2.5 & Groq LPU Hybrid Pool",
      providerId: "google-cloud",
      tier: "FREE_TIER",
      region: "us-east-virginia",
      latencyMs: 95,
      isHealthy: true,
      lastHeartbeat: new Date().toISOString(),
      capabilities: [
        { type: "AI", availableCapacity: 1400, totalCapacity: 1500, unit: "requests/day" },
        { type: "GPU", availableCapacity: 500, totalCapacity: 500, unit: "tokens/sec", isHardwareAccelerated: true },
      ],
    });

    // 6. Local Physical POS Edge Terminal (In-Store Merchant Hardware)
    this.registerNode({
      id: "node-pos-edge-local",
      name: "KASPI Desktop POS Edge (Tauri Local Runtime)",
      providerId: "tauri-desktop-nodes",
      tier: "GUARANTEED",
      region: "ma-casablanca",
      latencyMs: 0.1,
      isHealthy: true,
      lastHeartbeat: new Date().toISOString(),
      capabilities: [
        { type: "CPU", availableCapacity: 4.0, totalCapacity: 4.0, unit: "Cores" },
        { type: "RAM", availableCapacity: 2048, totalCapacity: 4096, unit: "MB" },
        { type: "STORAGE", availableCapacity: 50, totalCapacity: 100, unit: "GB (Local IndexedDB/Disk)" },
      ],
    });
  }

  public registerNode(node: ResourceNode): void {
    this.nodes.set(node.id, node);
  }

  public unregisterNode(nodeId: string): boolean {
    return this.nodes.delete(nodeId);
  }

  public getNode(nodeId: string): ResourceNode | undefined {
    return this.nodes.get(nodeId);
  }

  public getAllNodes(): ResourceNode[] {
    return Array.from(this.nodes.values());
  }

  public getHealthyNodes(): ResourceNode[] {
    return this.getAllNodes().filter((n) => n.isHealthy);
  }

  public getNodesByTier(tier: AllocationTier): ResourceNode[] {
    return this.getAllNodes().filter((n) => n.tier === tier);
  }

  public updateHeartbeat(nodeId: string, isHealthy: boolean = true): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = new Date().toISOString();
      node.isHealthy = isHealthy;
    }
  }
}
